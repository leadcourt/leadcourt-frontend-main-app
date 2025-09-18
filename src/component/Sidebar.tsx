import { useEffect, useMemo, useState } from "react";
import menu from "../utils/menuLinks.json";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useRecoilValue, useResetRecoilState } from "recoil";
import {
  accessTokenState,
  creditState,
  refreshTokenState,
  userState,
} from "../utils/atom/authAtom";
import logo from "../assets/logo/logoDark.png";
import { getPersonalInformation } from "../utils/api/settingsApi";
import { toast } from "react-toastify";
import authBG from "../assets/background/bg_gradient.jpg";
import { collabCreditState, collabProjectState } from "../utils/atom/collabAuthAtom";

interface ChildData {
  updateBar: (sidebarCollapse: boolean) => void;
}

interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

type SubLink = { text: string; link: string };
type MenuLink = { text: string; img?: string; link?: string; sub?: SubLink[] };

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
      ...subs.map((s) => normalize(s.link)).filter(Boolean) as string[],
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

  // handle Settings (outside JSON)
  if (path.startsWith("/user/setting")) {
    return { text: "Settings", matchLen: 999, hasSub: false };
  }

  return best;
};

const Sidebar: React.FC<ChildData> = ({ updateBar }) => {
  const [menuItem, setMenuItem] = useState<string | null>(null);
  const [menuItemDrop, setMenuItemDrop] = useState(false);
  const [sidebarCollapse, setSidebarCollapse] = useState(true);

  const user = useRecoilValue(userState);
  const [userData, setUserData] = useState<UserInfo>();

  const resetAccessToken = useResetRecoilState(accessTokenState);
  const resetRefreshToken = useResetRecoilState(refreshTokenState);
  const resetUser = useResetRecoilState(userState);
  const resetCredit = useResetRecoilState(creditState);

  const resetCollabcreditInfo = useResetRecoilState(collabCreditState);
  const resetCollabState = useResetRecoilState(collabProjectState);

  const navigate = useNavigate();
  const location = useLocation();

  const menuList = useMemo(() => menu[0] as { role: string; links: MenuLink[] }, []);

  const updateParentComponent = () => {
    updateBar(sidebarCollapse);
  };

  const handleSideBar = () => {
    setSidebarCollapse((v) => {
      const nv = !v;
      updateBar(nv);
      return nv;
    });
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

  const getPersonInfo = async (payload: any) => {
    if (!payload?.id) return;
    try {
      const res = await getPersonalInformation(payload.id);
      setUserData({
        name: res?.full_name ?? payload?.email ?? "",
        email: res?.email ?? payload?.email ?? "",
        phone: res?.phone_number ?? "",
      });
    } catch {
      // noop
    }
  };

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

  // initial mount
  useEffect(() => {
    updateParentComponent();
    if (user) getPersonInfo(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync active item with URL
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

  return (
    <div
      className={`rounded-r-4xl overflow-hidden text-white fixed ${
        sidebarCollapse ? "w-[80%] lg:w-[200px]" : "max-w-[80px]"
      } h-[100vh]`}
    >
      <img src={authBG} className="absolute rotate-180 h-full w-full" alt="" />

      <div className="relative h-full">
        {/* Mobile header */}
        <div className="lg:hidden h-[20vh] p-3 text-2xl">
          <img src={logo} alt="LeadCourt" className="h-15" />
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex p-5 items-center gap-1">
          <div
            className={`flex items-center gap-5 ${
              sidebarCollapse
                ? "justify-between mb-20"
                : "flex-col justify-between mb-15"
            } w-full`}
          >
            <Link to={"/"}>
              <img src={logo} alt="LeadCourt" className="h-8" />
            </Link>

            <i
              onClick={handleSideBar}
              className={`pi w-fit ${
                sidebarCollapse
                  ? "pi-arrow-down-left-and-arrow-up-right-to-center"
                  : "pi-arrow-up-right-and-arrow-down-left-from-center"
              } border-dotted p-1 cursor-pointer`}
            ></i>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-0 text-gray-700">
          {menuList.links.map((item, index) => {
            const active = menuItem === item.text;
            const to = normalize(item.link) ?? "#";

            return (
              <div
                key={`${item.text}-${index}`}
                className={`${item.text} py-2 mr-2 rounded-r-xl ${
                  active ? "bg-white text-[#F35114]" : "text-white"
                }`}
              >
                <Link to={to} onClick={() => dropMenuItem(item.text)}>
                  <div
                    className={`flex items-center gap-2 ${
                      sidebarCollapse
                        ? "mr-5 rounded-r-xl px-5 py-1"
                        : "justify-center py-3"
                    } transition-transform duration-150 will-change-transform hover:scale-[1.02] active:scale-[0.99]`}
                  >
                    <i className={`pi ${item.img ?? ""}`}></i>
                    {sidebarCollapse ? <p>{item.text}</p> : null}
                  </div>
                </Link>

                {/* Sub Menu */}
                {item?.sub && item.sub.length > 0 && menuItemDrop && active && (
                  <div
                    className={`${
                      sidebarCollapse ? "pl-10" : "pl-5 overflow-x-clip"
                    } flex flex-col gap-3 mt-2`}
                  >
                    {item.sub.map((s, sIdx) => {
                      const subTo = normalize(s.link) ?? "#";
                      const isSubActive =
                        location.pathname === subTo ||
                        location.pathname.startsWith(`${subTo}/`);
                      return (
                        <Link
                          key={`${s.text}-${sIdx}`}
                          to={subTo}
                          className={`text-sm cursor-pointer ${
                            isSubActive ? "text-[#F35114] font-medium" : ""
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

          {/* Settings (not in JSON) */}
          <div
            className={`py-2 mr-2 rounded-r-xl ${
              menuItem === "Settings" ? "bg-white text-[#F35114]" : "text-white"
            }`}
          >
            <Link to="/user/setting" onClick={() => dropMenuItem("Settings")}>
              <div
                className={`flex items-center gap-2 ${
                  sidebarCollapse
                    ? "mr-5 rounded-r-xl px-5 py-1"
                    : "justify-center py-3"
                } transition-transform duration-150 will-change-transform hover:scale-[1.02] active:scale-[0.99]`}
              >
                <i className="pi pi-cog"></i>
                {sidebarCollapse ? <p>Settings</p> : null}
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom (mobile logout) */}
        <div className="absolute mb-15 lg:mb-0 bottom-10 w-full">
          <div
            onClick={logout}
            className="flex lg:hidden cursor-pointer justify-center items-center gap-2 w-fit m-auto mt-5 text-red-400 bg-white px-6 py-2 rounded-full"
          >
            <i className="pi pi-sign-out"></i>
            <span>Log Out</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;