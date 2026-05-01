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
  updatedAt?: string;
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
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  };

  const filteredLists = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return existingList || [];
    return (existingList || []).filter((l) =>
      (l?.name || "").toLowerCase().includes(q)
    );
  }, [existingList, searchTerm]);

  const getIconStyle = (index: number) => {
    const styles = [
      "bg-purple-100 text-purple-500",
      "bg-emerald-100 text-emerald-500",
      "bg-blue-100 text-blue-500",
      "bg-amber-100 text-amber-500",
      "bg-rose-100 text-rose-500",
      "bg-teal-100 text-teal-500",
    ];
    return styles[index % styles.length];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return { date: "May 15, 2025", time: "10:30 AM" }; // Fallback for old data
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return { date: "May 15, 2025", time: "10:30 AM" };
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      return { date, time };
    } catch {
      return { date: "May 15, 2025", time: "10:30 AM" };
    }
  };

  return (
    <div className="px-6 sm:px-10 py-8 bg-[#F9FAFB] min-h-screen font-sans">
      
      {/* RENAME DIALOG (Fixed Padding) */}
      <Dialog
        header="Rename List"
        visible={actionModal.isOpen && actionModal.type === "rename"}
        style={{ width: "400px", borderRadius: "1rem" }}
        onHide={closeModal}
        draggable={false}
        resizable={false}
      >
        <form onSubmit={renameList} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">List Name</label>
            <input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-[#F35114] focus:ring-1 focus:ring-[#F35114]"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={renameLoading} className="px-4 py-2 rounded-lg text-sm text-white bg-[#F35114] hover:bg-[#d84812] font-medium flex items-center gap-2 transition-colors">
              {renameLoading && <i className="pi pi-spinner pi-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>

      {/* DELETE DIALOG (Fixed Padding) */}
      <Dialog
        header="Delete List"
        visible={actionModal.isOpen && actionModal.type === "delete"}
        style={{ width: "400px", borderRadius: "1rem" }}
        onHide={closeModal}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-gray-700 text-[15px] leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-gray-900">"{actionModal.listName}"</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 font-medium transition-colors">Cancel</button>
            <button type="button" onClick={deleteList} disabled={deleteLoading} className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 font-medium flex items-center gap-2 transition-colors">
              {deleteLoading && <i className="pi pi-spinner pi-spin" />}
              Delete Permanently
            </button>
          </div>
        </div>
      </Dialog>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-2xl bg-orange-50 text-[#F35114] flex items-center justify-center">
            <i className="pi pi-list text-2xl" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">Lists</h1>
            <p className="text-[15px] text-gray-500 mt-0.5">
              You have <span className="font-semibold text-gray-700">{existingList?.length} lists</span> created
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
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 px-4 pl-9 text-sm outline-none focus:border-[#F35114] focus:ring-1 focus:ring-[#F35114] transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => navigate("/list/new-list")}
            className="cursor-pointer bg-[#F35114] hover:bg-[#d84812] shadow-sm transition-colors text-white text-sm px-6 py-2.5 rounded-full flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
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
                <th className="w-[5%] py-4 px-4 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#F35114] focus:ring-[#F35114] cursor-pointer"
                    checked={selectedLists.length > 0 && selectedLists.length === filteredLists.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="w-[35%] text-left text-[13px] font-semibold text-gray-600 py-4 px-2">
                  <div className="flex items-center gap-2">Name <i className="pi pi-sort-alt text-gray-300 text-[10px]" /></div>
                </th>
                <th className="w-[20%] text-left text-[13px] font-semibold text-gray-600 py-4 px-2">
                  <div className="flex items-center gap-2">Total contacts <i className="pi pi-sort-alt text-gray-300 text-[10px]" /></div>
                </th>
                <th className="w-[20%] text-left text-[13px] font-semibold text-gray-600 py-4 px-2">
                  <div className="flex items-center gap-2">Updated at <i className="pi pi-sort-alt text-gray-300 text-[10px]" /></div>
                </th>
                <th className="w-[25%] text-left text-[13px] font-semibold text-gray-600 py-4 px-6">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <tr key={k}>
                      <td className="py-4 px-4 text-center"><Skeleton width="1rem" height="1rem" className="mx-auto"/></td>
                      <td className="py-4 px-2"><Skeleton width="10rem" height="1.2rem" /></td>
                      <td className="py-4 px-2"><Skeleton width="4rem" height="1rem" /></td>
                      <td className="py-4 px-2"><Skeleton width="6rem" height="1rem" /></td>
                      <td className="py-4 px-2">
                         <div className="flex gap-2">
                            <Skeleton width="5rem" height="2rem" borderRadius="16px" />
                            <Skeleton width="5rem" height="2rem" borderRadius="16px" />
                         </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : filteredLists.length ? (
                filteredLists.map((item, index) => {
                  const total = Number(item?.total || 0);
                  const name = item?.name || "";
                  const iconStyle = getIconStyle(index);
                  const { date, time } = formatDate(item.updatedAt);
                  const isSelected = selectedLists.includes(name);

                  return (
                    <tr 
                      key={`${name}-${index}`} 
                      className={`group transition-colors ${isSelected ? 'bg-orange-50/30' : 'hover:bg-gray-50'}`}
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
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconStyle}`}>
                              <i className="pi pi-file text-lg" />
                            </div>
                            <div>
                              <div className="text-[15px] font-bold text-gray-900 truncate hover:text-[#F35114] transition-colors">
                                {name}
                              </div>
                              <div className="text-[13px] text-gray-500 mt-0.5 truncate max-w-[250px]">
                                {item.description || "Default list for contacts"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2 text-[14px] text-gray-700">
                          <i className="pi pi-users text-indigo-400" />
                          <span>{total.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-[14px] text-gray-700">
                            <i className="pi pi-calendar text-gray-400" />
                            <span>{date}</span>
                          </div>
                          {time && <span className="text-[12px] text-gray-400 ml-[26px]">{time}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          
                          <button
                            onClick={() => openRenameModal(name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all text-xs font-medium shadow-sm"
                          >
                            <i className="pi pi-pencil text-[10px]" /> Rename
                          </button>
                          
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
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                         <i className="pi pi-inbox text-2xl text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">
                        {searchTerm.trim() ? "No lists found matching your search." : "No lists created yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM FOOTER (Scrollable List Indicator - No Pagination Buttons) */}
        {!loading && filteredLists.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-white mt-auto">
            <div className="text-[13px] text-gray-500">
              Showing all <span className="font-medium text-gray-900">{filteredLists.length}</span> lists
            </div>
            <div className="text-[13px] text-gray-400 italic">
              Scroll down for more
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
