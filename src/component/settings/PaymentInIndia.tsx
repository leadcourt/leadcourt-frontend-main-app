import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { useFormik } from "formik";
import { paymentInIndiaValidation } from "../../utils/validation/validation";
import { makeDodoPayment } from "../../utils/api/payment";
import { toast } from "react-toastify";

interface userData {
  fullName: string;
  email: string;
  zipcode: string;
  subscriptionType: string;
  amount: string;
  countryCode?: string;
}

// interface PaymentInIndiaData {
//   location: string;
//   display: boolean;
//   amount: number;
//   subscriptionType: string;
// }

const PaymentInIndia = ({ paymentData }: any) => {
  const user = useRecoilValue(userState);

  const initialValues = {
    fullName: user?.name || "",
    email: user?.email || "",
    zipcode: "",
    subscriptionType: paymentData?.subscriptionType,
    amount: paymentData?.amount || 0,
    countryCode: paymentData?.countryCode || "",
  };

  const onSubmit = async (values: userData) => {
    const payload = {
      amount: values.amount,
      subscriptionType: values.subscriptionType,
      zipcode: values.zipcode,
      countryCode: values.countryCode || paymentData?.countryCode || "",
    };
    try {
      const res = await makeDodoPayment(payload);
      if (res?.data?.success && res.data.checkout_url) {
        // Instantly redirect customer to Dodo Payments Checkout page
        window.location.href = res.data.checkout_url;
      } else {
        toast.error("Payment failed, please try again!");
        console.error("Payment initiation failed", res.data);
      }
    } catch (error) {
      console.error("Dodo checkout error:", error);
      const responseError =
        (error as any)?.response?.data?.error ||
        (error as any)?.response?.data?.details?.error ||
        (error as any)?.message ||
        "Payment connection failed. Please try again.";
      toast.error(responseError);
    }
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
    validationSchema: paymentInIndiaValidation,
    onSubmit,
  });

  // useEffect(() => {
  //   // console.log(paymentData?.subscriptionType);
  // }, []);
  return (
    <div className=" mx-auto">
      <div className=" ">
        <div className="py-5">
          <form onSubmit={handleSubmit}>
            <fieldset className="border border-gray-200 rounded-lg p-2 mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <legend className="text-gray-600 text-xs">Payment Details</legend>
              <div className="  ">
                <label
                  htmlFor="subscriptionType"
                  className="text-xs text-gray-900"
                >
                  Plan Type <i className="text-red-400">*</i>
                </label>
                <input
                  name="subscriptionType"
                  value={values.subscriptionType}
                  onBlur={handleBlur}
                  type="text"
                  disabled
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm "
                  placeholder="First Name"
                />
                {errors.subscriptionType &&
                  typeof errors.subscriptionType === "string" &&
                  touched.subscriptionType && (
                    <p className="error text-sm text-red-400">
                      {errors?.subscriptionType}
                    </p>
                  )}
              </div>
              <div className="">
                <label
                  htmlFor="subscriptionType"
                  className="text-xs text-gray-900"
                >
                  Amount <i className="text-red-400">*</i>
                </label>
                <input
                  name="amount"
                  value={values.amount}
                  // onChange={handleChange}
                  onBlur={handleBlur}
                  type="text"
                  disabled
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm "
                />

                {errors?.amount &&
                  typeof errors.amount === "string" &&
                  touched?.amount && (
                    <p className="error text-sm text-red-400">
                      {errors?.amount}
                    </p>
                  )}
              </div>
            </fieldset>

            <fieldset className="border border-gray-200 rounded-lg p-2 mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <legend className="text-gray-600 text-xs">Personal Info</legend>

              <div className="col-span-2">
                <label
                  htmlFor="subscriptionType"
                  className="text-xs text-gray-900"
                >
                  Full Name <i className="text-red-400">*</i>
                </label>

                <input
                  name="fullName"
                  value={values.fullName}
                  onBlur={handleBlur}
                  type="text"
                  disabled
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm "
                />

                {errors.fullName && touched.fullName && (
                  <p className="error text-sm text-red-400">
                    {errors.fullName}
                  </p>
                )}
              </div>
              {/* <div className="">
                <label
                  htmlFor="subscriptionType"
                  className="text-xs text-gray-900"
                >
                  First Name <i className="text-red-400">*</i>
                </label>

                <input
                  name="firstName"
                  value={values.firstName}
                  onBlur={handleBlur}
                  type="text"
                  disabled
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm "
                />

                {errors.firstName && touched.firstName && (
                  <p className="error text-sm text-red-400">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="">
                <label
                  htmlFor="subscriptionType"
                  className="text-xs text-gray-900"
                >
                  Last Name <i className="text-red-400">*</i>
                </label>

                <input
                  name="lastName"
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="text"
                  disabled
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm "
                  placeholder="Last Name"
                />

                {errors.lastName && touched.lastName && (
                  <p className="error text-sm text-red-400">
                    {errors.lastName}
                  </p>
                )}
              </div> */}

              <div className="">
                <label
                  htmlFor="subscriptionType"
                  className="text-xs text-gray-900"
                >
                  Email <i className="text-red-400">*</i>
                </label>

                <input
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="text"
                  disabled
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm "
                  placeholder="Email"
                />

                {errors.email && touched.email && (
                  <p className="error text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <input name="countryCode" value={values.countryCode} type="hidden" />

            </fieldset>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              // onClick={handleSubmit}
              className={`secondary-btn-red2 ${
                !isValid || isSubmitting ? "!bg-gray-400" : ""
              } flex gap-3 items-center justify-center`}
            >
              {isSubmitting ? <i className="pi pi-spinner pi-spin"></i> : ""}
              Proceed
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentInIndia;
