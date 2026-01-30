import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";
import {
  collaboration_addByFilterToList_api,
  collaboration_addProfilesToList_api,
  collaboration_getAllList_api,
} from "../../utils/api/collaborationData";

type Mode = "selected" | "bulk";

type BulkConfig = {
  filters: any;
  take: number;
  startRowId: number;
};

function CollaboratorAddToListComponent({
  people,
  onClose,
  mode = "selected",
  bulk,
  onComplete,
}: {
  people?: any[];
  onClose: () => void;
  mode?: Mode;
  bulk?: BulkConfig | null;
  onComplete?: (result: any) => void;
}) {
  const PAGE_SIZE = 25;
  const ORANGE = "#F35114";

  const [existingList, setExistingList] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingAddToList, setLoadingAddToList] = useState(false);

  const [targetMode, setTargetMode] = useState<"existing" | "new">("existing");

  const [selectedExisting, setSelectedExisting] = useState<string>("");
  const [newListName, setNewListName] = useState<string>("");

  const isBulk = mode === "bulk";
  const selectedCount = (people || []).length;

  const bulkMeta = useMemo(() => {
    if (!isBulk || !bulk) return null;
    return {
      take: Number(bulk.take) || 0,
      startRowId: Number(bulk.startRowId) || 0,
      filters: bulk.filters || {},
    };
  }, [isBulk, bulk]);

  const bulkPagesInfo = useMemo(() => {
    const take = Number(bulkMeta?.take || 0);
    if (!take) return { pages: 0, exact: true };
    const exact = take % PAGE_SIZE === 0;
    const pages = exact ? take / PAGE_SIZE : Math.ceil(take / PAGE_SIZE);
    return { pages, exact };
  }, [bulkMeta]);

  const bulkPagesLabel = useMemo(() => {
    const p = bulkPagesInfo.pages || 0;
    const prefix = bulkPagesInfo.exact ? "" : "~";
    const word = p === 1 ? "page" : "pages";
    return `${prefix}${p} ${word}`;
  }, [bulkPagesInfo]);

  const displayCountLabel = useMemo(() => {
    if (!isBulk) return `${selectedCount} people`;
    const take = Number(bulkMeta?.take || 0);
    return `${take} rows (${bulkPagesLabel})`;
  }, [isBulk, bulkMeta, bulkPagesLabel, selectedCount]);

  const normalizeName = (s: string) => String(s || "").trim();

  const allList = async () => {
    setLoadingLists(true);
    try {
      const res = await collaboration_getAllList_api({});
      setExistingList(res?.data || []);
    } catch (e) {
      setExistingList([]);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    allList();
  }, []);

  useEffect(() => {
    const hasLists =
      (existingList || []).some((l: any) => String(l?.name || "").trim().length > 0) || false;
    if (!loadingLists && !hasLists) setTargetMode("new");
  }, [loadingLists, existingList]);

  useEffect(() => {
    if (targetMode === "existing") setNewListName("");
    if (targetMode === "new") setSelectedExisting("");
  }, [targetMode]);

  const listOptions = useMemo(() => {
    const names = (existingList || [])
      .map((l: any) => String(l?.name || "").trim())
      .filter(Boolean);

    return names.map((name: string) => {
      const meta = existingList.find((x: any) => x?.name === name) || null;
      return { label: name, value: name, meta };
    });
  }, [existingList]);

  const selectedExistingMeta = useMemo(() => {
    return (existingList || []).find((x: any) => x?.name === selectedExisting) || null;
  }, [existingList, selectedExisting]);

  const submit = async () => {
    const listName =
      targetMode === "existing" ? normalizeName(selectedExisting) : normalizeName(newListName);

    if (!listName) {
      return toast.error(targetMode === "existing" ? "Please select a list" : "Enter a list name");
    }

    if (isBulk && (!bulkMeta || !bulkMeta.take)) return toast.error("Missing bulk config");

    setLoadingAddToList(true);
    try {
      let res: any;

      if (!isBulk) {
        const rowIds = (people || [])
          .map((p: any) => Number(p?.row_id))
          .filter((n: any) => Number.isInteger(n) && n > 0);

        const uniqueRowIds = Array.from(new Set(rowIds));
        if (!uniqueRowIds.length) return toast.error("No valid rows selected");

        res = await collaboration_addProfilesToList_api({ listName, rowIds: uniqueRowIds });
      } else {
        res = await collaboration_addByFilterToList_api({
          listName,
          filters: bulkMeta!.filters,
          take: bulkMeta!.take,
          startRowId: bulkMeta!.startRowId,
        });
      }

      const data = res?.data || {};
      onComplete?.({ listName, mode, ...data });
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Error occured");
    } finally {
      setLoadingAddToList(false);
    }
  };

  const Radio = ({ checked }: { checked: boolean }) => (
    <div
      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
      style={{ borderColor: checked ? ORANGE : "#D1D5DB" }}
    >
      {checked ? <div className="w-2.5 h-2.5 rounded-full" style={{ background: ORANGE }} /> : null}
    </div>
  );

  const OptionCard = ({
    active,
    title,
    desc,
    onClick,
  }: {
    active: boolean;
    title: string;
    desc: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-full text-left rounded-2xl border p-4 flex items-start gap-3 transition-all ${
        active ? "bg-white" : "bg-white hover:bg-gray-50"
      }`}
      style={{
        borderColor: active ? "rgba(243,81,20,0.30)" : "#E5E7EB",
        boxShadow: active ? "0 18px 45px rgba(243,81,20,0.10)" : "none",
      }}
    >
      <div className="mt-1">
        <Radio checked={active} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-extrabold text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{desc}</div>
      </div>
    </button>
  );

  const dropdownValueTemplate = (option: any) => {
    const name = option?.label || option?.value || selectedExisting || "";
    if (!name) return <span className="text-gray-400">Select a list</span>;

    const total = selectedExistingMeta?.total != null ? Number(selectedExistingMeta.total) : null;

    return (
      <div className="w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold shrink-0"
            style={{
              background: "rgba(243,81,20,0.10)",
              color: ORANGE,
              border: "1px solid rgba(243,81,20,0.18)",
            }}
          >
            {String(name).trim().slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-extrabold text-gray-900 truncate">{name}</div>
            <div className="text-[11px] text-gray-500">
              {total != null ? `${total} contacts` : "Existing list"}
            </div>
          </div>
        </div>

        <i className="pi pi-chevron-down text-gray-400" />
      </div>
    );
  };

  const dropdownItemTemplate = (opt: any) => {
    const name = opt?.label || opt?.value || "";
    const total = opt?.meta?.total;
    const active = selectedExisting === name;

    return (
      <div className="w-full flex items-center justify-between gap-3 px-2 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold shrink-0"
            style={{
              background: active ? ORANGE : "rgba(243,81,20,0.10)",
              color: active ? "#fff" : ORANGE,
            }}
          >
            {String(name).trim().slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{name}</div>
            <div className="text-[11px] text-gray-500">
              {total != null ? `${Number(total)} contacts` : "Existing list"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const canSubmit =
    !loadingAddToList &&
    (targetMode === "existing"
      ? Boolean(normalizeName(selectedExisting))
      : Boolean(normalizeName(newListName)));

  if (loadingLists) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <i className="pi pi-spinner-dotted pi-spin text-4xl text-gray-500"></i>
      </div>
    );
  }

  return (
    <div className="w-full">
      <style>{`
        .lc-dd.p-dropdown {
          width: 100%;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          background: #fff;
        }
        .lc-dd.p-dropdown:not(.p-disabled):hover { border-color: rgba(243,81,20,0.35); }
        .lc-dd.p-dropdown.p-focus {
          box-shadow: 0 0 0 3px rgba(243,81,20,0.18);
          border-color: rgba(243,81,20,0.55);
        }
        .lc-dd .p-dropdown-label { padding: 12px 14px; }
        .lc-dd .p-dropdown-trigger { width: 3rem; }

        .lc-dd-panel.p-dropdown-panel {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(17,24,39,0.08);
          box-shadow: 0 25px 70px rgba(0,0,0,0.18);
        }
        .lc-dd-panel .p-dropdown-items { padding: 6px; }
        .lc-dd-panel .p-dropdown-item {
          border-radius: 14px;
          margin: 2px 0;
        }
        .lc-dd-panel .p-dropdown-item.p-highlight {
          background: rgba(243,81,20,0.08);
          color: #111827;
        }
      `}</style>

      <div className="text-sm text-gray-700">
        Adding{" "}
        <span
          className="mx-1 px-2 py-0.5 rounded-md font-semibold"
          style={{ background: "rgba(243,81,20,0.08)", color: ORANGE }}
        >
          {displayCountLabel}
        </span>
        {isBulk ? <span className="text-gray-500"> with current filters</span> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <OptionCard
          active={targetMode === "existing"}
          title="Add to existing list"
          desc="Choose one of your existing lists"
          onClick={() => setTargetMode("existing")}
        />
        <OptionCard
          active={targetMode === "new"}
          title="Create new list"
          desc="Enter a new list name and save"
          onClick={() => setTargetMode("new")}
        />
      </div>

      <div className="mt-5">
        {targetMode === "existing" ? (
          <>
            {listOptions.length ? (
              <>
                <div className="text-xs font-semibold tracking-wider text-gray-500">SELECT LIST</div>

                <div
                  className="mt-2 rounded-2xl p-4"
                  style={{
                    background: "rgba(243,81,20,0.06)",
                    border: "1px solid rgba(243,81,20,0.20)",
                  }}
                >
                  <Dropdown
                    autoFocus
                    checkmark={false}
                    value={selectedExisting}
                    options={listOptions}
                    onChange={(e) => setSelectedExisting(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select a list"
                    className="lc-dd"
                    panelClassName="lc-dd-panel"
                    valueTemplate={dropdownValueTemplate}
                    itemTemplate={dropdownItemTemplate}
                  />

                  {selectedExisting ? (
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="text-gray-600">
                        Selected:{" "}
                        <span className="font-semibold text-gray-900">{selectedExisting}</span>
                      </div>
                      <div
                        className="px-2 py-1 rounded-lg font-semibold"
                        style={{ background: "rgba(243,81,20,0.10)", color: ORANGE }}
                      >
                        {selectedExistingMeta?.total != null
                          ? `${Number(selectedExistingMeta.total)} contacts`
                          : "Existing list"}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-500">Pick a list to continue.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-800">No lists yet.</div>
                <div className="text-xs text-gray-500 mt-1">
                  Switch to “Create new list” above to save these contacts.
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-xs font-semibold tracking-wider text-gray-500">NEW LIST NAME</div>

            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter new list name.."
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
          Cancel
        </button>

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="px-7 py-3 rounded-xl text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: ORANGE, boxShadow: "0 16px 40px rgba(243,81,20,0.25)" }}
        >
          {loadingAddToList ? (
            <span className="inline-flex items-center gap-2">
              <i className="pi pi-spin pi-spinner text-xs" />
              {targetMode === "existing" ? "Adding..." : "Creating..."}
            </span>
          ) : targetMode === "existing" ? (
            "Add to list"
          ) : (
            "Create list"
          )}
        </button>
      </div>
    </div>
  );
}

export default CollaboratorAddToListComponent;