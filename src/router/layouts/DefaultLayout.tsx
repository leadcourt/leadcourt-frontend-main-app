import { Navigate, Outlet } from "react-router-dom";
import authBG from '../../assets/background/bg_gradient.jpg'
import { useRecoilValue } from "recoil";
import { accessTokenState, refreshTokenState, userState } from "../../utils/atom/authAtom";
import logo from "../../assets/logo/logoDark.png";
import { useEffect } from "react";


export default function DefaultLayout() {
  
    const accessToken = useRecoilValue(accessTokenState);
    const refreshToken = useRecoilValue(refreshTokenState);
    const user = useRecoilValue(userState);
  

  const auth = {
    access: accessToken,
    token: refreshToken
  }

   useEffect(()=>{

     console.log('DefaultLayout')
     console.log(user);
     
   })

  return (
    <div>
      {/* {auth?.access && user.email === 'customer' ? ( */}
      {auth?.access && !!user?.email ? (

        <Navigate to="/dashboard" />
      ) :
      (
        <div className="flex min-h-full w-full overflow-hidden">
          {/* Left side - Orange gradient background */}
          <div className="relative hidden md:block md:w-[40%] ">
            <div className="fixed top-0 h-[100vh] w-[40%] rounded-r-[30px] overflow-hidden">

          <div className="absolute w-full h-full flex items-end justify-center m-auto ">
            <img src={logo} alt="" className="h-30 opacity-[90%] mb-10" />
          </div>
                <img src={authBG} className="h-full w-full" alt="" />
            </div>
          </div>
            <Outlet />
        </div>
      )}

      {/* <Outlet /> */}

      {/* auth?.token && user.role === 'staff' ? 
      (
        <Navigate to="/admin/dashboard" />

      ) : */}
    </div>
  );
}

