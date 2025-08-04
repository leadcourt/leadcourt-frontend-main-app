import { useEffect, useState } from "react";
import menu from "../utils/menuLinks.json";
import { Link, useNavigate } from "react-router-dom";
import { Tooltip } from "primereact/tooltip";
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

const Sidebar: React.FC<ChildData> = ({ updateBar }) => {
  const [menuItem, setMenuItem] = useState(menu[0].links[0].text || null);
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

  const menuList = menu[0];

  const updateParentComponent = () => {
    updateBar(sidebarCollapse);
  };
  const handleSideBar = () => {
    setSidebarCollapse(!sidebarCollapse);
    updateBar(!sidebarCollapse);
  };

  const dropMenuItem = (menu: any) => {
    setMenuItem(menu);

    if (menuItem == menu) {
      setMenuItemDrop(!menuItemDrop);
    } else {
      setMenuItemDrop(true);
    }
  };

  const getPersonInfo = async (payload: any) => {
    await getPersonalInformation(payload.id).then((res) => {
      setUserData({
        name: res?.full_name ?? user?.email,
        email: res?.email ?? user?.email,
        phone: res?.phone_number ?? "",
      });
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
    updateParentComponent();

    if (userData) {}
    getPersonInfo(user);
  }, []);

  return (
    <div
      className={` rounded-r-4xl overflow-hidden text-white fixed ${
        sidebarCollapse ? "w-[80%] lg:w-[200px]" : "max-w-[80px]"
      } h-[100vh]`}
    >
      <img src={authBG} className="absolute rotate-180 h-full w-full" alt="" />
      <div className="relative h-full">
        <div className="lg:hidden h-[20vh] p-3 text-2xl">
          <img src={logo} alt="" className="h-15" /> 
        </div>
        <div className="hidden lg:flex  p-5 items-center gap-1">
          <div
            className={`flex items-center  gap-5 ${
              sidebarCollapse
                ? "justify-between  mb-20"
                : "flex-col justify-between mb-15"
            }  w-full`}
          >
            {/* <div className="w-fit m-auto"> */}
            <Link to={'/'}>
            <img src={logo} alt="" className="h-8" />
            </Link>
            {/* </div> */}

            <i
              onClick={handleSideBar}
              className={`pi w-fit ${
                sidebarCollapse
                  ? "pi-arrow-down-left-and-arrow-up-right-to-center"
                  : "pi-arrow-up-right-and-arrow-down-left-from-center"
              } border-dotted p-1 hover:text-lg cursor-pointer`}
            ></i>
          </div>
        </div>


        {/* Menu Items */}
        <div className="flex flex-col gap-0 text-gray-700">
          
          {menuList.links.map((menu, index) => (
            <div
              key={index}
              className={`${menu.text} py-2 mr-2 rounded-r-xl ${
                menuItem === menu.text
                  ? "bg-white text-[#F35114]"
                  : "hover:text-lg text-white"
              }`}
            >
              <Link
                to={menu?.link ?? null}
                onClick={() => dropMenuItem(menu?.text)}
                key={index}
              >
                <Tooltip
                  event="hover"
                  position="top"
                  target=".knob"
                  content={menu.text}
                />

                <div
                  data-pr-tooltip={menu.text}
                  data-pr-position="right"
                  className={`flex items-center gap-2 ${
                    sidebarCollapse
                      ? " mr-5 rounded-r-xl px-5 py-1"
                      : "justify-center py-3"
                  }`}
                >
                  <i className={`pi ${menu.img}`}></i>
                  {sidebarCollapse ? <p className="">{menu.text}</p> : ""}
                </div>
              </Link>

              {/* Sub Menu Items */}
              {menu?.sub && menuItemDrop && (
                <div
                  className={`${
                    sidebarCollapse ? "pl-10" : "pl-5 overflow-x-clip"
                  }  flex flex-col gap-3 mt-2 `}
                >
                  {menu.sub.map((item, index) => (
                    <Link
                      key={index}
                      to={item.link}
                      className={`${
                        menuItem === menu.text ? "block" : "hidden"
                      } text-sm cursor-pointer  `}
                    >
                      {item.text}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div
              className={`  py-2 mr-2 rounded-r-xl
                ${
                menuItem === "Settings"
                  ? "bg-white text-[#F35114]"
                  : "hover:text-lg text-white"
                }
              `}
            >
              <Link
                to='/user/setting'
                onClick={() => dropMenuItem('Settings')}
              >
                <Tooltip
                  event="hover"
                  position="top"
                  target=".knob"
                  content={'Settings'}
                />

                <div
                  data-pr-tooltip='Settings'
                  data-pr-position="right"
                  className={`flex items-center gap-2 ${
                    sidebarCollapse
                      ? " mr-5 rounded-r-xl px-5 py-1"
                      : "justify-center py-3"
                  }`}
                >
                  <i className={`pi pi pi-cog`}></i>
                  {sidebarCollapse ? <p className="">Settings</p> : ""}
                </div>
              </Link>
              </div>
        </div>
        <div className="absolute mb-15 lg:mb-0 bottom-10 w-full">
 
          <div
            onClick={logout}
            className="flex lg:hidden cursor-pointer justify-center items-center gap-2 w-fit m-auto mt-5 text-red-400 bg-white px-6 py-2 rounded-full"
          >
            <i className="pi pi-sign-out "> </i>
            <span>Log Out</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
