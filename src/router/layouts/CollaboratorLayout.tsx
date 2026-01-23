import { Navigate, Outlet } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import { accessTokenState, refreshTokenState, userState } from "../../utils/atom/authAtom";
import ScrollButtons from "../../component/ScrollButtons";
import CollaboratorSidebar from "../../component/collaborator/CollaboratorSidebar";
import CollaboratorTopbar from "../../component/collaborator/CollaboratorTopbar";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";

export default function CollaboratorLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const refreshToken = useRecoilValue(refreshTokenState);
  const user = useRecoilValue(userState);

  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);

  const auth = { access: accessToken, token: refreshToken };

  const handleSideBar = () => setDisplaySide((prev) => !prev);

  if (auth?.access && !!user?.email) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <div className="fixed z-50 bottom-5 right-5">
          <ScrollButtons />
        </div>

        <div className="hidden lg:block h-screen shrink-0">
          <CollaboratorSidebar />
        </div>

        {displaySide ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={handleSideBar} />
            <div className="absolute left-0 top-0 h-full">
              <CollaboratorSidebar forceExpanded onRequestClose={handleSideBar} />
            </div>
          </div>
        ) : null}

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="shrink-0 bg-white border-b-gray-100 border-b-2">
            <CollaboratorTopbar onToggleSidebar={handleSideBar} mobileSidebarOpen={displaySide} />
          </div>

          <div className={`flex-1 min-w-0 min-h-0 ${displaySide ? "overflow-hidden" : "overflow-y-auto"}`}>
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return <Navigate to="/" />;
}