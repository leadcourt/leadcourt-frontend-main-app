import { Mail, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordValidation } from "../../utils/validation/validation";
import { useFormik } from "formik";
import logo from "../../assets/logo/logo.png";
import { userResetPassword } from "../../utils/api/userFirebase";
import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";

interface FormData {
  email: string;
}
export default function ForgotPassword() {
  // const [email, setEmail] = useState('markclarke@gmail.com');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const onSubmit = async (values: FormData) => {
    setLoading(true);
    await userResetPassword(values)
      .then((res) => {
        if (res.message == 'success') {
          values.email = ''
          setModalVisible(true);
          return
        } else if (res.message == 'failed') {
          toast.error('Error occured')
        }
      })

    setLoading(false);
  };

  const initialValues: FormData = {
    email: "",
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
    validationSchema: forgotPasswordValidation,
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
              Change Password Request Successful!
            </h4>
            <p className="text-gray-500">
              We have just sent an email to{" "}
              <span className="font-bold text-gray-600">{values.email}</span>,
              check email to proceed.
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
            Forgot password?
          </h1>
          <p className="text-gray-600">
            Please enter your email address to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 uppercase mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail size={20} className="text-red-500" />
              </div>
              <input
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className="pl-12 w-full py-3 bg-gray-100 rounded-md focus:ring-2 focus:ring-purple-100 focus:outline-none"
                placeholder="Enter your email"
                required
              />
            </div>
            {errors.email && touched.email && (
              <p className="error text-sm text-red-400">{errors.email}</p>
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
