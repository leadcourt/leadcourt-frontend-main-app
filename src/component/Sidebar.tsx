import { useEffect, useMemo, useState } from "react";
import menu from "../utils/menuLinks.json";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useResetRecoilState } from "recoil";
import {
  accessTokenState,
  creditState,
  refreshTokenState,
  userState,
} from "../utils/atom/authAtom";
import logo from "../assets/logo/logoDark.png";
import { toast } from "react-toastify";
import authBG from "../assets/background/bg_gradient.jpg";
import {
  collabCreditState,
  collabProjectState,
} from "../utils/atom/collabAuthAtom";

interface ChildData {
  updateBar: (sidebarCollapse: boolean) => void;
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

  if (path.startsWith("/user/setting")) {
    return { text: "Settings", matchLen: 999, hasSub: false };
  }

  return best;
};

const Sidebar: React.FC<ChildData> = ({ updateBar }) => {
  const [menuItem, setMenuItem] = useState<string | null>(null);
  const [menuItemDrop, setMenuItemDrop] = useState(false);

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

  useEffect(() => {
    updateBar(true);
  }, []);

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
    <div className="overflow-hidden text-white fixed w-[80%] lg:w-[200px] h-[100vh]">
      <img src={authBG} className="absolute rotate-180 h-full w-full" alt="" />

      <div className="relative h-full">
        <div className="lg:hidden h-[20vh] p-3 text-2xl">
          <img src={logo} alt="LeadCourt" className="h-15" />
        </div>

        <div className="hidden lg:flex p-5 items-center gap-1">
          <div className="flex items-center justify-center w-full mb-20">
            <Link to={"/"}>
              <img src={logo} alt="LeadCourt" className="h-8" />
            </Link>
          </div>
        </div>

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
                  <div className="flex items-center gap-2 mr-5 rounded-r-xl px-5 py-1 transition-transform duration-150 will-change-transform hover:scale-[1.02] active:scale-[0.99]">
                    <i className={`pi ${item.img ?? ""}`}></i>
                    <p>{item.text}</p>
                  </div>
                </Link>

                {item?.sub && item.sub.length > 0 && menuItemDrop && active && (
                  <div className="pl-10 flex flex-col gap-3 mt-2">
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

          <div
            className={`py-2 mr-2 rounded-r-xl ${
              menuItem === "Settings" ? "bg-white text-[#F35114]" : "text-white"
            }`}
          >
            <Link to="/user/setting" onClick={() => dropMenuItem("Settings")}>
              <div className="flex items-center gap-2 mr-5 rounded-r-xl px-5 py-1 transition-transform duration-150 will-change-transform hover:scale-[1.02] active:scale-[0.99]">
                <i className="pi pi-cog"></i>
                <p>Settings</p>
              </div>
            </Link>
          </div>
        </div>

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