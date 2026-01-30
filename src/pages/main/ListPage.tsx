import { useEffect, useMemo, useRef, useState } from "react";
import { deleteAList, getAllList, renameAList } from "../../utils/api/data";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { Skeleton } from "primereact/skeleton";
import { toast } from "react-toastify";

interface ListType {
  name: string;
  total: number;
}

type PopoverMode = "menu" | "rename" | "delete";

type PopoverPos = {
  left: number;
  top: number;
  placement: "top" | "bottom";
};

export default function ListPage() {
  const navigate = useNavigate();
  const user = useRecoilValue(userState);

  const [loading, setLoading] = useState(false);
  const [existingList, setExistingList] = useState<ListType[]>([]);

  const [openFor, setOpenFor] = useState<string | null>(null);
  const [mode, setMode] = useState<PopoverMode>("menu");

  const [popoverPos, setPopoverPos] = useState<PopoverPos | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [oldListName, setOldListName] = useState<string>("");

  const [listName, setListName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

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

  const closePopover = () => {
    setOpenFor(null);
    setMode("menu");
    setPopoverPos(null);
  };

  const computePopoverPosition = (btnEl: HTMLElement) => {
    const btnRect = btnEl.getBoundingClientRect();
    const gap = 10;

    const estW = 340;
    const estH = mode === "menu" ? 96 : mode === "rename" ? 190 : 170;

    const spaceBelow = window.innerHeight - btnRect.bottom;
    const spaceAbove = btnRect.top;

    const placement: "top" | "bottom" =
      spaceBelow < estH + gap && spaceAbove > estH + gap ? "top" : "bottom";

    const preferredLeft = btnRect.right + window.scrollX - estW;
    const minLeft = window.scrollX + 12;
    const maxLeft = window.scrollX + window.innerWidth - estW - 12;

    const left = Math.min(Math.max(preferredLeft, minLeft), maxLeft);

    const top =
      placement === "bottom"
        ? btnRect.bottom + window.scrollY + gap
        : btnRect.top + window.scrollY - estH - gap;

    setPopoverPos({ left, top, placement });
  };

  const getAnchorEl = (name: string) => {
    return document.querySelector(
      `[data-list-action-btn="${CSS.escape(name)}"]`
    ) as HTMLElement | null;
  };

  const openRename = () => {
    const n = (oldListName || "").trim();
    setListName(n);
    setMode("rename");
    const anchor = openFor ? getAnchorEl(openFor) : null;
    if (anchor) computePopoverPosition(anchor);
  };

  const openDelete = () => {
    setMode("delete");
    const anchor = openFor ? getAnchorEl(openFor) : null;
    if (anchor) computePopoverPosition(anchor);
  };

  useEffect(() => {
    if (!openFor || !popoverPos) return;
    const pop = popoverRef.current;
    const anchor = getAnchorEl(openFor);
    if (!pop || !anchor) return;

    const btnRect = anchor.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    const gap = 10;

    const spaceBelow = window.innerHeight - btnRect.bottom;
    const spaceAbove = btnRect.top;

    const shouldFlipToTop =
      spaceBelow < popRect.height + gap && spaceAbove > popRect.height + gap;

    const placement: "top" | "bottom" = shouldFlipToTop ? "top" : "bottom";

    const preferredLeft = btnRect.right + window.scrollX - popRect.width;
    const minLeft = window.scrollX + 12;
    const maxLeft = window.scrollX + window.innerWidth - popRect.width - 12;

    const left = Math.min(Math.max(preferredLeft, minLeft), maxLeft);

    const top =
      placement === "bottom"
        ? btnRect.bottom + window.scrollY + gap
        : btnRect.top + window.scrollY - popRect.height - gap;

    setPopoverPos({ left, top, placement });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFor, mode]);

  useEffect(() => {
    if (!openFor) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t) return;

      if (t.closest?.(`[data-list-action-btn]`)) return;
      if (t.closest?.(`[data-list-popover="wrap"]`)) return;

      closePopover();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openFor]);

  useEffect(() => {
    if (!openFor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePopover();
        return;
      }
      if (mode === "rename" && e.key === "Enter") {
        e.preventDefault();
        void renameList();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFor, mode, listName, oldListName]);

  useEffect(() => {
    if (!openFor) return;

    const reposition = () => {
      const anchor = getAnchorEl(openFor);
      if (anchor) computePopoverPosition(anchor);
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFor, mode]);

  const renameList = async () => {
    const oldName = (oldListName || "").trim();
    const newName = (listName || "").trim();

    if (!newName) {
      toast.error("List name cannot be empty");
      return;
    }
    if (oldName === newName) {
      toast.info("No changes made to list name");
      closePopover();
      return;
    }

    setRenameLoading(true);
    const payload = { oldName, newName };

    await renameAList(payload)
      .then((res) => {
        if (res?.data?.message?.endsWith("renamed successfully")) {
          toast.success(res?.data?.message);
          closePopover();
          allList();
        } else {
          toast.error(res?.data?.message || "Rename failed");
        }
      })
      .catch(() => toast.error("Rename failed"))
      .finally(() => setRenameLoading(false));
  };

  const deleteList = async () => {
    const name = (oldListName || "").trim();
    if (!name) return;

    setDeleteLoading(true);

    await deleteAList(name)
      .then((res) => {
        if (res?.data?.message?.endsWith("deleted successfully")) {
          toast.success("List deleted successfully");
          closePopover();
          allList();
          navigate("/list");
        } else {
          toast.error("List not deleted!");
        }
      })
      .catch(() => toast.error("List not deleted!"))
      .finally(() => setDeleteLoading(false));
  };

  const filteredLists = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return existingList || [];
    return (existingList || []).filter((l) =>
      (l?.name || "").toLowerCase().includes(q)
    );
  }, [existingList, searchTerm]);

  return (
    <div className="px-6 sm:px-10 py-8">
      {openFor && popoverPos ? (
        <div className="fixed inset-0 z-[9999]">
          <div
            data-list-popover="wrap"
            ref={popoverRef}
            className="absolute w-[340px] max-w-[calc(100vw-24px)] rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
            style={{ left: popoverPos.left, top: popoverPos.top }}
          >
            <div
              className={`absolute right-6 h-3 w-3 rotate-45 bg-white ring-1 ring-black/5 ${
                popoverPos.placement === "bottom" ? "-top-1.5" : "-bottom-1.5"
              }`}
            />

            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-gray-900">
                  {mode === "menu"
                    ? "Actions"
                    : mode === "rename"
                    ? "Rename list"
                    : "Delete list"}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[280px]">
                  {oldListName}
                </div>
              </div>

              <button
                type="button"
                onClick={closePopover}
                className="h-8 w-8 rounded-full hover:bg-gray-50 flex items-center justify-center"
                aria-label="Close"
              >
                <i className="pi pi-times text-gray-500 text-xs" />
              </button>
            </div>

            <div className="px-4 py-4">
              {mode === "menu" ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={openRename}
                    className="w-full flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 px-3 py-2.5 text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center ring-1 ring-black/5">
                      <i className="pi pi-pencil text-gray-700 text-sm" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        Rename
                      </span>
                      <span className="text-xs text-gray-500">
                        Change the list name
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={openDelete}
                    className="w-full flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 px-3 py-2.5 text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center ring-1 ring-red-200">
                      <i className="pi pi-trash text-red-600 text-sm" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-red-700">
                        Delete
                      </span>
                      <span className="text-xs text-red-600/80">
                        Permanently remove this list
                      </span>
                    </div>
                  </button>
                </div>
              ) : mode === "rename" ? (
                <div className="flex flex-col gap-3">
                  <label className="text-xs text-gray-600">New list name</label>

                  <input
                    autoFocus
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                    placeholder="Enter new list name"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMode("menu")}
                      className="rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      disabled={renameLoading}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={renameList}
                      className="rounded-full px-5 py-2 text-sm text-white bg-[#F35114] hover:opacity-90 flex items-center gap-2"
                      disabled={renameLoading}
                    >
                      {renameLoading ? (
                        <i className="pi pi-spinner pi-spin text-xs" />
                      ) : null}
                      Save
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-400">
                    Tip: Press <span className="font-medium">Enter</span> to save
                    or <span className="font-medium">Esc</span> to close.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center ring-1 ring-red-200">
                        <i className="pi pi-exclamation-triangle text-red-600 text-sm" />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold text-red-700">
                          This cannot be undone
                        </div>
                        <div className="text-xs text-red-600/80 mt-0.5">
                          The list will be deleted permanently.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMode("menu")}
                      className="rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      disabled={deleteLoading}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={deleteList}
                      className="rounded-full px-5 py-2 text-sm text-white bg-red-600 hover:bg-red-700 flex items-center gap-2"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <i className="pi pi-spinner pi-spin text-xs" />
                      ) : null}
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lists</h1>
          <div className="mt-3 p-4 rounded-2xl text-gray-500 bg-gray-50 w-fit">
            <p>
              You have {existingList?.length} list
              <span>{existingList?.length > 1 ? "s" : ""}</span> created
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-[320px]">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lists..."
              className="w-full rounded-full border-2 border-gray-200 bg-white py-2 px-4 pr-10 text-sm outline-none focus:border-gray-300"
            />
            <i className="pi pi-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          </div>

          <button
            onClick={() => navigate("/list/new-list")}
            className="cursor-pointer bg-[#F35114] text-white text-sm px-6 py-2 rounded-full flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <i className="pi pi-user-edit text-sm" />
            Create new list
          </button>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-[50%] text-left text-sm font-medium text-gray-600 py-3">
                  Name
                </th>
                <th className="w-[35%] text-left text-sm font-medium text-gray-600 py-3">
                  Contacts
                </th>
                <th className="w-[15%] text-left text-sm font-medium text-gray-600 py-3">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <>
                  {[1, 2, 3].map((k) => (
                    <tr key={k} className="border-b border-gray-100">
                      <td className="py-3">
                        <Skeleton width="10rem" height="1rem" className="mb-2" />
                        <Skeleton width="6rem" height="0.85rem" />
                      </td>
                      <td className="py-3">
                        <Skeleton width="8rem" height="1rem" />
                      </td>
                      <td className="py-3">
                        <Skeleton width="2rem" height="1rem" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : filteredLists.length ? (
                filteredLists.map((item, index) => {
                  const total = Number(item?.total || 0);
                  const name = item?.name || "";
                  return (
                    <tr
                      key={`${name}-${index}`}
                      className="border-b border-gray-100"
                    >
                      <td className="py-3">
                        <div
                          className="cursor-pointer"
                          onClick={() => navigate(`/list/${name}/details`)}
                        >
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {name}
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <i className="pi pi-users text-gray-400" />
                          <span>
                            {total} contact{total === 1 ? "" : "s"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3">
                        <div className="relative flex items-center justify-start">
                          <button
                            data-list-action-btn={name}
                            className="p-2 rounded-md hover:bg-gray-50"
                            onClick={(e) => {
                              const btn = e.currentTarget as HTMLElement;
                              if (openFor === name) {
                                closePopover();
                                return;
                              }
                              setOldListName(name);
                              setOpenFor(name);
                              setMode("menu");
                              computePopoverPosition(btn);
                            }}
                            aria-label="Actions"
                            type="button"
                          >
                            <i className="pi pi-ellipsis-h text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="py-10 text-center text-sm text-gray-500"
                  >
                    {searchTerm.trim()
                      ? "No lists found."
                      : "Your created list will be displayed here.."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
