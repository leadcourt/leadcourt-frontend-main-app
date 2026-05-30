import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import { accessTokenState, userState } from "../../utils/atom/authAtom";
import Sidebar from "../../component/Sidebar";
import Topbar from "../../component/Topbar";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";

export default function UserLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const user: any = useRecoilValue(userState);
  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);

  const location = useLocation();
  const hideTopbar = ["/subscription"].includes(location.pathname);
  const handleSideBar = () => setDisplaySide((prev) => !prev);

  if (accessToken && !!user?.email && user?.verify) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <div className="hidden lg:block h-screen shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {!hideTopbar && (
            <div className="shrink-0 bg-white border-b-2">
              <Topbar
                onToggleSidebar={handleSideBar}
                mobileSidebarOpen={displaySide}
              />
            </div>
          )}
          <div
            className="flex-1 min-w-0 min-h-0 overflow-y-auto"
          >
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return user?.verify === false ? <VerifyEmail /> : <Navigate to="/" />;
}
