import { Navigate, Outlet } from "react-router-dom";
import { useRecoilValue } from "recoil";
import {
  accessTokenState,
  refreshTokenState,
  userState,
} from "../../utils/atom/authAtom";
import { useEffect } from "react";


export default function AuthLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const refreshToken = useRecoilValue(refreshTokenState);
  const user = useRecoilValue(userState);

  const auth = {
    access: accessToken,
    token: refreshToken,
  };

  useEffect(() => {
    console.log("AuthLayout");
    console.log(user);
  });

  return (
    <div>
      {auth?.access && !!user?.email && !user?.verify ? (
        <Outlet />
      ) : (
        <Navigate to="/" />
      )}
    </div>
  );
}
