import { Key, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { resetPasswordValidation } from "../../utils/validation/validation";
import { useFormik } from "formik";
import logo from "../../assets/logo/logo.png";
import { handleResetPassword } from "../../utils/api/userFirebase";
import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";

interface FormData {
  oldPassword: string;
  newPassword: string;
  newPasswordAgain: string;
}
export default function ResetPassword() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oldPasswordVisible, setOldPasswordVisible] = useState<boolean>(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState<boolean>(false);
  const [newPasswordVisible2, setNewPasswordVisible2] =
    useState<boolean>(false);

  const navigate = useNavigate();

  const onSubmit = async (values: FormData) => {
    setLoading(true);

    await handleResetPassword(values.newPassword)
      .then((res: any) => { 
        if (res === "Invalid reset link") {
          return;
        }
        setModalVisible(true);
        toast.error(res);
        values.oldPassword = ''
        values.newPassword = ''
        values.newPasswordAgain = '' 
      })
      .catch(( ) => {
        // console.error("error occured", err);
      });

    setLoading(false);
  };

  const initialValues: FormData = {
    oldPassword: "",
    newPassword: "",
    newPasswordAgain: "",
  };

  const {
    values,
    errors,
    isValid,
    isValidating,
    isSubmitting,
    touched,
    handleBlur,
    handleChange,
    handleSubmit,
  } = useFormik({
    validateOnMount: true,
    initialValues: initialValues,
    validationSchema: resetPasswordValidation,
    onSubmit,
  });
 

  return (
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
              Password Changed Successfully
            </h4>
            <p className="text-gray-500">
              Your password has been changed successfully. Proceed to the login
              page to login.
            </p>

            <button onClick={() => navigate("/")} className="secondary-btn-red">
              Proceed
            </button>
          </div>
        </Dialog>
      </div>

      <div className="w-full max-w-md">
        <div className="md:hidden w-fit m-auto mb-10">
          <img src={logo} alt="" className="h-20" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Reset Your Password Here
          </h1>
          {/* <p className="text-gray-600">Enter your new Password below..</p> */}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Old Password Field */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase mt-5 mb-1">
              Enter the last password you remember
            </label>
            <div className="relative">
              <div
                onClick={() => setOldPasswordVisible(!oldPasswordVisible)}
                className="absolute h-full w-11 left-0 flex cursor-pointer items-center pl-3"
              >
                {oldPasswordVisible ? (
                  <Key size={20} className="text-orange-500 " />
                ) : (
                  <Lock size={20} className="text-orange-500" />
                )}
              </div>
              <input
                type={oldPasswordVisible ? "text" : "password"}
                name="oldPassword"
                value={values.oldPassword}
                placeholder="********"
                onChange={handleChange}
                onBlur={handleBlur}
                className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                required
              />
            </div>

            {errors.oldPassword && touched.oldPassword && (
              <p className="error text-sm text-red-400">{errors.oldPassword}</p>
            )}
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase mt-5 mb-1">
              New Password
            </label>
            <div className="relative">
              <div
                onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                className="absolute h-full w-11 left-0 flex cursor-pointer items-center pl-3"
              >
                {newPasswordVisible ? (
                  <Key size={20} className="text-orange-500 " />
                ) : (
                  <Lock size={20} className="text-orange-500" />
                )}
              </div>
              <input
                type={newPasswordVisible ? "text" : "password"}
                name="newPassword"
                value={values.newPassword}
                placeholder="********"
                onChange={handleChange}
                onBlur={handleBlur}
                className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                required
              />
            </div>

            {errors.newPassword && touched.newPassword && (
              <p className="error text-sm text-red-400">{errors.newPassword}</p>
            )}
          </div>

          {/* New Password2 Field */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-700 uppercase mt-5 mb-1">
              Enter Password Again
            </label>
            <div className="relative">
              <div
                onClick={() => setNewPasswordVisible2(!newPasswordVisible2)}
                className="absolute h-full w-11 left-0 flex cursor-pointer items-center pl-3"
              >
                {newPasswordVisible2 ? (
                  <Key size={20} className="text-orange-500 " />
                ) : (
                  <Lock size={20} className="text-orange-500" />
                )}
              </div>
              <input
                type={newPasswordVisible2 ? "text" : "password"}
                name="newPasswordAgain"
                value={values.newPasswordAgain}
                placeholder="********"
                onChange={handleChange}
                onBlur={handleBlur}
                className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                required
              />
            </div>

            {errors.newPasswordAgain && touched.newPasswordAgain && (
              <p className="error text-sm text-red-400">
                {errors.newPasswordAgain}
              </p>
            )}
          </div>
          {/* Continue Button */}

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
        </form>

        {/* Forgot password Link */}
        <div className="text-center mt-3">
          <p className="text-gray-600">
            <Link
              to="/auth/user-login"
              className="text-orange-500 hover:text-orange-600 text-sm"
            >
              Proceed to login Here..
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
