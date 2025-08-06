import { useState } from "react";
import { Key, LoaderCircle, Lock, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
// import { FaLinkedinIn } from "react-icons/fa6";
import { useFormik } from "formik";
import { loginUserValidation } from "../../utils/validation/validation";
import { Link, useNavigate } from "react-router-dom";
import { userGoogleSignIn, userLogin } from "../../utils/api/userFirebase";
import { toast } from "react-toastify";
import { useSetRecoilState } from "recoil";
import {
  accessTokenState,
  refreshTokenState,
  userState,
} from "../../utils/atom/authAtom";
import logo from "../../assets/logo/logo.png";

interface FormData {
  email: string;
  password: string;
}

interface AuthLoading {
  loading: boolean;
  auth: string;
}

const LoginTwo = () => {
  const navigate = useNavigate();

  const setAccessToken = useSetRecoilState(accessTokenState);
  const setRefreshToken = useSetRecoilState(refreshTokenState);
  const setUser = useSetRecoilState(userState);

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [useEmail, setUseEmail] = useState<boolean>(false);

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState<AuthLoading>({loading: false,auth: ''})

  // Function for Email login
  const onSubmit = async (values: FormData) => {
    setLoading({
      loading: true,
      auth: 'email',
    })

    try {
      const res: any = await userLogin(values.email, values.password);
      if (!res?.error) {
        toast.success("Log in successful");

        setAccessToken(res.access);
        setRefreshToken(res.refresh);
        setUser(res.user);

        navigate("/");
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Error Occurred, try again!");
    }
    setLoading({
      loading: false,
      auth: '',
    })
  };

  // Google auth login
  const googleAuth = async () => {

    setLoading({
      loading: true,
      auth: 'google',
    })
    await userGoogleSignIn()
      .then((res) => {
        if (!res?.error) {
          toast.success("Log in successful");
          setAccessToken(res.access);
          setRefreshToken(res.refresh);
          setUser(res.user);

          navigate("/");
        } else {
          toast.error(res.error);
        }
      })
      .catch(() => {
        toast.error("Error Occurred, try again!");
      });

    setLoading({
      loading: false,
      auth: '',
    })
  };

  // Initial value for Formik
  const initialValues: FormData = {
    email: "",
    password: "",
  };

  // Formik
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
    validationSchema: loginUserValidation,
    onSubmit,
  });

  return (
    <div className="w-full md:w-[60%] min-h-[100vh] flex items-center justify-center px-6 py-8">
      {/* Right side - Login container */}
      <div className="w-full max-w-md">
        <div className="md:hidden w-fit m-auto mb-10">
          <img src={logo} alt="" className="h-20" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome!</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-2 mb-6">
          <button
            onClick={googleAuth}
            className="flex items-center gap-3 justify-center w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {loading.loading === true && loading.auth === 'google' ?
            <i className="pi pi-spinner pi-spin " ></i>
            :
            <FcGoogle />
          }
            <span className=" text-gray-700">Log In with Google</span>
          </button>

          {/* <button className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <FaLinkedinIn className="p-1 text-xl bg-gray-700 text-white" />

            <span className="ml-3 text-gray-700">Log In with LinkedIn</span>
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

        {/* <div className="primary-btn-red"></div> */}
        {useEmail ? (
          <div className="mb-">
            {/* Email Login */}
            <form className="" onSubmit={handleSubmit}>
              {/* Email Address Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail size={20} className="text-orange-500" />
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
                <label className="block text-xs font-medium text-gray-700 uppercase mt-5 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute h-full w-11 left-0 flex cursor-pointer items-center pl-3"
                  >
                    {passwordVisible ? (
                      <Key size={20} className="text-orange-500 " />
                    ) : (
                      <Lock size={20} className="text-orange-500" />
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
                  <p className="error text-sm text-red-400">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center my-5 mb-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="remember" className="ml-2 block text-gray-700">
                  Keep me signed in
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                // onClick={handleSubmit}
                className=" secondary-btn-red flex gap-3 items-center justify-center"
              >
                {isSubmitting && isValid ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  ""
                )}
                Log in
              </button>
            </form>

            {/* Forgot password Link */}
            <div className="text-center mt-3 text-[20px]">
              <small className="text-gray-600 ">
                Forgot Password?
                <Link
                  to="/auth/forgotpassword"
                  className="ml-1 text-orange-500 hover:text-purple-600  "
                >
                  Click here to recover
                </Link>
              </small>
            </div>
          </div>
        ) : (
          <div className="">
            <button
              onClick={() => setUseEmail(true)}
              className="secondary-btn-red flex justify-center items-center gap-3"
            >
              <i className="pi pi-envelope "></i> Login with Email
            </button>
          </div>
        )}

        {/* Sign Up Link */}
        <div className="text-center mt-4 text-[20px]">
          <small className="text-gray-600 ">
            Don't have an account?
            <Link
              to="/auth/register"
              className="text-orange-500 hover:text-orange-600 ml-1 font-medium"
            >
              Create an account
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginTwo;
