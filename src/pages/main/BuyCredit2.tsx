import { useState, useEffect } from "react";
import PayPalButton from "../../component/PayPalButton";
import { Dialog } from "primereact/dialog";
import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import SupportPage from "../../component/settings/SupportPage";
import { getLocation } from "../../utils/api/location";
import PaymentInIndia from "../../component/settings/PaymentInIndia";

interface PaymentPlanType {
  userId: string | undefined;
  plan: string;
  amount: number;
  credit: number;
}

interface PaymentInIndiaData {
  location : string;
  display : boolean;
  amount: number,
  subscriptionType: string,
}

const LeadCourtCredits2 = () => {
  const user = useRecoilValue(userState)
  const [creditAmount, setCreditAmount] = useState<number>(10000);
  const [totalPrice, setTotalPrice] = useState<number>(100);
  const [visible, setVisible] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanType>();
  const [options, setOptions] = useState<string>();
  const [location, setLocation] = useState<string>('')

  // NEW: State to hold the live rate and symbol
  const [countryCurrency, setCountryCurrency] = useState({
    rate: 1,
    currency: "usd",
    symbol: "$",
  });

  const [indiaPayment, setIndiaPayment] = useState<PaymentInIndiaData>({
    location : '',
    display : false,
    amount: 0,
    subscriptionType: '',
  })

  // Calculate price based on credits (at $10 per 1000 credits) multiplied by live rate
  const calculatePrice = (credits: number): number => {
    return Math.round((credits / 1000) * (10 * countryCurrency.rate));
  };

  // Helper to convert the static $20, $60, $100 amounts based on live rate
  const convertStaticPrice = (usdAmount: number): number => {
    return Math.round(usdAmount * countryCurrency.rate);
  }

  // Update price when credit amount changes
  const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const creditValue = parseInt(e.target.value);
    setCreditAmount(creditValue);
  };

  const handlePaymentPlan = async (planType: PaymentPlanType) => {
    // Check for "IN" to trigger India-specific payment component
    if (location.toUpperCase() === 'IN') {
      const setIndiaPay ={
        location : 'IN',
        display: true,
        amount: planType.amount,
        subscriptionType: planType.plan,
      }
      setIndiaPayment(setIndiaPay)
    } else {
      console.log('payload in not india',location );
      setVisible(true);
      setPaymentPlan(planType);
    }
  };

  const displayDialog = (info: string) => {
    setOptions(info);
  };

  const getUserLocation = async () => {
    try {
      const res = await getLocation();
      const countryCode = res?.data?.country;
      setLocation(countryCode);

      // If India, fetch the latest exchange rate
      if (countryCode === "IN") {
        const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
        const rateData = await rateRes.json();
        const liveRate = rateData.rates.INR || 83.5; // fallback to 83.5 if API fails
        
        setCountryCurrency({
          rate: liveRate,
          currency: "inr",
          symbol: "₹",
        });
        console.log('💹 Live INR Rate fetched:', liveRate);
      }
    } catch (error) {
      console.error('❌ Failed to fetch location or rates', error);
    }
  }

  // Update price whenever credit amount OR currency rate changes
  useEffect(() => {
    setTotalPrice(calculatePrice(creditAmount));
  }, [creditAmount, countryCurrency.rate]);

  useEffect(()=>{
    getUserLocation()
  }, [])

  return (
    <div className="min-h-screen w-full p-5 ">

        <Dialog
          header="Support"
          visible={options === "Support"}
          style={{ width: "400px", padding:'1.5rem', backgroundColor: 'white' }}
          onHide={() => {
            if (options !== "Support") return;
            setOptions('');
          }}
        > 
          <SupportPage faq={false} />
        </Dialog>

        <Dialog
          header="Payment"
          visible={indiaPayment.display && indiaPayment.location === 'IN'}
          style={{ width: "400px", padding:'1.5rem', backgroundColor: 'white' }}
          onHide={() => {
            if (!indiaPayment.display && indiaPayment.location === 'IN') return;
            setIndiaPayment({location: '', display: false, 
        amount: 0,
        subscriptionType: '',});
          }}
        > 
          <PaymentInIndia paymentData={indiaPayment}/>
        </Dialog>
      <div className=" my-5">
        {/* Main Content */}
        <div className="">
          {/* Page Header */}

          <div className="mb-10">
            <div className="mb-5">
              <h3 className="text-xl font-bold">Choose a plan</h3>
              <p className="text-sm text-gray-400">
                Choose the perfect plan for your business needs.
              </p>
            </div>

            <div className="sub_bg_gradient flex justify-between items-center  text-white p-5 rounded-2xl  ">
              <div className="">

              <h3 className="text-xl text-gray-100 font-bold">
                Need more leads for your business?
              </h3>
              <p className="text-sm ">
                Our enterprise plans offer custom solutions tailored to your
                specific requirements..
              </p>
              </div>
              <button
              onClick={() => displayDialog("Support")}
              className="cursor-pointer hover:px-4 hover:py-2 px-3 py-1 rounded-xl bg-white font-bold text-[#F35114]">Contact Us</button>
            </div>
          </div>

          {/* Subscription Plans Section */}
          <section className="mb-10">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200  hover:border-orange-200 p-1 flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="bg-gradient-to-b from-[#f34f146c] to-amber-50 rounded-xl p-5 mb-5">
                  <h3 className="text-xl font-bold mb-2">Starter</h3>
                  <p className="text-gray-600 mb-4">
                    Perfect for small businesses
                  </p>
                </div>
                <div className="text-2xl font-bold text-orange-500 px-5 mb-4">
                  {countryCurrency.symbol}{convertStaticPrice(20).toLocaleString()}<span className="text-lg text-gray-500">/mo</span>
                </div>
                <ul className="mb-6 px-5 flex-grow">

                <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>All Free Features</span>
                  </li>
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>3,000 credits</span>
                  </li>
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>Advanced filters</span>
                  </li>
                </ul>
                <button
                  onClick={() =>
                    handlePaymentPlan({
                      userId: user?.id,
                      plan: "starter".toUpperCase(),
                      amount: convertStaticPrice(20),
                      credit: 3000,
                    })
                  }
                  className="bg-orange-500 cursor-pointer text-white font-medium py-3 px-6 rounded-xl hover:bg-orange-400 transition-all w-full"
                >
                  Buy Now
                </button>
              </div>

              {/* Pro Plan (Most Popular) */}
              <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all relative">
                <div className="absolute -top-0 right-8 bg-orange-500 text-white text-xs font-semibold py-1 px-4 rounded-b-lg">
                  Most Popular
                </div>
                <div className="bg-gradient-to-b from-[#f34f146c] to-amber-50 rounded-xl p-5 mb-5">
                  <h3 className="text-xl font-bold mb-2">Pro</h3>
                  <p className="text-gray-600 mb-4">Ideal for growing teams</p>
                </div>
                <div className="text-2xl font-bold text-orange-500 px-5">
                  {countryCurrency.symbol}{convertStaticPrice(60).toLocaleString()}<span className="text-lg text-gray-500">/mo</span>
                </div>
                <ul className="p-5 mb-6 flex-grow">
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>All Starter features</span>
                  </li>
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>10,000 credits</span>
                  </li>
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>CRM integration</span>
                  </li>
                </ul>
                <button
                  onClick={() =>
                    handlePaymentPlan({
                      userId: user?.id,
                      plan: "pro".toUpperCase(),
                      amount: convertStaticPrice(60),
                      credit: 10000,
                    })
                  }
                  className="bg-orange-500 cursor-pointer text-white font-medium py-3 px-6 rounded-md hover:bg-orange-400 transition-all w-full"
                >
                  Buy Now
                </button>
              </div>

              {/* Business Plan */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 p-1 flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="bg-gradient-to-b from-[#f34f146c] to-amber-50 rounded-xl p-5 mb-5">
                  <h3 className="text-xl font-bold mb-2">Business</h3>
                  <p className="text-gray-600 mb-4">
                    For established businesses
                  </p>
                </div>
                <div className="text-2xl font-bold text-orange-500 px-5 mb-4">
                  {countryCurrency.symbol}{convertStaticPrice(100).toLocaleString()}<span className="text-lg text-gray-500">/mo</span>
                </div>
                <ul className="px-5 mb-6 flex-grow">
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>All Pro features</span>
                  </li>
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>15,000 credits</span>
                  </li>
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-center mb-3">
                    <svg
                      className="w-5 h-5 text-orange-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>API access</span>
                  </li>
                </ul>
                <button
                  onClick={() =>
                    handlePaymentPlan({
                      userId: user?.id,
                      plan: "business".toUpperCase(),
                      amount: convertStaticPrice(100),
                      credit: 15000,
                    })
                  }
                  className="bg-orange-500 cursor-pointer text-white font-medium py-3 px-6 rounded-md hover:bg-orange-400 transition-all w-full"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </section>

          <div className=" ">
            <Dialog
              header="Payment Options"
              visible={visible}
              className="p-2 bg-white w-full max-w-[400px] lg:w-1/2"
              onHide={() => {
                if (!visible) return;
                setVisible(false);
              }}
              draggable={false}
              resizable={false}
            >
              <div className=" py-5">
                <PayPalButton paymentInfo={paymentPlan} />
              </div>
            </Dialog>
          </div>

          {/* Custom Credit Purchase Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-center mb-6">
              Custom Credit Purchase
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Need a specific amount of credits? Use the slider to select
                  exactly how many credits you want.
                </p>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">1,000 credits</span>
                  <span className="font-medium">50,000 credits</span>
                </div>
                <div className="w-full mb-6">
                  <input
                    type="range"
                    min={1000}
                    max={50000}
                    value={creditAmount}
                    step={1000}
                    onChange={handleCreditChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block text-lg font-medium">Selected:</span>
                    <span className="text-3xl font-bold text-orange-500">
                      {creditAmount.toLocaleString()}
                    </span>
                    <span className="text-lg font-medium"> credits</span>
                  </div>
                  <div>
                    <span className="block text-lg font-medium">
                      Total Price:
                    </span>
                    <span className="text-3xl font-bold text-orange-500">
                      {countryCurrency.symbol}{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <button 
              onClick={() =>
                handlePaymentPlan({
                  userId: user?.id,
                  plan: "custom".toUpperCase(),
                  amount: calculatePrice(creditAmount),
                  credit: creditAmount,
                })
              }
              className="bg-orange-500 text-white font-medium py-3 px-6 rounded-md hover:bg-orange-400 transition-all w-full text-lg">
                Buy Now
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LeadCourtCredits2;