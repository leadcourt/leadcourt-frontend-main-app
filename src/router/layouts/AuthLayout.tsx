import authBG from "../../assets/background/bg_gradient.jpg";
import { Outlet } from "react-router-dom";
import logo from "../../assets/logo/logo.png";

export default function AuthFrame() {
  return (
    <div className="flex min-h-full w-full overflow-hidden">
      {/* Left side - Orange gradient background */}
      <div className="relative hidden md:block md:w-[40%] ">
        <div className="fixed top-0 h-[100vh] w-[40%] rounded-r-[30px] overflow-hidden">
          <img src={authBG} className="h-full w-full" alt="" />
        </div>
          <div className="absolute top-0 z-50 w-fit m-auto mb-10">
            <img src={logo} alt="" className="h-20" />
          </div>
      </div>
      <Outlet />
    </div>
  );
}
