import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  refreshTokenState,
  userState,
} from "../../utils/atom/authAtom";
import { useEffect, useState } from "react";
import Sidebar from "../../component/Sidebar";
import Topbar from "../../component/Topbar";
import ScrollButtons from "../../component/ScrollButtons";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";

export default function UserLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const refreshToken = useRecoilValue(refreshTokenState);
  const user = useRecoilValue(userState);
  const [sideBar, setSideBar] = useState(false);

  // global mobile sidebar open/close state
  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);

  const location = useLocation();

  const hideTopbarOnPaths = ["/subscription"];
  const hideTopbar = hideTopbarOnPaths.includes(location.pathname);

  const handleSideBar = () => {
    setDisplaySide((prev) => !prev);
  };

  const updateSidebarFromChild = (childData: boolean) => {
    setSideBar(childData);
  };

  const auth = {
    access: accessToken,
    token: refreshToken,
  };

  useEffect(() => {
    console.log("UserLayout");
    console.log(user);
  });

  return (
    <div>
      {auth?.access && user?.email !== null && user?.verify ? (
        <div className="">
          <div className="fixed wfit z-50 bottom-5 right-5 ">
            <ScrollButtons />
          </div>
          <div className="relative lg:grid grid-cols-[200px,1fr] ">
            <div
              className={`${
                displaySide ? "fixed" : "hidden"
              } shadow-2xl lg:shadow-none w-fit h-[90vh] lg:h-[100vh] bg-white z-50 lg:block`}
            >
              <Sidebar updateBar={updateSidebarFromChild} />
            </div>
            <div className="">
              {/* TOPBAR (hidden for specific paths) */}
              {!hideTopbar && (
                <div
                  className={`top-0 right-0 fixed w-full ${
                    sideBar
                      ? "lg:w-[calc(100%-200px)]"
                      : "lg:w-[calc(100%-80px)]"
                  } z-40`}
                >
                  <div className="relative border-b-gray-100 border-b-2 items-center justify-between flex bg-white ">
                    <Topbar />
                    <div className="lg:hidden">
                      {displaySide ? (
                        <i
                          onClick={handleSideBar}
                          className="absolute top-1/2 -translate-y-1/2 right-5 text-black text-2xl pi pi-times "
                        ></i>
                      ) : (
                        <i
                          onClick={handleSideBar}
                          className="absolute top-1/2 -translate-y-1/2 right-5 text-black text-4xl pi pi-bars "
                        ></i>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MAIN CONTENT */}
              <div
                className={`${
                  hideTopbar ? "mt-0" : "mt-[10vh]"
                } w-full ${
                  sideBar ? "lg:w-[calc(100%-200px)]" : "lg:w-[calc(100%-80px)]"
                } absolute top-0 right-0 min-h-50`}
              >
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      ) : auth?.access && user?.email !== null && !user?.verify ? (
        <div className="">
          <VerifyEmail />
        </div>
      ) : (
        <div className="">
          <Navigate to="/" />
        </div>
      )}
    </div>
  );
}