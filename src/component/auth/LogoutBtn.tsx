import { useResetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { accessTokenState, creditState, refreshTokenState, userState } from "../../utils/atom/authAtom";

const LogoutBtn = () => {
  const navigate = useNavigate();

  const resetAccessToken = useResetRecoilState(accessTokenState);
  const resetRefreshToken = useResetRecoilState(refreshTokenState);
  const resetUser = useResetRecoilState(userState);
  const resetCredit = useResetRecoilState(creditState);
  

  const handleLogout = () => {
    resetAccessToken();
    resetRefreshToken();
    resetUser();
    resetCredit()
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 cursor-pointer bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
    >
      Logout
    </button>
  );
};

export default LogoutBtn;