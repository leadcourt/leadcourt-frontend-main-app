import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { TieredMenu } from "primereact/tieredmenu";
import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { Skeleton } from "primereact/skeleton";
import { collaboration_getAllList_api } from "../../utils/api/collaborationData";
// import { getAllDash } from "../../utils/api/collaborationAPI";
import { collabProjectState } from "../../utils/atom/collabAuthAtom";

// interface ListType {
//   name: string;
//   total: number;
// }
export default function Collab_ListPage() {
  const navigate = useNavigate();
  const user = useRecoilValue(userState);
  const [loading, setLoading] = useState(false);
  const [existingList, setExistingList] = useState<any>([]);
  // const [existingList, setExistingList] = useState<ListType[]>([]);
  const collabProject = useRecoilValue(collabProjectState);
 
  const allList = async () => {
    setLoading(true);
    const payload = {
      userId: user?.id,
    };

    await collaboration_getAllList_api(payload)
      .then((res) => {
        
        setExistingList(res?.data);
      })
      .catch(() => {});

    setLoading(false);
  };
 
  
  // const getDash = async () => {
  //   console.log("Collab Project:", collabProject);
  //       await getAllDash().then((res) => {
  //         console.log("Dashboard Data:", res?.data);
  //       })
  // }
 
  useEffect(() => {
    allList();
    // console.log(collabProject);
    

  }, []);
  
  return (
    <div>

      {loading ? (
        <div className="p-10"> 
          <div className="mt-3">
      <div className="p-10">
        <div className="p-5 my-5 rounded-2xl text-gray-500 bg-gray-50">
          <p>Loading your lists...</p>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((item) => (
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
      ) : existingList.length ? (
      // ) : allListDisplay.length ? (
        
      <div className="p-10">
      <div className="p-5 my-5 rounded-2xl text-gray-500 bg-gray-50">
        <p>You have {existingList.length} list<span>{existingList.length > 1 ? 's': ''}</span> created</p>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {existingList?.map((item: any, index: any) => (
          <div
            key={index}
            onClick={() =>
              // navigate(`/list/${item.name.replace(/\s+/g, "-")}/details`)
              navigate(`/collaboration/${collabProject?._id}/list/${item?.name}/details`)
            }
                className=" cursor-pointer transition-all ease-in-out duration-300 shadow-2xl shadow-gray-200 bg-gray-50 hover:bg-red-50  rounded-lg"
            // className="p-5 hover:p-[1.3rem] cursor-pointer transition-transform ease-in-out border bg-red-50 hover:bg-red-100 border-red-100 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div 
              // className=""
                    className="border-dashed border-r2 border-r-gray-200 hover:p-[1.3rem] p-5 w-[75%]"
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
                    className="relative  w-[25%] h-full flex items-center justify-center"
                  >
                    <i className=" pi pi-angle-right text-xl text-gray-400 p-2"></i>
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
              {/* collaboration/689109db5c6e6916efe21cf0/list/new-list */}
              <button
                onClick={() => navigate(`/collaboration/${collabProjectState}/list/new-list`)}
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
