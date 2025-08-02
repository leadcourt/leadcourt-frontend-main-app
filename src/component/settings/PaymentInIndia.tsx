import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import { useFormik } from "formik";
import { paymentInIndiaValidation } from "../../utils/validation/validation";
import { makeSabpaisaPayment } from "../../utils/api/payment";
import { toast } from "react-toastify";

interface userData {
  fullName: string;
  email: string;
  mobile: string;
  subscriptionType: string;
  amount: string;
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
    mobile: "",
    subscriptionType: paymentData?.subscriptionType,
    amount: paymentData?.amount || 0,
  };

  const onSubmit = async (values: userData) => {
    const payload = {
      amount: values.amount,
      mobile: values.mobile,
      subscriptionType: values.subscriptionType,
    };
    await makeSabpaisaPayment(payload).then((res) => {
      if (res?.data?.success) {
        const URL = res.data.formData.spURL;
        const sabpaisaPayload = {
          encData: res.data.formData.encData,
          clientCode: res.data.formData.clientCode,
        };

        const form = document.createElement("form");
        form.method = "POST";
        form.action = URL;

        const encInput = document.createElement("input");
        encInput.type = "hidden";
        encInput.name = "encData";
        encInput.value = sabpaisaPayload.encData;

        const codeInput = document.createElement("input");
        codeInput.type = "hidden";
        codeInput.name = "clientCode";
        codeInput.value = sabpaisaPayload.clientCode;

        form.appendChild(encInput);
        form.appendChild(codeInput);
        document.body.appendChild(form);
        form.submit();

        //  postSabpaisaEncData(URL, sabpaisaPayload).then((sabRes) => {
        //   console.log(sabRes.data);

        // })
      } else {
        toast.error("Payment failed, please try again!");
        console.error("Payment failed", res.data);
      }
    });
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
                  Subscription Type <i className="text-red-400">*</i>
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

              <div className="">
                <label
                  htmlFor="subscriptionType"
                  className="text-xs text-gray-900"
                >
                  Phone Number <i className="text-red-400">*</i>
                </label>

                <input
                  name="mobile"
                  value={values.mobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="text"
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm "
                  placeholder="Phone Number"
                />

                {errors.mobile && touched.mobile && (
                  <p className="error text-sm text-red-400">{errors.mobile}</p>
                )}
              </div>
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
