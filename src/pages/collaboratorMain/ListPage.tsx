import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Skeleton } from "primereact/skeleton";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";
import { userState } from "../../utils/atom/authAtom";
import { 
  collaboration_getAllList_api,
  collaboration_renameAList_api 
} from "../../utils/api/collaborationData";
import { collabProjectState } from "../../utils/atom/collabAuthAtom";

interface ListType {
  name: string;
  total: number;
  updatedAt?: string;
  createdAt?: string;
  description?: string;
}

export default function Collab_ListPage() {
  const navigate = useNavigate();
  const user = useRecoilValue(userState);
  const collabProject = useRecoilValue(collabProjectState);

  // CHECK IF VIEWER
  const isViewer = collabProject?.permission === "viewer";

  const [loading, setLoading] = useState(false);
  const [existingList, setExistingList] = useState<ListType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Rename Modal State
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [listToRename, setListToRename] = useState("");
  const [newListName, setNewListName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const allList = async () => {
    setLoading(true);
    const payload = { userId: user?.id };

    await collaboration_getAllList_api(payload)
      .then((res) => {
        setExistingList(res?.data || []);
      })
      .catch(() => {});

    setLoading(false);
  };

  useEffect(() => {
    allList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRenameList = async () => {
    if (!newListName.trim() || newListName === listToRename) return;

    setRenaming(true);
    try {
      // Pass the necessary IDs depending on how your backend expects collaboration renames
      const payload = {
        oldName: listToRename,
        newName: newListName.trim(),
        projectId: collabProject?._id,
      };

      await collaboration_renameAList_api(payload);
      toast.success("List renamed successfully!");
      setRenameModalVisible(false);
      allList(); // Refresh the lists after renaming
    } catch (error) {
      toast.error("Failed to rename list. That name might already exist.");
    } finally {
      setRenaming(false);
    }
  };

  const filteredLists = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return existingList || [];
    return (existingList || []).filter((l) =>
      (l?.name || "").toLowerCase().includes(q),
    );
  }, [existingList, searchTerm]);

  // CSS Helper for Pastel Icons
  const getIconStyle = (index: number) => {
    const styles = [
      "bg-purple-100 text-purple-600",
      "bg-emerald-100 text-emerald-600",
      "bg-blue-100 text-blue-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600",
      "bg-teal-100 text-teal-600",
    ];
    return styles[index % styles.length];
  };

  // Date Formatter
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: "—", time: "" };
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return { date: "—", time: "" };

      const date = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return { date, time };
    } catch {
      return { date: "—", time: "" };
    }
  };

  return (
    <div className="px-6 sm:px-10 py-8 bg-[#F9FAFB] min-h-screen font-sans">
      {/* RENAME DIALOG (PREMIUM STYLING) */}
      <Dialog
        visible={renameModalVisible}
        onHide={() => setRenameModalVisible(false)}
        showHeader={false}
        style={{ width: "420px" }}
        contentStyle={{ padding: "0", borderRadius: "16px", overflow: "hidden", backgroundColor: "white" }}
      >
        <div className="p-6">
          {/* Custom Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Rename List</h2>
            <button 
              onClick={() => setRenameModalVisible(false)} 
              className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none"
            >
              <i className="pi pi-times text-lg"></i>
            </button>
          </div>
          
          {/* Form Body */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">New List Name</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-[15px] outline-none focus:border-[#F35114] focus:ring-1 focus:ring-[#F35114] transition-all"
                placeholder="Enter new list name"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRenameModalVisible(false)}
                className="px-5 py-2.5 rounded-lg text-[14px] text-gray-600 hover:bg-gray-100 font-medium transition-colors border-none bg-transparent"
                disabled={renaming}
              >
                Cancel
              </button>
              <button
                onClick={handleRenameList}
                disabled={renaming || !newListName.trim() || newListName.trim() === listToRename}
                className="px-5 py-2.5 rounded-lg text-[14px] text-white bg-[#F35114] hover:bg-[#d84812] font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 border-none"
              >
                {renaming ? <i className="pi pi-spinner pi-spin"></i> : <i className="pi pi-check"></i>}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-2xl bg-orange-50 text-[#F35114] flex items-center justify-center border border-orange-100">
            <i className="pi pi-users text-2xl" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
              Shared Lists
            </h1>
            <p className="text-[15px] text-gray-500 mt-0.5">
              You have{" "}
              <span className="font-semibold text-gray-700">
                {existingList?.length} collaboration lists
              </span>{" "}
              accessible
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lists..."
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 px-4 pl-9 text-[14px] outline-none focus:border-[#F35114] focus:ring-1 focus:ring-[#F35114] transition-all shadow-sm"
            />
          </div>

          <button
            disabled={isViewer}
            title={isViewer ? "Viewers cannot create lists" : ""}
            onClick={() =>
              !isViewer &&
              navigate(`/collaboration/${collabProject?._id}/list/new-list`)
            }
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-medium transition-colors w-full sm:w-auto shadow-sm ${
              isViewer
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#F35114] hover:bg-[#d84812] text-white cursor-pointer"
            }`}
          >
            <i className="pi pi-plus text-xs" />
            Create new list
          </button>
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[900px]">
            <thead className="border-b border-gray-100 bg-white">
              <tr>
                <th className="w-[45%] text-left text-[13px] font-semibold text-gray-500 py-4 px-6">
                  Name
                </th>
                <th className="w-[15%] text-left text-[13px] font-semibold text-gray-500 py-4 px-6">
                  Total contacts
                </th>
                <th className="w-[20%] text-left text-[13px] font-semibold text-gray-500 py-4 px-6">
                  Updated at
                </th>
                <th className="w-[20%] text-left text-[13px] font-semibold text-gray-500 py-4 px-6">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <tr key={k}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <Skeleton shape="circle" size="2.5rem" />
                          <div>
                            <Skeleton
                              width="10rem"
                              height="1rem"
                              className="mb-2"
                            />
                            <Skeleton width="6rem" height="0.75rem" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Skeleton width="5rem" height="1rem" />
                      </td>
                      <td className="py-4 px-6">
                        <Skeleton width="6rem" height="1rem" />
                      </td>
                      <td className="py-4 px-6">
                        <Skeleton
                          width="6rem"
                          height="2rem"
                          borderRadius="8px"
                        />
                      </td>
                    </tr>
                  ))}
                </>
              ) : filteredLists.length ? (
                filteredLists.map((item, index) => {
                  const total = Number(item?.total || 0);
                  const name = item?.name || "";
                  const iconStyle = getIconStyle(index);
                  const { date, time } = formatDateTime(
                    item.updatedAt || item.createdAt,
                  );

                  return (
                    <tr
                      key={`${name}-${index}`}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* NAME COLUMN */}
                      <td className="py-4 px-6">
                        <div
                          className="cursor-pointer inline-block w-full"
                          onClick={() =>
                            navigate(
                              `/collaboration/${collabProject?._id}/list/${name}/details`,
                            )
                          }
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconStyle}`}
                            >
                              <i className="pi pi-file text-xl" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[15px] font-semibold text-gray-900 truncate hover:text-[#F35114] transition-colors">
                                {name}
                              </div>
                              <div className="text-[13px] text-gray-500 mt-0.5 truncate max-w-[280px]">
                                {item.description ||
                                  "Collaboration shared list"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CONTACTS COLUMN */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-[14px] font-medium text-gray-700">
                          <i className="pi pi-users text-[#8b5cf6]" />
                          <span>{total.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* UPDATED AT COLUMN */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-2">
                          <i className="pi pi-calendar text-gray-400 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="text-[14px] text-gray-700">
                              {date}
                            </span>
                            <span className="text-[12px] text-gray-400">
                              {time}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS COLUMN - View Details & Rename */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/collaboration/${collabProject?._id}/list/${name}/details`,
                              )
                            }
                            className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors text-[13px] font-medium shadow-sm w-[110px]"
                          >
                            View Details
                          </button>

                          {/* ONLY RENDER RENAME BUTTON IF USER IS NOT A VIEWER */}
                          {!isViewer && (
                            <button
                              onClick={() => {
                                setListToRename(name);
                                setNewListName(name);
                                setRenameModalVisible(true);
                              }}
                              className="flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#F35114] hover:border-orange-200 hover:bg-orange-50 transition-all shadow-sm"
                              title="Rename List"
                            >
                              <i className="pi pi-pencil text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                        <i className="pi pi-inbox text-2xl text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">
                        {searchTerm.trim()
                          ? "No shared lists found matching your search."
                          : "No shared lists available yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        {!loading && filteredLists.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 bg-white mt-auto">
            <div className="text-[13px] text-gray-500">
              Showing all{" "}
              <span className="font-medium text-gray-900">
                {filteredLists.length}
              </span>{" "}
              collaboration lists
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
