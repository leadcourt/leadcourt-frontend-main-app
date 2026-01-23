import { ReactNode } from "react";
import { useRecoilValue, useResetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import {
  accessTokenState,
  creditState,
  refreshTokenState,
  userState,
} from "../utils/atom/authAtom";
import { toast } from "react-toastify";
import logo from "../assets/logo/logo.png";
import { collabCreditState, collabProjectState } from "../utils/atom/collabAuthAtom";

type TopbarProps = {
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
  onToggleSidebar?: () => void;
  mobileSidebarOpen?: boolean;
};

export default function Topbar({
  leftSlot,
  centerSlot,
  rightSlot,
  className = "",
  onToggleSidebar,
  mobileSidebarOpen,
}: TopbarProps) {
  const credit = useRecoilValue(creditState);

  const resetAccessToken = useResetRecoilState(accessTokenState);
  const resetRefreshToken = useResetRecoilState(refreshTokenState);
  const resetUser = useResetRecoilState(userState);
  const resetCredit = useResetRecoilState(creditState);

  const resetCollabcreditInfo = useResetRecoilState(collabCreditState);
  const resetCollabState = useResetRecoilState(collabProjectState);

  const navigate = useNavigate();

  const logout = () => {
    resetAccessToken();
    resetRefreshToken();
    resetUser();
    resetCredit();
    resetCollabState();
    resetCollabcreditInfo();
    toast.success("Log out successful");
    navigate("/");
  };

  return (
    <header
      className={`h-20 w-full bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate("/")}
          className="lg:hidden flex items-center gap-2"
        >
          <img src={logo} alt="LeadCourt" className="h-8" />
        </button>

        <div className="hidden lg:flex items-center min-w-0">{leftSlot}</div>
        <div className="hidden md:block min-w-0">{centerSlot}</div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {rightSlot}

        <div className="flex items-center px-3 sm:px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-gray-700 text-xs sm:text-sm font-medium">
          <i className="pi pi-wallet text-orange-600 mr-2" />
          <span className="text-orange-600 font-semibold">
            {(credit?.credits ?? 0).toLocaleString()}
          </span>
          <span className="ml-1 hidden sm:inline">credits</span>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
          title="Log out"
        >
          <i className="pi pi-sign-out text-sm" />
        </button>

        {onToggleSidebar ? (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
            title="Menu"
          >
            <i
              className={`pi ${
                mobileSidebarOpen ? "pi-times" : "pi-bars"
              } text-lg`}
            />
          </button>
        ) : null}
      </div>
    </header>
  );
}