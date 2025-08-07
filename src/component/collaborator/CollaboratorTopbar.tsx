import { useEffect } from "react"; 
// import fileicon from "../assets/icons/fileicon.png"; 
// import star from "../assets/icons/star.png";
import { useRecoilValue, useResetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import {
  accessTokenState,
  refreshTokenState,
  userState,
} from "../../utils/atom/authAtom";
import { collabCreditState, collabProjectState } from "../../utils/atom/collabAuthAtom";
import { toast } from "react-toastify";
import logo from '../../assets/logo/logo.png'


export default function CollaboratorTopbar() {
  // const [user, setUser] = useRecoilState(userState)
  // const [auth, setAuth] = useRecoilState(authState)
  // const [path, setPath] = useState("");
  // const [auth, setAuth] = 
  const credit = useRecoilValue(collabCreditState)
  const collabState = useRecoilValue(collabProjectState)
    
    
    
    const resetAccessToken = useResetRecoilState(accessTokenState);
    const resetRefreshToken = useResetRecoilState(refreshTokenState);
    const resetUser = useResetRecoilState(userState);
    const resetCollabState = useResetRecoilState(collabProjectState);
  const resetCollabcreditInfo = useResetRecoilState(collabCreditState);

  const navigate = useNavigate();
 
  const logout = () => {
    resetAccessToken();
    resetRefreshToken();
    resetUser();
    resetCollabcreditInfo();
    resetCollabState();
    toast.success("Log out successful");
    navigate("/");
  };

  useEffect(() => {
    // setPath(breadcrumbs());
  });

  return (
    <div className="h-[10vh]  w-full bg-white">
      <div className="h-full  flex justify-between items-center px-5 ">
        <div onClick={()=>navigate('/')} className="lg:hidden cursor-pointer">
          {/* <img src={LogoBlk} alt="" />  */}
          <img src={logo} alt="" className="h-8" />

        </div>
        <div className="hidden lg:block border rounded-2xl border-gray-300 px-5 py-2 bg-gray-300">{collabState?.ownerName}'s Dashboard</div> 

        <div className="hidden lg:flex justify-end items-center gap-5 ">
          <div className="relative">  
            <div onClick={()=>{navigate('/'); resetCollabState();}} className="secondary-btn-red button_hover w-full lg:min-w-fit flex justify-center items-center gap-2"
            >
              {/* <i className="pi pi-wallet"></i>
              <p className=" text-sm font-bold">{credit?.credits}</p> */}
              <p className="min-w-[100px] text-center text-sm font-bold">Go Home</p>
            </div>
          </div>

          <div className="relative">
            <div className="secondary-btn-red button_hover w-full lg:min-w-fit flex justify-center items-center gap-2"
            >
              {/* 
              <i className="pi pi-pencil"></i>
              <p className=" text-sm font-bold">Return</p>
              */}
              <i className="pi pi-wallet"></i>
              <p className=" text-sm font-bold">{credit?.credits}</p> 
            </div>
          </div>

          <div className="hover:border border-[#F35114] rounded flex place-items-center gap-x-5 w-full">
            <i
              className="pi pi-sign-out text-sm text-[#F35114] bg-gray-50 p-2 cursor-pointer rounded"
              onClick={logout}
            ></i>
          </div>
        </div>
      </div>
    </div>
  );
}
