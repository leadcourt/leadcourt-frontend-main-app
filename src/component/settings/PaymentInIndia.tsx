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
  customCredits?: number;
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
  const checkoutCountryCode = String(paymentData?.countryCode || "US").toUpperCase();
  const checkoutZipcode = checkoutCountryCode === "IN" ? "560001" : "";

  const initialValues = {
    fullName: user?.name || "",
    email: user?.email || "",
    zipcode: checkoutZipcode,
    subscriptionType: paymentData?.subscriptionType,
    amount: paymentData?.amount || 0,
    customCredits: paymentData?.customCredits,
    countryCode: checkoutCountryCode,
  };

  const onSubmit = async (values: userData) => {
    const normalizedCountryCode = String(values.countryCode || paymentData?.countryCode || "US").toUpperCase();
    const payload = {
      amount: values.amount,
      subscriptionType: values.subscriptionType,
      customCredits: values.customCredits,
      zipcode: values.zipcode || (normalizedCountryCode === "IN" ? "560001" : ""),
      countryCode: normalizedCountryCode,
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
    setFieldValue,
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
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm bg-gray-50 text-gray-500"
                  placeholder="Plan Type"
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
                  htmlFor="amount"
                  className="text-xs text-gray-900"
                >
                  Amount <i className="text-red-400">*</i>
                </label>
                <input
                  name="amount"
                  value={values.amount}
                  onBlur={handleBlur}
                  type="text"
                  disabled
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm bg-gray-50 text-gray-500"
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
                  htmlFor="fullName"
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
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm bg-gray-50 text-gray-500"
                />

                {errors.fullName && touched.fullName && (
                  <p className="error text-sm text-red-400">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="">
                <label
                  htmlFor="email"
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
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm bg-gray-50 text-gray-500"
                  placeholder="Email"
                />

                {errors.email && touched.email && (
                  <p className="error text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Billing Country Dropdown */}
              <div className="">
                <label
                  htmlFor="countryCode"
                  className="text-xs text-gray-900"
                >
                  Billing Country <i className="text-red-400">*</i>
                </label>
                <select
                  name="countryCode"
                  value={values.countryCode}
                  onChange={(e) => {
                    const selectedCountry = e.target.value;
                    setFieldValue("countryCode", selectedCountry);
                    // Update Zipcode automatically based on country selection
                    if (selectedCountry === "IN") {
                      setFieldValue("zipcode", "560001");
                    } else {
                      setFieldValue("zipcode", "");
                    }
                  }}
                  onBlur={handleBlur}
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#f34f14]"
                >
                  <option value="US">🇺🇸 United States (US)</option>
                  <option value="IN">🇮🇳 India (IN)</option>
                  <option value="CN">🇨🇳 China (CN)</option>
                  <option value="GB">🇬🇧 United Kingdom (GB)</option>
                  <option value="CA">🇨🇦 Canada (CA)</option>
                  <option value="AU">🇦🇺 Australia (AU)</option>
                  <option value="DE">🇩🇪 Germany (DE)</option>
                  <option value="FR">🇫🇷 France (FR)</option>
                  <option value="JP">🇯🇵 Japan (JP)</option>
                  <option value="AE">🇦🇪 United Arab Emirates (AE)</option>
                  <option value="SG">🇸🇬 Singapore (SG)</option>
                  <option value="ZA">🇿🇦 South Africa (ZA)</option>
                  <option value="BR">🇧🇷 Brazil (BR)</option>
                  <option value="MX">🇲🇽 Mexico (MX)</option>
                  <option value="NL">🇳🇱 Netherlands (NL)</option>
                  <option value="ES">🇪🇸 Spain (ES)</option>
                  <option value="IT">🇮🇹 Italy (IT)</option>
                  <option value="SA">🇸🇦 Saudi Arabia (SA)</option>
                </select>
                {errors.countryCode && touched.countryCode && (
                  <p className="error text-sm text-red-400">{errors.countryCode}</p>
                )}
              </div>

              {/* Zip / Postal Code Input */}
              <div className="col-span-2">
                <label
                  htmlFor="zipcode"
                  className="text-xs text-gray-900"
                >
                  Zip / Postal Code <i className="text-red-400">*</i>
                </label>
                <input
                  name="zipcode"
                  value={values.zipcode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="text"
                  placeholder={values.countryCode === "IN" ? "e.g. 560001" : "e.g. 90210"}
                  className="border border-gray-400 w-full rounded-lg p-2 text-sm bg-white text-gray-800"
                />
                {errors.zipcode && touched.zipcode && (
                  <p className="error text-sm text-red-400">{errors.zipcode}</p>
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
