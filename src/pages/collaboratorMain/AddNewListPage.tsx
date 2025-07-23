import { useState } from "react";
import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { collaboration_createNewList_api } from "../../utils/api/collaborationData";

export default function Collab_AddnewListPage() {
  const user: any = useRecoilValue(userState);
  const navigate = useNavigate();
  const [listName, setListName] = useState("");

  const handleSubmit = async () => {
    const payload = {
      userId: user.id,
      listName: listName,
    };

    await collaboration_createNewList_api(payload)
      .then(() => {
        toast.success("List created successfully");
        navigate("/list");
      })
      .catch(( ) => {
        toast.error("Error occurred");
      });
  };

  return (
    <div>
      <div>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center w-[90vw] lg:min-w-[400px] ">
            <h2 className="textsm font-bold">Add new list page</h2>
            <input
              type="text"
              onChange={(e) => setListName(e.target.value)}
              className="my-3 rounded-full text-xs text-gray-500 border w-full lg:w-[400px] px-6 py-3"
              placeholder="Enter list name.."
            />
            <div className="w-fit m-auto">
              <button
                onClick={handleSubmit}
                className="cursor-pointer bg-[#F35114] text-white text-sm px-6 py-2 rounded-full flex items-center gap-1"
              >
                {" "}
                <i className="pi pi-user-edit"></i>Create new list
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
