import { useEffect, useMemo, useRef, useState } from "react";
import menu from "../utils/menuLinks.json";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useResetRecoilState } from "recoil";
import {
  accessTokenState,
  creditState,
  refreshTokenState,
  userState,
} from "../utils/atom/authAtom";
import logo from "../assets/logo/logo.png";
import logoSmall from "../assets/logo/logoSmall.png";
import { toast } from "react-toastify";
import {
  collabCreditState,
  collabProjectState,
} from "../utils/atom/collabAuthAtom";

type SubLink = { text: string; link: string };
type MenuLink = { text: string; img?: string; link?: string; sub?: SubLink[] };

type SidebarProps = {
  forceExpanded?: boolean;
  onRequestClose?: () => void;
  className?: string;
};

const normalize = (l?: string | null) => {
  if (!l || l === "#") return null;
  return l.startsWith("/") ? l : `/${l}`;
};

const findActiveParent = (links: MenuLink[], path: string) => {
  let best:
    | {
        text: string;
        matchLen: number;
        hasSub: boolean;
      }
    | null = null;

  for (const m of links) {
    const parent = normalize(m.link ?? null);
    const subs = m.sub ?? [];
    const candidates = [
      ...(parent ? [parent] : []),
      ...(subs.map((s) => normalize(s.link)).filter(Boolean) as string[]),
    ];

    for (const l of candidates) {
      const isMatch = path === l || path.startsWith(`${l}/`);
      if (isMatch) {
        const len = l.length;
        if (!best || len > best.matchLen) {
          best = { text: m.text, matchLen: len, hasSub: subs.length > 0 };
        }
      }
    }
  }

  if (path.startsWith("/user/setting")) {
    return { text: "Settings", matchLen: 999, hasSub: false };
  }

  return best;
};

const Sidebar: React.FC<SidebarProps> = ({
  forceExpanded,
  onRequestClose,
  className = "",
}) => {
  const [menuItem, setMenuItem] = useState<string | null>(null);
  const [menuItemDrop, setMenuItemDrop] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAccessToken = useResetRecoilState(accessTokenState);
  const resetRefreshToken = useResetRecoilState(refreshTokenState);
  const resetUser = useResetRecoilState(userState);
  const resetCredit = useResetRecoilState(creditState);

  const resetCollabcreditInfo = useResetRecoilState(collabCreditState);
  const resetCollabState = useResetRecoilState(collabProjectState);

  const navigate = useNavigate();
  const location = useLocation();

  const menuList = useMemo(
    () => menu[0] as { role: string; links: MenuLink[] },
    []
  );

  const expanded = forceExpanded ? true : sidebarExpanded;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  const handleEnter = () => {
    if (forceExpanded) return;
    clearCloseTimer();
    setSidebarExpanded(true);
  };

  const handleLeave = () => {
    if (forceExpanded) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setSidebarExpanded(false), 120);
  };

  const dropMenuItem = (text: string) => {
    setMenuItem((prev) => {
      if (prev === text) {
        setMenuItemDrop((d) => !d);
      } else {
        setMenuItemDrop(true);
      }
      return text;
    });
  };

  const maybeCloseDrawer = () => {
    if (forceExpanded) onRequestClose?.();
  };

  const logout = () => {
    resetAccessToken();
    resetRefreshToken();
    resetUser();
    resetCredit();
    resetCollabState();
    resetCollabcreditInfo();
    toast.success("Log out successful");
    maybeCloseDrawer();
    navigate("/");
  };

  useEffect(() => {
    const active = findActiveParent(menuList.links, location.pathname);
    if (active) {
      setMenuItem(active.text);
      setMenuItemDrop(active.hasSub);
    } else {
      setMenuItem(menuList.links[0]?.text ?? null);
      setMenuItemDrop(false);
    }
  }, [location.pathname, menuList.links]);

  const settingsActive = location.pathname.startsWith("/user/setting");

  return (
    <aside
  className={`h-screen bg-white border-r border-gray-200 shadow-sm z-40 flex flex-col transition-[width] duration-300 ease-in-out will-change-[width] lg:sticky lg:top-0 lg:self-start ${
    expanded ? "w-64" : "w-20"
  } ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="h-20 flex items-center justify-center border-b border-gray-200">
        <Link
          to="/"
          className="flex items-center justify-center w-full"
          onClick={maybeCloseDrawer}
        >
          <img
            src={expanded ? logo : logoSmall}
            alt="LeadCourt"
            className={`object-contain transition-all ${
              expanded ? "h-12 w-auto" : "h-8 w-10"
            }`}
          />
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        {menuList.links.map((item, index) => {
          const active = menuItem === item.text;
          const to = normalize(item.link) ?? "#";
          const hasSub = !!item.sub?.length;

          return (
            <div key={`${item.text}-${index}`} className="mb-2">
              <Link
                to={to}
                onClick={() => {
                  dropMenuItem(item.text);
                  if (!hasSub) maybeCloseDrawer();
                }}
                className="block"
              >
                <div
                  className={`flex items-center h-12 px-4 rounded-lg cursor-pointer transition-all ${
                    active
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <i className={`pi ${item.img ?? ""} text-lg`} />
                  {expanded && (
                    <span className="ml-4 text-sm font-medium whitespace-nowrap">
                      {item.text}
                    </span>
                  )}
                  {expanded && hasSub && (
                    <i
                      className={`pi ml-auto text-xs opacity-70 ${
                        active && menuItemDrop
                          ? "pi-chevron-down"
                          : "pi-chevron-right"
                      }`}
                    />
                  )}
                </div>
              </Link>

              {expanded && hasSub && active && menuItemDrop && (
                <div className="mt-2 pl-12 flex flex-col gap-2">
                  {item.sub!.map((s, sIdx) => {
                    const subTo = normalize(s.link) ?? "#";
                    const isSubActive =
                      location.pathname === subTo ||
                      location.pathname.startsWith(`${subTo}/`);

                    return (
                      <Link
                        key={`${s.text}-${sIdx}`}
                        to={subTo}
                        onClick={maybeCloseDrawer}
                        className={`text-sm transition-colors ${
                          isSubActive
                            ? "text-orange-600 font-semibold"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {s.text}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-2">
          <Link
            to="/user/setting"
            onClick={() => {
              dropMenuItem("Settings");
              maybeCloseDrawer();
            }}
          >
            <div
              className={`flex items-center h-12 px-4 rounded-lg cursor-pointer transition-all ${
                settingsActive
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <i className="pi pi-cog text-lg" />
              {expanded && (
                <span className="ml-4 text-sm font-medium whitespace-nowrap">
                  Settings
                </span>
              )}
            </div>
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className={`w-full flex items-center justify-center gap-3 h-12 rounded-lg border transition-all ${
            expanded ? "px-4" : "px-0"
          } bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700`}
        >
          <i className="pi pi-sign-out text-base" />
          {expanded && <span className="text-sm font-medium">Log out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;