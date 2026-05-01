import { useEffect, useMemo, useState } from "react";
import { deleteAList, getAllList, renameAList } from "../../utils/api/data";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { Skeleton } from "primereact/skeleton";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";

interface ListType {
  name: string;
  total: number;
  createdAt?: string;
  description?: string;
}

export default function ListPage() {
  const navigate = useNavigate();
  const user = useRecoilValue(userState);

  const [loading, setLoading] = useState(false);
  const [existingList, setExistingList] = useState<ListType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "rename" | "delete" | null;
    listName: string;
  }>({ isOpen: false, type: null, listName: "" });

  const [newListName, setNewListName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Checkbox State
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const allList = async () => {
    setLoading(true);
    const payload = { userId: user?.id };

    await getAllList(payload)
      .then((res) => setExistingList(res?.data || []))
      .catch(() => {});

    setLoading(false);
  };

  useEffect(() => {
    allList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openRenameModal = (name: string) => {
    setNewListName(name);
    setActionModal({ isOpen: true, type: "rename", listName: name });
  };

  const openDeleteModal = (name: string) => {
    setActionModal({ isOpen: true, type: "delete", listName: name });
  };

  const closeModal = () => {
    setActionModal({ isOpen: false, type: null, listName: "" });
    setNewListName("");
  };

  const renameList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const oldName = actionModal.listName.trim();
    const newName = newListName.trim();

    if (!newName) {
      toast.error("List name cannot be empty");
      return;
    }
    if (oldName === newName) {
      closeModal();
      return;
    }

    setRenameLoading(true);
    await renameAList({ oldName, newName })
      .then((res) => {
        if (res?.data?.message?.endsWith("renamed successfully")) {
          toast.success(res?.data?.message);
          closeModal();
          allList();
        } else {
          toast.error(res?.data?.message || "Rename failed");
        }
      })
      .catch(() => toast.error("Rename failed"))
      .finally(() => setRenameLoading(false));
  };

  const deleteList = async () => {
    const name = actionModal.listName.trim();
    if (!name) return;

    setDeleteLoading(true);
    await deleteAList(name)
      .then((res) => {
        if (res?.data?.message?.endsWith("deleted successfully")) {
          toast.success("List deleted successfully");
          // Remove from selected lists if it was checked
          setSelectedLists((prev) => prev.filter((l) => l !== name));
          closeModal();
          allList();
        } else {
          toast.error("List not deleted!");
        }
      })
      .catch(() => toast.error("List not deleted!"))
      .finally(() => setDeleteLoading(false));
  };

  const toggleSelectAll = () => {
    if (selectedLists.length === filteredLists.length) {
      setSelectedLists([]);
    } else {
      setSelectedLists(filteredLists.map((l) => l.name));
    }
  };

  const toggleSelect = (name: string) => {
    setSelectedLists((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name],
    );
  };

  const filteredLists = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return existingList || [];
    return (existingList || []).filter((l) =>
      (l?.name || "").toLowerCase().includes(q),
    );
  }, [existingList, searchTerm]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return { date: "Unknown Date", time: "" };
    try {
      const d = new Date(dateString);
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
      return { date: "Unknown Date", time: "" };
    }
  };

  return (
    <div className="px-6 sm:px-10 py-8 bg-[#F9FAFB] min-h-screen">
      {/* RENAME DIALOG */}
      <Dialog
        header="Rename List"
        visible={actionModal.isOpen && actionModal.type === "rename"}
        style={{ width: "400px", borderRadius: "1rem" }}
        onHide={closeModal}
        contentStyle={{ padding: "1.5rem" }}
      >
        <form onSubmit={renameList} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              List Name
            </label>
            <input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={renameLoading}
              className="px-4 py-2 rounded-lg text-sm text-white bg-[#F35114] hover:bg-[#d84812] font-medium flex items-center gap-2 transition-colors"
            >
              {renameLoading && <i className="pi pi-spinner pi-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog
        header="Delete List"
        visible={actionModal.isOpen && actionModal.type === "delete"}
        style={{ width: "400px" }}
        onHide={closeModal}
        contentStyle={{ padding: "1.5rem" }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete{" "}
            <span className="font-bold text-gray-900">
              "{actionModal.listName}"
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteList}
              disabled={deleteLoading}
              className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 font-medium flex items-center gap-2 transition-colors"
            >
              {deleteLoading && <i className="pi pi-spinner pi-spin" />}
              Delete Permanently
            </button>
          </div>
        </div>
      </Dialog>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">
            Lists
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            You have{" "}
            <span className="font-semibold text-gray-700">
              {existingList?.length} lists
            </span>{" "}
            created
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lists..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 pl-9 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => navigate("/list/new-list")}
            className="cursor-pointer bg-[#F35114] hover:bg-[#d84812] shadow-sm transition-colors text-white text-sm px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
          >
            Create new list
          </button>
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[800px]">
            <thead className="border-b border-gray-200 bg-white">
              <tr>
                <th className="w-[5%] py-4 px-4 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#F35114] focus:ring-[#F35114] cursor-pointer"
                    checked={
                      selectedLists.length > 0 &&
                      selectedLists.length === filteredLists.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="w-[35%] text-left text-sm font-semibold text-gray-900 py-4 px-2">
                  List Name
                </th>
                <th className="w-[20%] text-left text-sm font-semibold text-gray-900 py-4 px-2">
                  Contacts
                </th>
                <th className="w-[20%] text-left text-sm font-semibold text-gray-900 py-4 px-2">
                  Created At
                </th>
                <th className="w-[20%] text-left text-sm font-semibold text-gray-900 py-4 px-2">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((k) => (
                    <tr key={k}>
                      <td className="py-4 px-4 text-center">
                        <Skeleton
                          width="1rem"
                          height="1rem"
                          className="mx-auto"
                        />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton width="10rem" height="1.2rem" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton width="4rem" height="1rem" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton width="6rem" height="1rem" />
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex gap-2">
                          <Skeleton
                            width="5rem"
                            height="2rem"
                            borderRadius="16px"
                          />
                          <Skeleton
                            width="5rem"
                            height="2rem"
                            borderRadius="16px"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : filteredLists.length ? (
                filteredLists.map((item, index) => {
                  const total = Number(item?.total || 0);
                  const name = item?.name || "";
                  const { date } = formatDate(item.createdAt);
                  const isSelected = selectedLists.includes(name);

                  return (
                    <tr
                      key={`${name}-${index}`}
                      className={`group transition-colors ${isSelected ? "bg-orange-50/30" : "hover:bg-gray-50"}`}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#F35114] focus:ring-[#F35114] cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelect(name)}
                        />
                      </td>

                      <td className="py-4 px-2">
                        <div
                          className="cursor-pointer inline-block"
                          onClick={() => navigate(`/list/${name}/details`)}
                        >
                          <div className="text-[15px] font-medium text-gray-900 truncate hover:text-[#F35114] transition-colors">
                            {name}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-2">
                        <div className="text-[15px] text-gray-600">
                          {total.toLocaleString()}
                        </div>
                      </td>

                      <td className="py-4 px-2">
                        <div className="text-[15px] text-gray-600">{date}</div>
                      </td>

                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Sleek Rename Button */}
                          <button
                            onClick={() => openRenameModal(name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all text-xs font-medium shadow-sm"
                          >
                            <i className="pi pi-pencil text-[10px]" /> Rename
                          </button>

                          {/* Icon-Only Trash Button (Turns red on hover) */}
                          <button
                            title="Delete List"
                            onClick={() => openDeleteModal(name)}
                            className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all shadow-sm"
                          >
                            <i className="pi pi-trash text-[11px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <i className="pi pi-inbox text-4xl text-gray-300 mb-3" />
                      <p className="text-sm font-medium">
                        {searchTerm.trim()
                          ? "No lists found matching your search."
                          : "No lists created yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM PAGINATION FOOTER */}
        {!loading && filteredLists.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">1-10</span> of{" "}
              <span className="font-medium text-gray-900">
                {filteredLists.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-50">
                <i className="pi pi-angle-left text-xs" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-50">
                <i className="pi pi-angle-right text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
