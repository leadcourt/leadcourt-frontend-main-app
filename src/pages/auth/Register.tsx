import { useState } from "react";
import { Mail, User, Lock, Key } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { registerUserValidation } from "../../utils/validation/validation";
import { LoaderCircle } from "lucide-react";
import { userGoogleSignIn, userSignUp } from "../../utils/api/userFirebase";
import { Dialog } from "primereact/dialog";
import { FcGoogle } from "react-icons/fc";
import logo from '../../assets/logo/logo.png'
import { toast } from "react-toastify";
import { useSetRecoilState } from "recoil";
import { accessTokenState, refreshTokenState, userState } from "../../utils/atom/authAtom";
import { addSubscriber } from "../../utils/api/data";

interface FormData {
  displayName: string;
  email: string;
  password: string;
  password2: string;
}

export default function Register() {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [password2Visible, setPassword2Visible] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);

  const setAccessToken = useSetRecoilState(accessTokenState);
  const setRefreshToken = useSetRecoilState(refreshTokenState);
  const setUser = useSetRecoilState(userState);
  const [useEmail, setUseEmail] = useState<boolean>(false);
  const navigate = useNavigate()
  
  // Function for Email Sign Up
  const onSubmit = async (values: FormData) => {
    const payload = {
      email: values.email,
      name: values.displayName,
    };

    try {
      const res = await userSignUp(values.email, values.password, values.displayName);

      if (res !== "success") {
        toast.error(res);
      } else {
        try {
          await addSubscriber(payload);
        } catch (err) {
          console.error("Failed to add subscriber", err);
        }

        setModalVisible(true);
        navigate("/");
      }
    } catch (err) {
      toast.error("Error occurred during signup");
    } finally {
      values.password = "";
      values.password2 = "";
    }
  };

  // Google auth login
  const googleAuth = async () => {
    await userGoogleSignIn()
      .then(async (res) => {
        if (!res?.error) {
          toast.success("Log in successful");
          setAccessToken(res.access);
          setRefreshToken(res.refresh);
          setUser(res.user);
          const payload = {
            email: res.user?.email,
            name:
              res.user?.displayName ||
              res.user?.name ||
              res.user?.email?.split("@")[0] ||
              "",
          };

          try {
            await addSubscriber(payload);
          } catch (err) {
            console.error("Failed to add subscriber (Google)", err);
          }

          navigate("/");
        } else {
          toast.error(res.error);
        }
      })
      .catch(() => {
        toast.error("Error Occurred, try again!");
      });
  };
  
  // Initial value for Formik
  const initialValues: FormData = {
    displayName: "",
    email: "",
    password: "",
    password2: "",
  };

  const {
    values,
    errors,
    isValid,
    isSubmitting,
    touched,
    handleBlur,
    handleChange,
    handleSubmit,
  } = useFormik({
    validateOnMount: true,
    initialValues: initialValues,
    validationSchema: registerUserValidation,
    onSubmit,
  });

  return (
    <div className="w-full md:w-[60%] min-h-[100vh] flex items-center justify-center px-6 py-8">
      {/* Right side - Form container */}

      {/* <Dialog header="Header" visible={modalVisible} style={{ width: '50vw' }} onHide={() => {if (!modalVisible) return; setModalVisible(false); }} > */}

      <div className={`card fixed top-0 left-0 w-full h-full p-10 z-50 ${!modalVisible?'hidden': 'flex'}  bg-[#1f1f1f59] justify-content-center`}>
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
            <h4 className=" font-bold text-gray-700">Registration Successful!</h4>
            <p className="text-gray-500">We have just sent an email to <span className="font-bold text-gray-600">{values.email}</span>, proceed to verify.</p>
            
            <button className="secondary-btn-red">Proceed</button>
          </div>
        </Dialog>
      </div>

      <div className="w-full max-w-md">
        <div className="md:hidden w-fit m-auto mb-10">
        <img src={logo} alt="" className="h-20" />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create an account
          </h1>
          <p className="text-gray-600">
            Please create an account to continue using our service
          </p>
          <div className="text-xs text-gray-500 p-2 m-2 bg-red-50 rounded-lg">By signing up below, you agree to LeadCourt's <i className="underline text-800"><Link to={'https://www.leadcourt.com/termsandcondition.html'}>Terms and conditions</Link></i> and <i className="underline text-800"><Link to={'https://www.leadcourt.com/privacyandpolicy.html'}>Privacy Policy</Link></i> .</div>
        </div>


                {/* Social Login Buttons */}
                <div className="space-y-2 mb-6">
                  <button  onClick={googleAuth} className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <FcGoogle />
                    {/* <img src="/api/placeholder/24/24" alt="Google logo" className="mr-2" /> */}
                    <span className="ml-3 text-gray-700">Sign Up with Google</span>
                    

                  </button>
                  <p className="text-center text-green-600 text-sm">Get 200 free credits</p>
          
                  {/* <button className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <TiVendorMicrosoft />
        
                    <span className="ml-3 text-gray-700">Sign Up with LinkedIn</span>
                  </button> */}
                </div>


        {/* Or Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {useEmail ? (

        <div className="">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User size={20} className="text-red-400" />
                </div>
                <input
                  type="text"
                  name="displayName"
                  value={values.displayName}
                  onBlur={handleBlur}
                  placeholder="Mark Clarke"
                  onChange={handleChange}
                  className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                  required
                />
              </div>

              {errors.displayName && touched.displayName && (
                <p className="error text-sm text-red-400">{errors.displayName}</p>
              )}
            </div>

            {/* Email Address Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail size={20} className="text-red-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  placeholder="markclarke@gmail.com"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                  required
                />
              </div>
              {errors.email && touched.email && (
                <p className="error text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <div
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute h-full w-11 left-0 flex cursor-pointer items-center pl-3"
                >
                  {passwordVisible ? (
                    <Key size={20} className="text-red-400" />
                  ) : (
                    <Lock size={20} className="text-red-400" />
                  )}
                </div>
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  value={values.password}
                  placeholder="********"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                  required
                />
              </div>

              {errors.password && touched.password && (
                <p className="error text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Password2 Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                Re-Enter Password
              </label>
              <div className="relative">
                <div
                  onClick={() => setPassword2Visible(!password2Visible)}
                  className="absolute h-full w-11 left-0 flex cursor-pointer items-center pl-3"
                >
                  {password2Visible ? (
                    <Key size={20} className="text-red-400" />
                  ) : (
                    <Lock size={20} className="text-red-400" />
                  )}
                </div>
                <input
                  type={password2Visible ? "text" : "password"}
                  name="password2"
                  value={values.password2}
                  placeholder="********"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                  required
                />
              </div>

              {errors.password2 && touched.password2 && (
                <p className="error text-sm text-red-400">{errors.password2}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className=" secondary-btn-red flex gap-3 justify-center"
            >
              {isSubmitting && isValid ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                ""
              )}
              Create an account
            </button>
            
              <div className="text-center text-sm">
                  <p className=" text-green-600 ">Get 500 free credits with work email</p>
              </div>
          </form>
        </div>

        )
        : (
          <div className=" flex flex-col gap-3">
          <button
            onClick={() => setUseEmail(true)}
            className="secondary-btn-red flex justify-center items-center gap-3"
            >
            <i className="pi pi-envelope "></i> Sign Up with Email
          </button>
          
              <div className="text-center text-sm">
                  <p className=" text-green-600 ">Get 500 free credits with work email</p>
              </div>
            </div>
        )}

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?
            <Link
              to="/auth/login"
              className="text-orange-500 hover:text-orange-600 ml-1 font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
