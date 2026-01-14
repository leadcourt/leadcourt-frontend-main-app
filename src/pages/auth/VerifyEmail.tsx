import { User } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/logo/logoDark.png";
import logoLight from "../../assets/logo/logo.png";
import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import authBG from "../../assets/background/bg_gradient.jpg";
import {
  applyActionCode,
  getAuth,
  reload,
  sendEmailVerification,
} from "firebase/auth";
import { useRecoilState } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { toast } from "react-toastify";

 export default function VerifyEmail() {
  const [modalVisible, setModalVisible] = useState(false);

  const [user, setUser] = useRecoilState(userState);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("");
  const navigate = useNavigate();

  const auth = getAuth();
  const authUser = auth.currentUser;

  const [params] = useSearchParams();
  const mode = params?.get("mode");
  const oobCode = params?.get("oobCode");
 
  const resendVerification = async () => {
    setLoading(true);
    setAction("resendOTP");

    if (authUser) {
      await sendEmailVerification(authUser);

      toast.info(
        "An email has been sent to your account, please check to proceed."
      );
    }
    setAction("");
    setLoading(false);
  };
  
  const reloadUser = async () => {
    setAction("reload");
    setLoading(true);

    try {
      // Case A: coming from email link
      if (mode === "verifyEmail" && oobCode) {
        await applyActionCode(auth, oobCode);
      }

      // Case B: in-app screen (no params) — just refresh and check verified flag
      if (auth.currentUser) {
        await reload(auth.currentUser);
      }

      const isVerified =
        (mode === "verifyEmail" && !!oobCode) || !!auth.currentUser?.emailVerified;

      if (isVerified) {
        const payload = {
          email: user?.email || auth.currentUser?.email || "",
          id: user?.id || "",
          name: user?.name || auth.currentUser?.displayName || "",
          verify: true,
        };

        setUser(payload);
        setModalVisible(true);
        toast.success("Your account is now verified");
      }
    } catch (e) {
      toast.error("Verification link is invalid or expired");
    } finally {
      setAction("");
      setLoading(false);
    }
  };

  useEffect(() => {}, []);

  return (
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

      <div className="w-full min-h-[100vh] md:w-[60%] flex items-center justify-center px-6 py-8">
        {/* Right side - Form container */}

        {/* <Dialog header="Header" visible={modalVisible} style={{ width: '50vw' }} onHide={() => {if (!modalVisible) return; setModalVisible(false); }} > */}

        <div
          className={`card fixed top-0 left-0 w-full h-full p-10 z-50 ${
            !modalVisible ? "hidden" : "flex"
          }  bg-[#1f1f1f59] justify-content-center`}
        >
          {/* <Button label="Show" icon="pi pi-external-link" onClick={() => setVisible(true)} /> */}
          <Dialog
            visible={modalVisible}
            onHide={() => {
              if (!modalVisible) return;
              setModalVisible(false);
            }}
            style={{ maxWidth: "400px" }}
            className="bg-white p-7 rounded-lg"
            breakpoints={{ "960px": "75vw", "641px": "100vw" }}
          >
            <div className="bg-purple-800 w-fit flex justify-center m-auto items-center rounded-md p-3">
              <User size={20} className=" text-white" />
            </div>

            <div className=" text-center flex flex-col gap-3 mx-5">
              <h4 className=" font-bold text-gray-700">
                Account Verification Successful!
              </h4>
              <p className="text-gray-500">You can click here to continue.</p>

              <button
                onClick={() => navigate("/dashboard")}
                className="secondary-btn-red"
              >
                Proceed
              </button>
            </div>
          </Dialog>
        </div>

        <div className="w-full max-w-md">
          <div className="md:hidden w-fit m-auto mb-10">
            <img src={logoLight} alt="" className="h-20" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Verify your account
            </h1>

            {mode === "verifyEmail" && oobCode ? (
              <p className="text-gray-600">
                Click on the{" "}
                <span className="text-yellow-600 text-sm">Proceed</span> to
                verify your account. <br /> You can resend the email with the{" "}
                <span className="text-yellow-600  text-sm">
                  Resend Verification Link
                </span>{" "}
                button
              </p>
            ) : (
              <p className="text-gray-600">
                An email has been sent to you, Please proceed to your email to
                verify your account.
              </p>
            )}
          </div>

          {/* Forgot password Link */}
          {mode === "verifyEmail" && oobCode ? (
            <div className="text-center mt-3">
              <button
                onClick={reloadUser}
                className="secondary-btn-red2 hover:text-orange-600 text-sm flex gap-2 justify-center items-center"
              >
                {loading && action === "reload" ? (
                  <i className="pi pi-spinner pi-spin"></i>
                ) : (
                  ""
                )}
                Proceed
              </button>
            </div>
          ) : (
            ""
          )}

          <div className="text-center mt-3">
            <button
              onClick={resendVerification}
              className="secondary-btn-red hovertext-orange-600 text-sm flex gap-2 justify-center items-center"
            >
              {loading && action == "resendOTP" ? (
                <i className="pi pi-spinner pi-spin"></i>
              ) : (
                ""
              )}
              Resend Verification Link
            </button>
          </div>
          {/* <div className="text-xs text-center mt-10 text-red-600">
          Log out
        </div> */}
        </div>
      </div>
    </div>
  );
}
