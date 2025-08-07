import axios from "axios";
import { 
  useRecoilValue,
  useResetRecoilState 
} from "recoil";
import {
  accessTokenState,
  attachToken,
  creditState,
  refreshTokenState,
  userState,
} from "./utils/atom/authAtom";
import { toast } from "react-toastify";
import { collabCreditState, collabProjectState } from "./utils/atom/collabAuthAtom";

function Interceptor() {
  const resetAccessToken = useResetRecoilState(accessTokenState);
  const resetRefreshToken = useResetRecoilState(refreshTokenState);
  const resetUser = useResetRecoilState(userState);
  const creditInfor = useResetRecoilState(creditState);
  
  const collabcreditInfo = useResetRecoilState(collabCreditState);
  const collabState = useResetRecoilState(collabProjectState);

  const logout = () => {
    resetAccessToken();
    resetRefreshToken();
    resetUser();
    creditInfor();
    collabState();
    collabcreditInfo();
    // Clear cookies or any other storage if necessary
    // Cookies.remove("auth_access");
    // Cookies.remove("auth_refresh");
    // Cookies.remove("collab_collabCreditState");
    // Cookies.remove("collab_collabProjectState");  



    toast.success("Session Expired");
    window.location.href = "/"; // Redirect to login page
  };
  const mytoken = useRecoilValue(attachToken);
  

  axios.interceptors.response.use(
    (response) => response,
    (error) => {

      if (error?.response?.data?.message === 'Invalid token. Authentication failed.'){
        logout()
      }
      
      
      if (error === 'Token expired') {

        logout();
      }

          return Promise.reject(error);

    }
  );

  mytoken;

  return <></>;
}

export default Interceptor;
