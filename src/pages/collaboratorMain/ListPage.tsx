import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Skeleton } from "primereact/skeleton";
import { userState } from "../../utils/atom/authAtom";
import { collaboration_getAllList_api } from "../../utils/api/collaborationData";
import { collabProjectState } from "../../utils/atom/collabAuthAtom";

interface ListType {
  name: string;
  total: number;
  updatedAt?: string;
  createdAt?: string;
  description?: string;
}

export default function Collab_ListPage() {
  const navigate = useNavigate();
  const user = useRecoilValue(userState);
  const collabProject = useRecoilValue(collabProjectState);

  const [loading, setLoading] = useState(false);
  const [existingList, setExistingList] = useState<ListType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const allList = async () => {
    setLoading(true);
    const payload = { userId: user?.id };

    await collaboration_getAllList_api(payload)
      .then((res) => {
        setExistingList(res?.data || []);
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
    return (existingList || []).filter((l) =>
      (l?.name || "").toLowerCase().includes(q)
    );
  }, [existingList, searchTerm]);

  // Styling helpers
  const getIconStyle = (index: number) => {
    const styles = [
      "bg-purple-100 text-purple-600",
      "bg-emerald-100 text-emerald-600",
      "bg-blue-100 text-blue-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600",
    ];
    return styles[index % styles.length];
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: "May 15, 2025", time: "10:30 AM" };
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
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-2xl bg-orange-50 text-[#F35114] flex items-center justify-center border border-orange-100">
            <i className="pi pi-users text-2xl" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">Shared Lists</h1>
            <p className="text-[15px] text-gray-500 mt-0.5 font-medium">
              You have access to <span className="text-gray-800">{existingList?.length} collaboration lists</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-[320px]">
            <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shared lists..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 px-4 pl-10 text-[14px] outline-none focus:border-[#F35114] transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => navigate(`/collaboration/${collabProject?._id}/list/new-list`)}
            className="cursor-pointer bg-[#F35114] hover:bg-[#d84812] shadow-md transition-colors text-white text-[14px] px-8 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold w-full sm:w-auto"
          >
            <i className="pi pi-plus font-bold" />
            Create new list
          </button>
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[900px]">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="w-[45%] text-left text-[13px] font-bold text-gray-400 uppercase tracking-wider py-5 px-8">
                  Name
                </th>
                <th className="w-[15%] text-left text-[13px] font-bold text-gray-400 uppercase tracking-wider py-5 px-6">
                  Total contacts
                </th>
                <th className="w-[20%] text-left text-[13px] font-bold text-gray-400 uppercase tracking-wider py-5 px-6">
                  Updated at
                </th>
                <th className="w-[20%] text-center text-[13px] font-bold text-gray-400 uppercase tracking-wider py-5 px-6">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <tr key={k}>
                      <td className="py-6 px-8"><Skeleton width="15rem" height="1.5rem" /></td>
                      <td className="py-6 px-6"><Skeleton width="5rem" height="1.2rem" /></td>
                      <td className="py-6 px-6"><Skeleton width="6rem" height="1.2rem" /></td>
                      <td className="py-6 px-6 text-center"><Skeleton width="8rem" height="2.5rem" className="mx-auto" /></td>
                    </tr>
                  ))}
                </>
              ) : filteredLists.length ? (
                filteredLists.map((item, index) => {
                  const name = item?.name || "";
                  const total = Number(item?.total || 0);
                  const iconStyle = getIconStyle(index);
                  const { date, time } = formatDateTime(item.updatedAt || item.createdAt);

                  return (
                    <tr key={`${name}-${index}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-6 px-8">
                        <div 
                          className="flex items-center gap-4 cursor-pointer" 
                          onClick={() => navigate(`/collaboration/${collabProject?._id}/list/${item?.name}/details`)}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconStyle}`}>
                            <i className="pi pi-file text-2xl" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[16px] font-bold text-gray-900 truncate">{name}</div>
                            <div className="text-[13px] text-gray-400 font-medium truncate mt-0.5">
                              {item.description || "Shared collaboration list"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-6 px-6">
                        <div className="flex items-center gap-2 text-[15px] font-bold text-gray-700">
                          <i className="pi pi-users text-[#8b5cf6] text-sm" />
                          <span>{total.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="py-6 px-6">
                        <div className="flex items-start gap-2.5">
                          <i className="pi pi-calendar text-gray-300 mt-1" />
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-gray-700">{date}</span>
                            <span className="text-[12px] font-medium text-gray-400">{time}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-6 px-6">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => navigate(`/collaboration/${collabProject?._id}/list/${item?.name}/details`)}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-[13px] font-bold shadow-sm"
                          >
                            View Details
                            <i className="pi pi-angle-right text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                         <i className="pi pi-inbox text-3xl" />
                      </div>
                      <p className="text-lg font-bold">No shared lists found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredLists.length > 0 && (
          <div className="border-t border-gray-50 px-8 py-6 bg-white flex justify-between items-center mt-auto">
            <div className="text-[14px] font-bold text-gray-400">
              Showing <span className="text-gray-900">{filteredLists.length}</span> results
            </div>
            <div className="text-[14px] font-medium text-gray-300 italic">
               Project ID: {collabProject?._id?.substring(0,8)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}