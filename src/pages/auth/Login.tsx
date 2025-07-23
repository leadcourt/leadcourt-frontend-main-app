import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Key, LoaderCircle } from 'lucide-react';
import { useFormik } from 'formik';
import { loginUserValidation } from '../../utils/validation/validation';
import { userLogin } from '../../utils/api/userFirebase';
import { toast } from 'react-toastify';
import { useSetRecoilState } from 'recoil';
import { accessTokenState, refreshTokenState, userState } from '../../utils/atom/authAtom';
import logo from '../../assets/logo/logo.png'

interface FormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {


    const setAccessToken = useSetRecoilState(accessTokenState);
    const setRefreshToken = useSetRecoilState(refreshTokenState);
    const setUser = useSetRecoilState(userState);
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  
    const navigate = useNavigate()
 
  const onSubmit = async (values: FormData) => {

    try{
      const res: any = await userLogin(values.email, values.password)
      if (!res?.error) {
        toast.success('Log in successful');

        setAccessToken(res.access);
        setRefreshToken(res.refresh);
        setUser(res.user);

        navigate('/')
        
      } else {
        toast.error(res.error);
      }

      
    } catch(err){
      toast.error('Error Occurred, try again!');
    }
      
  };

  

  const initialValues: FormData = {
    email: "",
    password: "",
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
    validationSchema: loginUserValidation,
    onSubmit 
  });
 

  return (
      <div className="w-full md:w-[60%] min-h-[100vh] flex items-center justify-center px-6 py-8">
        {/* Right side - Form container */}
      <div className="w-full max-w-md">

      <div className="md:hidden w-fit m-auto mb-10">
        <img src={logo} alt="" className="h-20" />
        </div>

        <div className="text-center mb-15">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>
          <p className="text-gray-600">Sign in to continue using our service</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Address Field */}
            <div>
                <div className="relative h-12 mb-2 ">
                    <label className={`block absolute ${values.email.length == 0 ?'top-0 ml-15':'bottom-full'} ease-in-out text-xs font-bold text-gray-500 uppercase mb-1`}>Email Address</label>
                    <div className="absolute left-0 flex justify-center items-center rounded-2xl bg-orange-100 h-12 w-12 mr-3">
                        <Mail size={20} className="text-orange-500 " />
                    </div>
                    <input
                    type="email"
                    name="email"
                    value={values.email}
                    placeholder=''                  
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="absolute top-0 left-15 h-12 w-[85%] border-gray-100 border-b py-3 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                    required
                    />
                </div>
                {errors.email && touched.email && (
                    <p className="error text-sm text-red-400">
                    {errors.email} 
                    </p>
                )}
            </div>
           
          {/* Password Field */}
          <div>

            {/* <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Password</label> */}
            <div className="relative h-12 mb-2 mt-10 ">
                <label className={`block absolute ${values.password.length == 0 ?'top-0 ml-15':'bottom-full'} ease-in-out text-xs font-bold text-gray-500 uppercase mb-1`}>Password</label>
                            
              <div onClick={() => setPasswordVisible(!passwordVisible)} className="absolute left-0 flex justify-center items-center rounded-2xl bg-orange-100 h-12 w-12 mr-3 cursor-pointer">
                {
                  passwordVisible ?
                  <Key size={20} className="text-orange-500" /> 
                  :
                  <Lock size={20} className="text-orange-500" /> 
                }
              </div>
              <input
                type={passwordVisible ? 'text' : 'password'} 
                name="password"
                value={values.password}
                placeholder=''
                onChange={handleChange}
                onBlur={handleBlur}
                className="absolute top-0 left-15 h-12 w-[85%] border-gray-100 border-b py-3  focus:ring-orange-100 focus:outline-none"
                required
              /> 
            </div>
            
            {errors.password && touched.password && (
                  <p className="error text-sm text-red-400">
                    {errors.password}
                  </p>
                 )}
          </div>

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
                Sign in
              </button>
        </form>


        {/* Forgot password Link */}
        <div className="text-center mt-3">
          <p className="text-gray-600">
            <Link to="/auth/forgotpassword" className="text-orange-500 hover:text-orange-600 text-sm">
            Forgot Password?
            </Link>
          </p>
        </div>
        
        {/* Sign Up Link */}
        <div className="text-center ">
          <small className="text-gray-600">
            Don't have an account? 
            <Link to="/auth/register" className="text-orange-500 hover:text-orange-600 ml-1 font-medium">
              Create an account
            </Link>
          </small>
        </div>
        
      </div>
    </div>
  );
};

export default Login;