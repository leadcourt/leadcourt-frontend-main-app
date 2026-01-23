import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  refreshTokenState,
  userState,
} from "../../utils/atom/authAtom";
import { useEffect } from "react";
import Sidebar from "../../component/Sidebar";
import Topbar from "../../component/Topbar";
import ScrollButtons from "../../component/ScrollButtons";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";

export default function UserLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const refreshToken = useRecoilValue(refreshTokenState);
  const user = useRecoilValue(userState);

  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);

  const location = useLocation();
  const hideTopbarOnPaths = ["/subscription"];
  const hideTopbar = hideTopbarOnPaths.includes(location.pathname);

  const auth = {
    access: accessToken,
    token: refreshToken,
  };

  const handleSideBar = () => {
    setDisplaySide((prev) => !prev);
  };

  useEffect(() => {
    console.log("UserLayout");
    console.log(user);
  }, [user]);

  if (auth?.access && !!user?.email && user?.verify) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <div className="fixed z-50 bottom-5 right-5">
          <ScrollButtons />
        </div>

        <div className="hidden lg:block h-screen shrink-0">
          <Sidebar />
        </div>

        {displaySide ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={handleSideBar}
            />
            <div className="absolute left-0 top-0 h-full">
              <Sidebar forceExpanded onRequestClose={handleSideBar} />
            </div>
          </div>
        ) : null}

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {!hideTopbar ? (
            <div className="shrink-0 bg-white border-b-gray-100 border-b-2">
              <Topbar
                onToggleSidebar={handleSideBar}
                mobileSidebarOpen={displaySide}
              />
            </div>
          ) : null}

          <div
            className={`flex-1 min-w-0 min-h-0 ${
              displaySide ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  if (auth?.access && !!user?.email && !user?.verify) {
    return <VerifyEmail />;
  }

  return <Navigate to="/" />;
}