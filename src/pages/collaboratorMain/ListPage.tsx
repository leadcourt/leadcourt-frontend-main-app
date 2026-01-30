import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Skeleton } from "primereact/skeleton";
import { userState } from "../../utils/atom/authAtom";
import { collaboration_getAllList_api } from "../../utils/api/collaborationData";
import { collabProjectState } from "../../utils/atom/collabAuthAtom";

export default function Collab_ListPage() {
  const navigate = useNavigate();
  const user = useRecoilValue(userState);
  const collabProject = useRecoilValue(collabProjectState);

  const [loading, setLoading] = useState(false);
  const [existingList, setExistingList] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const allList = async () => {
    setLoading(true);
    const payload = { userId: user?.id };

    await collaboration_getAllList_api(payload)
      .then((res) => {
        setExistingList(res?.data);
      })
      .catch(() => {});

    setLoading(false);
  };

  useEffect(() => {
    allList();
  }, []);

  const filteredLists = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return existingList || [];
    return (existingList || []).filter((l: any) =>
      (l?.name || "").toLowerCase().includes(q)
    );
  }, [existingList, searchTerm]);

  return (
    <div className="px-6 sm:px-10 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">Lists</div>
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
            onClick={() =>
              navigate(`/collaboration/${collabProjectState}/list/new-list`)
            }
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
                <th className="w-[55%] text-left text-sm font-medium text-gray-600 py-3">
                  Name
                </th>
                <th className="w-[35%] text-left text-sm font-medium text-gray-600 py-3">
                  Contacts
                </th>
                <th className="w-[10%] text-left text-sm font-medium text-gray-600 py-3">
                  Open
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
                filteredLists.map((item: any, index: any) => {
                  const name = item?.name || "";
                  const total = Number(item?.total || 0);

                  return (
                    <tr
                      key={`${name}-${index}`}
                      className="border-b border-gray-100"
                    >
                      <td className="py-3">
                        <div
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/collaboration/${collabProject?._id}/list/${item?.name}/details`
                            )
                          }
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
                        <div className="flex items-center justify-start">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/collaboration/${collabProject?._id}/list/${item?.name}/details`
                              )
                            }
                            className="h-9 w-9 rounded-full hover:bg-gray-50 flex items-center justify-center"
                            aria-label="Open list"
                          >
                            <i className="pi pi-angle-right text-gray-500 text-sm" />
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