import { useEffect, useMemo, useState } from "react";
import { addByFilterToList, addProfilesToList, getAllList } from "../utils/api/data";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";

type Mode = "selected" | "bulk";

type BulkConfig = {
  filters: any;
  take: number;
  startRowId: number;
};

function AddToListComponent({
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

  const [existingList, setExistingList] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState("");
  const [saveTo, setSaveTo] = useState<any>(null);
  const [saveToOption, setSaveToOption] = useState<any>(false);
  const [loading, setLoading] = useState(false);
  const [loadingAddToList, setLoadingAddToList] = useState(false);

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

  const allList = async () => {
    setLoading(true);
    try {
      const res = await getAllList({});
      setExistingList(res?.data || []);
    } catch (e) {
      setExistingList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueButton = () => {
    if (saveTo === null) return toast.error("You must select one option to continue");
    setSaveToOption(true);
  };

  const dropdownItemTemplate = (e: any) => {
    return <div className="py-2 text-xs text-gray-600 uppercase">{e}</div>;
  };

  const handleSaveTo = (data: string) => {
    setSaveTo(data);
    setSelectedList("");
  };

  const onSubmit = async () => {
    const listName = String(selectedList || "").trim();
    if (!listName) return toast.error("Please select / enter a list name");

    setLoadingAddToList(true);

    try {
      let res: any;

      if (!isBulk) {
        const rowIds = (people || [])
          .map((p: any) => Number(p?.row_id))
          .filter((n: any) => Number.isInteger(n) && n > 0);

        if (!rowIds.length) {
          setLoadingAddToList(false);
          return toast.error("No valid rows selected");
        }

        res = await addProfilesToList({ listName, rowIds });
      } else {
        if (!bulkMeta || !bulkMeta.take) {
          setLoadingAddToList(false);
          return toast.error("Missing bulk config");
        }

        res = await addByFilterToList({
          listName,
          filters: bulkMeta.filters,
          take: bulkMeta.take,
          startRowId: bulkMeta.startRowId,
        });
      }

      const data = res?.data || {};
      onComplete?.({
        listName,
        mode,
        ...data,
      });

      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Error occured");
    } finally {
      setLoadingAddToList(false);
    }
  };

  useEffect(() => {
    allList();
  }, []);

  return (
    <div className="card grid p-2 gap-2">
      <div>
        {!isBulk ? (
          <p className="text-sm text-center">You have selected {selectedCount} people..</p>
        ) : (
          <div className="text-center">
            <p className="text-sm">
              You are adding{" "}
              <span className="font-semibold">{bulkMeta?.take || 0}</span> rows{" "}
              (
              <span className="font-semibold">
                {bulkPagesInfo.exact ? bulkPagesInfo.pages : `~${bulkPagesInfo.pages}`} page(s)
              </span>
              ) using current filters
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Starting from row_id: <span className="font-semibold">{bulkMeta?.startRowId || 0}</span>
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="w-fit m-auto my-2">
          <i className="pi pi-spinner-dotted pi-spin text-6xl transition-opacity"></i>
        </div>
      ) : (
        <div>
          <div className={`${saveToOption ? "hidden" : ""}`}>
            <div className="flex flex-col gap-3">
              <div
                onClick={() => setSaveTo("viewList")}
                className={`border border-gray-50 cursor-pointer rounded-md shadow-xs shadow-gray-200 flex items-center gap-3 p-3 ${
                  saveTo === "viewList" ? "selected" : ""
                }`}
              >
                <div>
                  <input
                    onClick={() => setSaveTo("viewList")}
                    onChange={() => setSaveTo("viewList")}
                    checked={saveTo === "viewList"}
                    type="radio"
                    name="list"
                    value="viewList"
                    id="viewList"
                  />
                </div>
                <div className="text-xs">
                  <h3 className="font-bold">Add to existing list</h3>
                  <p className="text-gray-400">Add contacts to a list you already created.</p>
                </div>
              </div>

              <div
                onClick={() => setSaveTo("createList")}
                className={`border border-gray-50 cursor-pointer rounded-md shadow-xs shadow-gray-200 flex items-center gap-3 p-3 ${
                  saveTo === "createList" ? "selected" : ""
                }`}
              >
                <div>
                  <input
                    onClick={() => setSaveTo("createList")}
                    onChange={() => setSaveTo("createList")}
                    checked={saveTo === "createList"}
                    type="radio"
                    name="list"
                    value="createList"
                    id="createList"
                  />
                </div>
                <div className="text-xs">
                  <h3 className="font-bold">Create new list</h3>
                  <p className="text-gray-400">Create a new list and add contacts to it.</p>
                </div>
              </div>
            </div>

            <div className="cursor-pointer mt-6 w-fit m-auto">
              <button
                onClick={handleContinueButton}
                className="bg-[#F35114] cursor-pointer text-white text-md rounded-full px-6 py-2"
              >
                Continue
              </button>
            </div>
          </div>

          {saveTo === "viewList" && saveToOption === true ? (
            <div>
              {existingList?.length ? (
                <div>
                  <div className="m-auto max-w-[400px]">
                    <Dropdown
                      autoFocus={true}
                      checkmark={true}
                      emptyFilterMessage="No match found.."
                      value={selectedList}
                      onChange={(e) => setSelectedList(e.value)}
                      options={existingList.map((list: any) => list.name)}
                      placeholder="Select a List"
                      itemTemplate={dropdownItemTemplate}
                      className="w-full md:w-14rem focus:border-none border border-gray-200 p-2 !text-xs"
                    />

                    <div className="m-auto w-fit">
                      {!loadingAddToList ? (
                        <button
                          onClick={onSubmit}
                          className="mt-2 text-sm rounded bg-gray-200 text-gray-600 py-2 px-7"
                        >
                          Add to list
                        </button>
                      ) : (
                        <button className="mt-2 text-sm flex items-center gap-2 rounded bg-gray-50 cursor-progress text-gray-600 py-2 px-7">
                          <i className="pi pi-spinner-dotted pi-spin"></i>
                          Adding to list
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="my-2">
                    <button
                      onClick={() => handleSaveTo("createList")}
                      className="my-3 text-xs px-5 py-3 text-white rounded-md bg-[#F35114]"
                    >
                      Create new list
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500">No lists yet.</div>
              )}
            </div>
          ) : saveTo === "createList" && saveToOption === true ? (
            <div>
              <div className="w-fit m-auto">
                <input
                  type="text"
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="my-3 rounded-full text-xs text-gray-500 border w-full lg:w-[500px] px-6 py-3"
                  placeholder="Enter new list name.."
                />

                <div className="w-fit m-auto">
                  {!loadingAddToList ? (
                    <button
                      onClick={onSubmit}
                      className="cursor-pointer bg-[#F35114] text-white text-sm px-6 py-2 rounded-full flex items-center gap-1"
                    >
                      <i className="pi pi-user-edit"></i>Create new list
                    </button>
                  ) : (
                    <button className="cursor-progress bg-[#f34f146c] text-white text-sm px-6 py-2 rounded-full flex items-center gap-2">
                      <i className="text-xl pi pi-spinner-dotted pi-spin"></i>
                      Creating list
                    </button>
                  )}
                </div>
              </div>

              <div className="my-2">
                <button
                  onClick={() => handleSaveTo("viewList")}
                  className="mt-2 text-sm rounded bg-gray-200 text-gray-600 py-2 px-7"
                >
                  Add to existing list
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default AddToListComponent;