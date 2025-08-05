import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import { verificationValidation } from "../../utils/validation/validation";
// import { useFormik } from "formik";
import logo from "../../assets/logo/logoDark.png";
// import { userResetPassword } from "../../utils/api/userFirebase";
import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
// import { toast } from "react-toastify";
import authBG from "../../assets/background/bg_gradient.jpg";
import { getAuth, reload, sendEmailVerification } from "firebase/auth";
import { useRecoilState } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { toast } from "react-toastify";

// interface FormData {
//   otp: number;
// }
export default function VerifyEmail() {
  // const [email, setEmail] = useState('markclarke@gmail.com');
  const [modalVisible, setModalVisible] = useState(false);
  // const [loading, setLoading] = useState(false);

  const [user, setUser] = useRecoilState(userState);
  const navigate = useNavigate();

  const auth = getAuth()

  // const [params] = useSearchParams();
  // const mode = params?.get("mode");
  // const oobCode = params?.get("oobCode");

  // // Get the action to complete.
  //   const mode = getParameterByName('mode');
  //   // Get the one-time code from the query parameter.
  //   const actionCode = getParameterByName('oobCode');
  //   // (Optional) Get the continue URL from the query parameter if available.
  //   const continueUrl = getParameterByName('continueUrl');
  //   // (Optional) Get the language code if available.

  // const onSubmit = async (values: FormData) => {
  //   setLoading(true);
  //   await userResetPassword(values)
  //     .then((res) => {
  //       if (res.message == 'success') {
  //         setModalVisible(true);
  //         return
  //       } else if (res.message == 'failed') {
  //         toast.error('Error occured')
  //       }
  //     })

  //   setLoading(false);
  // };

  // const initialValues: FormData = {
  //   otp: 0,
  // };

  // const {
  //   values,
  //   errors,
  //   isValid,
  //   isValidating,
  //   isSubmitting,
  //   touched,
  //   handleBlur,
  //   handleChange,
  //   handleSubmit,
  // } = useFormik({
  //   validateOnMount: true,
  //   initialValues: initialValues,
  //   validationSchema: verificationValidation,
  //   onSubmit,
  // });

  const resendVerification = async () => {
    // if (user) {
    const userAccount = auth.currentUser
    if (userAccount) {
      await sendEmailVerification(userAccount);
    }
    toast.info(
      "An email has been sent to your account, please check to proceed."
    );
  };


  const reloadUser = () => {
    
    const userAccount = auth.currentUser
    if (userAccount) {
      reload(auth.currentUser).then((res) => {
      console.log('log res', res);

      const payload = {
        email: user?.email || '',
        id: user?.id || '',
        name: user?.name || '',
        verify: true,
      }
      setUser(payload)
      // if (user.emailVerified) {
      //   console.log("Email is verified!");
      //   // Proceed with giving user access or updating UI
      // } else {
      //   console.log("Email is not verified yet.");
      // }
    });
    }
  };

  useEffect(() => {
      // console.log(user);
    reloadUser()
  }, []);

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
                onClick={() => navigate("/")}
                className="secondary-btn-red"
              >
                Proceed
              </button>
            </div>
          </Dialog>
        </div>

        <div className="w-full max-w-md">
          <div className="md:hidden w-fit m-auto mb-10">
            <img src={logo} alt="" className="h-20" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Verify your account
            </h1>
            <p className="text-gray-600">
              An email has been sent to you, Please proceed to your email to
              verify your account.
            </p>
          </div>

          {/* <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 uppercase mb-2">
              OTP code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <i className="pi pi-lock text-red-500"></i>
              </div>
              <input
                name="otp"
                type="text"
                value={values.otp !== 0 ? values.otp : ''}
                
                onChange={handleChange}
                onBlur={handleBlur}
                className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                placeholder="Enter your otp"
                required
              />
            </div>
            {errors.otp && touched.otp && (
              <p className="error text-sm text-red-400">{errors.otp}</p>
            )}
          </div>


          {loading ? (
            <button
              type="button"
              className="secondary-btn-red !bg-[#f34f146c] flex items-center justify-center gap-2 "
            >
              <i className="pi pi-spin pi-spinner text-xl"></i>
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isValid || isValidating || isSubmitting}
              className="secondary-btn-red"
            >
              Continue
            </button>
          )}
        </form> */}

          {/* Forgot password Link */}
          <div className="text-center mt-3">
            <button
              // to="/auth/user-login"
              onClick={resendVerification}
              className="secondary-btn-red2 hover:text-orange-600 text-sm"
            >
              Click here to resend otp...
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
