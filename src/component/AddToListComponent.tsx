import { useEffect, useState } from "react";
import { addProfilesToList, getAllList } from "../utils/api/data";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";
import { useRecoilValue } from "recoil";
import { userState } from "../utils/atom/authAtom";

interface Person {
  row_id: any;
  Name: string;
  Designation: string;
  Email: any;
  Phone: any;
  Organization: string;
  City: string;
  State: string;
  Country: string;
}

function AddToListComponent({ people, onClose }: any) {
  const user = useRecoilValue(userState);
  const [existingList, setExistingList] = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [saveTo, setSaveTo] = useState<any>(null);
  const [saveToOption, setSaveToOption] = useState<any>(false);
  const [loading, setLoading] = useState(false);
  const [loadingAddToList, setLoadingAddToList] = useState(false);

  const allList = async () => {
    setLoading(true);
    const payload = {
      userId: user?.id,
    };

    await getAllList(payload).then((res) => {
      setExistingList(res.data);
    });
    // .catch((err) => {
    //   console.log("Error occurred: ", err);
    // });

    setLoading(false);
  };

  const onSubmit = async () => {
    setLoadingAddToList(true);
    const payload = {
      userId: user?.id,
      listName: selectedList,
      rowIds: people.map((person: Person) => person.row_id),
    };

    await addProfilesToList(payload)
      .then(() => {
        toast.success("Profiles added to list successfully");
        onClose();
      })
      .catch(() => {
        toast.error("Error occured");
      });
    setLoadingAddToList(false);
  };

  const handleContinueButton = () => {
    if (saveTo === null) {
      return toast.error("You must select one option to continue");
    } else {
      setSaveToOption(true);
    }
  };

  const dropdownItemTemplate = (e: any) => {
    return <div className="py-2 text-xs text-gray-600 uppercase">{e}</div>;
  };

  const handleSaveTo = (data: string) => {
    setSaveTo(data);
    setSelectedList("");
  };

  useEffect(() => {
    allList();
  }, []);

  return (
    <div className="card grid p-2 gap-2 ">
      <div className="">
        <p className="text-sm text-center">
          You have selected {people?.length} people..
        </p>

        <p className="m-0"></p>
      </div>

      {loading ? (
        <div className="w-fit m-auto my-2">
          <i className="pi pi-spinner-dotted pi-spin text-6xl transition-opacity">
            {" "}
          </i>
        </div>
      ) : (
        <div className="">
          <div className={`${saveToOption ? "hidden" : ""}`}>
            <div className="flex flex-col gap-3">
              <div
                onClick={() => setSaveTo("viewList")}
                className={`border border-gray-50 cursor-pointer rounded-md shadow-xs shadow-gray-200 flex items-center gap-3 p-3 ${
                  saveTo === "viewList" ? "selected" : ""
                }`}
              >
                <div className="">
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
                  <p className="text-gray-400">
                    Add contacts to a list you already created.
                  </p>
                </div>
              </div>
              <div
                onClick={() => setSaveTo("createList")}
                className={`border border-gray-50 cursor-pointer rounded-md shadow-xs shadow-gray-200 flex items-center gap-3 p-3 ${
                  saveTo === "createList" ? "selected" : ""
                }`}
              >
                <div className="">
                  <input
                    onClick={() => setSaveTo("createList")}
                    onChange={() => setSaveTo("createList")}
                    checked={saveTo === "createList"}
                    type="radio"
                    name="list"
                    value="viewList"
                    id="createList"
                  />
                </div>
                <div className="text-xs">
                  <h3 className="font-bold">Create new list</h3>
                  <p className="text-gray-400">
                    Create a new list and add contacts to it.
                  </p>
                </div>
              </div>
            </div>

            <div className=" cursor-pointer mt-6 w-fit m-auto">
              <button
                onClick={handleContinueButton}
                className="bg-[#F35114] cursor-pointer text-white text-md rounded-full px-6 py-2"
              >
                Continue
              </button>
            </div>
          </div>

          {saveTo === "viewList" && saveToOption === true ? (
            <div className="">
              {existingList?.length ? (
                <div className="">
                  <div className="   m-auto max-w-[400px] ">
                    <Dropdown
                      autoFocus={true}
                      checkmark={true}
                      emptyFilterMessage="No match found.."
                      value={selectedList}
                      onChange={(e) => setSelectedList(e.value)}
                      options={existingList.map((list: any) => list.name)}
                      optionLabel="name"
                      placeholder="Select a List"
                      itemTemplate={dropdownItemTemplate}
                      className="w-full md:w-14rem focus:border-none border border-gray-200 p-2 !text-xs "
                    />
                    <div className="   m-auto w-fit">
                      {!loadingAddToList ? (
                        <button
                          onClick={onSubmit}
                          className="mt-2 text-sm rounded bg-gray-200 text-gray-600 py-2 px-7 "
                        >
                          Add to list
                        </button>
                      ) : (
                        <button className="mt-2 text-sm flex items-center gap-2 rounded bg-gray-50 cursor-progress text-gray-600 py-2 px-7 ">
                          {" "}
                          <i className="pi pi-spinner-dotted pi-spin"></i>
                          Adding to list to list{" "}
                          {loadingAddToList ? "true" : "false"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="my-2  ">
                    <div className="">
                      <button
                        onClick={() => handleSaveTo("createList")}
                        className=" my-3 text-xs px-5 py-3 text-white rounded-md bg-[#F35114]"
                      >
                        Create new list
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          ) : saveTo === "createList" && saveToOption === true ? (
            <div className="">
              <div className="  w-fit  m-auto ">
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
                      {" "}
                      <i className="pi pi-user-edit"></i>Create new list
                    </button>
                  ) : (
                    <button
                      onClick={onSubmit}
                      className="cursor-progress bg-[#f34f146c] text-white text-sm px-6 py-2 rounded-full flex items-center gap-2"
                    >
                      <i className=" text-xl pi pi-spinner-dotted pi-spin"></i>{" "}
                      {/* <i className="pi pi-user-edit"></i> */}
                      Creating list
                    </button>
                  )}
                </div>
              </div>
              <div className="my-2  ">
                <div className="">
                  <button
                    onClick={() => handleSaveTo("viewList")}
                    className="mt-2 text-sm rounded bg-gray-200 text-gray-600 py-2 px-7 "
                  >
                    Add to existing list
                  </button>
                </div>
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      )}
    </div>
  );
}

export default AddToListComponent;
