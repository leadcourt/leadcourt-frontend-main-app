import { useEffect, useState } from "react";
import { deleteAList, getAllList, renameAList } from "../../utils/api/data";
import { useNavigate } from "react-router-dom";
// import { TieredMenu } from "primereact/tieredmenu";
import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { Skeleton } from "primereact/skeleton";
import { toast } from "react-toastify";
import { Dialog } from "primereact/dialog";

interface ListType {
  name: string;
  total: number;
}
export default function ListPage() {
  const navigate = useNavigate();
  const user = useRecoilValue(userState);
  const [loading, setLoading] = useState(false);
  const [existingList, setExistingList] = useState<ListType[]>([]);
  const [displayOption, setDisplayOption] = useState<any>(null);

  const [listName, setListName] = useState("");
  const [renameListAction, setRenameListAction] = useState(false);
  const [oldListName, setOldListName] = useState<string>("");

  const [deleteListAction, setDeleteListAction] = useState(false);
  const [loadingDeletePage, setLoadingDeletePage] = useState(false);

  const allList = async () => {
    setLoading(true);
    const payload = {
      userId: user?.id,
    };

    await getAllList(payload)
      .then((res) => {
        setExistingList(res?.data);
      })
      .catch(() => {});

    setLoading(false);
  };

  const showListMenu = (item: any) => {
    if (displayOption === item) {
      setDisplayOption(null);
    } else {
      setDisplayOption(item);
    }
  };

  const renameList = async () => {
    console.log("listName", listName);

    const payload = {
      oldName: oldListName,
      newName: listName,
    };
    console.log("payload", payload);

    if (oldListName == listName) {
      toast.info("No changes made to list name");
      return;
    }
    await renameAList(payload).then((res) => {
      if (res?.data?.message?.endsWith("renamed successfully")) {
        toast.success(res?.data?.message);
        // navigate(`/list/${listName}/details`);
        setRenameListAction(false);
        allList();
      }
    });
  };

  const deleteList = async () => {
    setLoadingDeletePage(true);
    await deleteAList(oldListName).then((res) => {
      if (res?.data?.message.endsWith("deleted successfully")) {
        toast.success("List deleted successfully");
        navigate("/list");
      } else {
        toast.error("List not deleted!");
      }
    });
    allList();
    setLoadingDeletePage(false);
    setDeleteListAction(!deleteListAction);
  };

  useEffect(() => {
    allList();
  }, []);

  return (
    <div>
      <Dialog
        header={`Rename List`}
        visible={renameListAction}
        className="p-2 bg-white w-fit max-w-[400px] lg:w-1/2"
        // style={{ maxWidth: "400px" }}
        onHide={() => {
          setRenameListAction(!renameListAction);
        }}
        draggable={false}
        resizable={false}
      >
        <div className="pb-3 w-fit m-auto">
          <div className="flex flex-col gap-3 m-5 text-center">
            <p className=" w-full text-center text-sm">Change the list name</p>

            <input
              onChange={(e) => setListName(e.target.value)}
              value={listName}
              type="text"
              className="border-red-400 border-2 py-2 px-4 rounded-full "
              placeholder="Enter new list name"
            />
          </div>

          <div className="mt-6 flex items-center pb-2">
            <div className=" cursor-pointer w-fit m-auto">
              <button
                onClick={renameList}
                className="bg-[#F35114] flex items-center gap-2 cursor-pointer text-white text-md rounded-full px-6 py-2"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        header={`Delete List`}
        visible={deleteListAction}
        className="p-2 bg-white w-fit max-w-[400px] lg:w-1/2"
        // style={{ maxWidth: "400px" }}
        onHide={() => {
          setDeleteListAction(!deleteListAction);
        }}
        draggable={false}
        resizable={false}
      >
        <div className="pb-3 w-fit m-auto">
          <div className="flex flex-col gap-3 m-5 text-center">
            <p className=" w-full text-center text-sm">
              Are you sure you want to delete this list?
            </p>
          </div>

          <div className="mt-6 flex items-center pb-2">
            <div className=" cursor-pointer w-fit m-auto">
              <button
                onClick={() => {
                  setDeleteListAction(!deleteListAction);
                }}
                className="bg-yellow-300 flex items-center gap-2 cursor-pointer text-white text-md rounded-full px-6 py-2"
              >
                Cancel
              </button>
            </div>
            <div className=" cursor-pointer w-fit m-auto">
              <button
                onClick={deleteList}
                className="bg-[#F35114] flex items-center gap-2 cursor-pointer text-white text-md rounded-full px-6 py-2"
              >
                {loadingDeletePage ? (
                  <i className="pi pi-spinner pi-spin"></i>
                ) : (
                  ""
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {loading ? (
        <div className="p-10">
          <div className="mt-3">
            <div className="p-10">
              <div className="p-5 my-5 rounded-2xl text-gray-500 bg-gray-50">
                <p>Loading your lists...</p>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="  cursor-pointer transition-transform ease-in-out  rounded-lg"
                  >
                    <Skeleton height="7rem" className="mb-2 py-5"></Skeleton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : existingList?.length ? (
        // ) : allListDisplay.length ? (

        <div className="p-10">
          <div className="p-5 my-5 rounded-2xl text-gray-500 bg-gray-50">
            <p>
              You have {existingList?.length} list
              <span>{existingList?.length > 1 ? "s" : ""}</span> created
            </p>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {existingList?.map((item: any, index: any) => (
              <div
                key={index}
                className=" cursor-pointer transition-all ease-in-out duration-300 shadow-2xl shadow-gray-200 bg-gray-50 hover:bg-red-50  rounded-lg"
              >
                <div className="flex h-fit items-center justify-between">
                  <div
                    onClick={() =>
                      // navigate(`/list/${item.name.replace(/\s+/g, "-")}/details`)
                      navigate(`/list/${item?.name}/details`)
                    }
                    className="border-dashed border-r-2 border-r-gray-200 hover:p-[1.3rem] p-5 w-[75%]"
                  >
                    <p>
                      <span className="text-gray-400 uppercase text-sm font-bold">
                        List :
                      </span>{" "}
                      <span>{item?.name?.toUpperCase()}</span>
                    </p>
                    <p>
                      <span className="text-gray-400 uppercase text-xs font-bold">
                        Profiles :
                      </span>{" "}
                      <span>{item?.total}</span>
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      showListMenu(item?.name);
                      setOldListName(item?.name);
                    }}
                    className="relative  w-[25%] h-full flex items-center justify-center"
                  >
                    <i className=" pi pi-ellipsis-v text-xl text-gray-400 p-2"></i>

                    <div className="flex gap-2 items-center justify-start">
                      {displayOption === item?.name ? (
                        <div className="absolute right-full bottom-full">
                          <ul className="bg-gray-100 p-1 shadow  transform-hover text-gray-500 rounded-lg">
                            <li
                              onClick={() => setRenameListAction(true)}
                              className="flex items-center gap-1 text-xs p-2 border-b border-gray-200"
                            >
                              <i className="pi pi-pencil text-xs"></i>
                              <span>Rename</span>
                            </li>
                            <li
                              onClick={() => setDeleteListAction(true)}
                              className="flex items-center gap-1 text-xs p-2"
                            >
                              <i className="pi pi-trash text-xs"></i>
                              <span>Delete</span>
                            </li>
                          </ul>
                          {/* <div
         onClick={deleteList}
        className="flex items-center cursor-pointer gap-2 px-10 py-2 bg-amber-300 text-gray-600 text-xs w-fit rounded"
      >
        {loadingDeletePage ? (
          <i className="pi pi-spin pi-spinner"></i>
        ) : (
          <i className="pi pi-trash"></i>
        )}
        Delete List
      </div>
      <div
         onClick={() => setRenameListAction(true)}
        className="flex items-center cursor-pointer gap-2 px-10 py-2 text-white bg-gray-400 text-xs w-fit rounded"
      >
        <i className="pi pi-pencil"></i>
        <span>Rename List</span>
      </div> 
      */}
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-[400px] ">
            <h2 className="textsm font-bold">
              Your created list will be displayed here..
            </h2>
            <p className="my-3 text-xs text-gray-500">
              Lists help you organize your prospects and start targeted
              campaigns. Pick a template below to get started
            </p>
            <div className="w-fit m-auto">
              <button
                onClick={() => navigate("/list/new-list")}
                className="cursor-pointer bg-[#F35114] text-white text-sm px-6 py-2 rounded-full flex items-center gap-1"
              >
                {" "}
                <i className="pi pi-user-edit"></i>Create new list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
