import authBG from '../../assets/background/authGradient.png' 
import { Outlet } from 'react-router-dom';

export default function AuthFrame() { 
  
  return (
    <div className="flex min-h-full w-full overflow-hidden">
      {/* Left side - Orange gradient background */}
      <div className="relative hidden md:block md:w-[40%] ">
        <div className="fixed top-0 h-[100vh] w-[40%] rounded-r-[30px] overflow-hidden">
            <img src={authBG} className="h-full w-full" alt="" />
        </div>
      </div>
        <Outlet />
    </div>
  );
}