import { useState, useEffect } from "react";
import PayPalButton from "../../component/PayPalButton";
import { Dialog } from "primereact/dialog";
import { useRecoilValue } from "recoil";
import { userState } from "../../utils/atom/authAtom";
import SupportPage from "../../component/settings/SupportPage";
import PaymentInIndia from "../../component/settings/PaymentInIndia";
import { getLocation } from "../../utils/api/location";
import { useSearchParams } from "react-router-dom";
import paymentFailed from "../../assets/icons/payment_failed.jpeg";
import SwitchInputButton from "../../component/SwitchInputButton";
import planData from "../../utils/buyCredit.json"



interface PaymentPlanType {
  userId: string | undefined;
  plan: string;
  amount: number;
  credit: number;
}

interface PaymentInIndiaData {
  location: string;
  display: boolean;
  amount: number;
  subscriptionType: string;
}
 

const BuyCredit = () => {
  const user = useRecoilValue(userState);
  const [location, setLocation] = useState<string>("");
  const [annualSub, setAnnualSub] = useState<boolean>(false);

  const [creditAmount, setCreditAmount] = useState<number>(10000);
  // const [totalPrice, setTotalPrice] = useState<number>();
  const [visible, setVisible] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanType>();
  const [options, setOptions] = useState<string>();
  const [paymentStatus, setPaymentStatus] = useState<boolean>(false);

  const [indiaPayment, setIndiaPayment] = useState<PaymentInIndiaData>({
    location: "",
    display: false,
    amount: 0,
    subscriptionType: "",
  });

  // const sub_price = [
  //   {
  //     starter: 1720,
  //     pro: 5161,
  //     business: 8602,
  //     custom: 0,
  //     currency: "₹",
  //   },
  //   {
  //     starter: 20,
  //     pro: 60,
  //     business: 100,
  //     custom: 0,
  //     currency: "$",
  //   },
  // ];
  // const [paymentAmount, setPaymentAmount] = useState<CountryAmount>(
  //   sub_price[1]
  // );
  // Calculate price based on credits (at $10 per 1000 credits)
const [countryCurrency, setCountryCurrency] = useState({
      rate: 1,
      currency:"usd",
      symbol: "$",
    })


  const currencyConverter = [
    {
      rate: 87.65,
      currency:"inr",
      symbol: "₹",
    },
    {
      rate: 1,
      currency:"usd",
      symbol: "$",
    }
  ]
  const [urlSearchParams] = useSearchParams();

  const checkUrlSearchParams = () => {
    const status = urlSearchParams?.get("status");
    console.log(urlSearchParams?.get("method"));
    if (status === "failed") {
      setPaymentStatus(true);
    }
  };

  

  const calculatePrice = (credits: number): number => {
    if (location === "IN") {
      return Math.round((credits / 1000) * (currencyConverter[0].rate*10));
    } else {
      return Math.round((credits / 1000) * (currencyConverter[1].rate*10));
    }
  };

  // Update price when credit amount changes
  // const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const creditValue = parseInt(e.target.value);
  //   setCredcitAmount(creditValue);
  // };

  const handlePaymentPlan = async (planType: PaymentPlanType) => {
    // if (true) {
    if (location?.toUpperCase() === "IN") {
      const setIndiaPayload: PaymentInIndiaData = {
        location: "IN",
        display: true,
        amount: planType.amount,
        subscriptionType: planType.plan,
      };
      setIndiaPayment(setIndiaPayload);
    } else {
      // For non-India payments, set the payment plan and show the dialog
      // console.log("payload in not india", location);

      setVisible(true);
      setPaymentPlan(planType);
    }
  };

  const displayDialog = (info: string) => {
    setOptions(info);
  };

  const checkLocation = async () => {
    await getLocation().then((res) => {
      setLocation(res?.data?.country);

      if (res?.data?.country === "IN") {
        setCountryCurrency(currencyConverter[0])
      } else {
        setCountryCurrency(currencyConverter[1])
      }
    });
  };

  useEffect(() => {
    checkLocation();
    checkUrlSearchParams();
    // setTotalPrice(calculatePrice(10000))
  }, []);

  // Update price whenever credit amount changes
  // useEffect(() => {
  //   // setTotalPrice(calculatePrice(creditAmount));
  // }, [creditAmount, location]);

  return (
    <div className="min-h-screen w-full p-5 ">
      <Dialog
        header="Payment Failed"
        visible={paymentStatus}
        style={{ width: "400px", padding: "1.5rem", backgroundColor: "white" }}
        onHide={() => {
          if (paymentStatus) return;
          setPaymentStatus(!paymentStatus);
        }}
      >
        <div className="">
          <div className=" w-fit m-auto">
            <img src={paymentFailed} className="h-[100px]" alt="" />
          </div>
          <p className="max-w-[300px] text-center m-auto mt-5 text-sm text-gray-700">
            The transaction you are trying to initiate has failed.
          </p>
        </div>
      </Dialog>

      <Dialog
        header="Support"
        visible={options === "Support"}
        style={{ width: "400px", padding: "1.5rem", backgroundColor: "white" }}
        onHide={() => {
          if (options !== "Support") return;
          setOptions("");
        }}
      >
        <SupportPage faq={false} />
      </Dialog>

      <Dialog
        header="Payment"
        visible={indiaPayment.display && indiaPayment.location === "IN"}
        style={{ width: "400px", padding: "1.5rem", backgroundColor: "white" }}
        onHide={() => {
          if (!indiaPayment.display && indiaPayment.location === "IN") return;
          setIndiaPayment({
            location: "",
            display: false,
            amount: 0,
            subscriptionType: "",
          });
        }}
      >
        <PaymentInIndia paymentData={indiaPayment} />
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
                className="cursor-pointer hover:px-4 hover:py-2 px-3 py-1 rounded-xl bg-white font-bold text-[#F35114]"
              >
                Contact Us
              </button>
            </div>
          </div>

          {/* Subscription Plans Section */}
          <section className="mb-10 ">
            <div className="py-5 w-fit m-auto">
              <div className="flex items-center">
                <p className={`${annualSub ? 'text-gray-400':''}`}>Monthly</p>
                <SwitchInputButton 
                text=""
                 disabled={false}
                 action={annualSub}
                 setAction={setAnnualSub}
                  />
                <p className={`${annualSub ? '':'text-gray-400'}`}>Annual <span className="text-sm text-orange-500">(Save 20%)</span></p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* All Plan Map */}
              {planData.map((planItem, index)=>(
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200  hover:border-orange-200 p-1 flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="bg-gradient-to-b from-[#f34f146c] to-amber-50 rounded-xl p-5 mb-5">
                  <h3 className="text-xl font-bold mb-2">{planItem.name}</h3>
                  <p className="text-gray-600 mb-4">
                    {planItem.description }
                  </p>
                </div>
                <div className="text-2xl font-bold text-orange-500 px-5 mb-4">
                  {/*                   $20 */}
                  {countryCurrency.symbol} {" "}
                  {annualSub ? 
                  Math.round(((parseInt(planItem.dollar_amount) * countryCurrency.rate)*12)*0.8)
                  :
                  (parseInt(planItem.dollar_amount) * countryCurrency.rate)
                  }
                  {/* {paymentAmount.currency} {paymentAmount.starter} */}
                  <span className="text-lg text-gray-500">{annualSub?"/yr":"/mo"}</span>
                </div>
                <ul className="mb-6 px-5 flex-grow">
                  {planItem.features.map((feature, featIndex)=>(
                    feature === 'credits'? 
                                      <li key={featIndex} className="flex items-center mb-3">
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
                    {
                      annualSub ? 
                      <span> {(planItem.credits*12).toLocaleString()} {feature}</span>
                      :
                    <span> {planItem.credits.toLocaleString()} {feature}</span>
                    }
                  </li>
                  :
                  <li key={featIndex} className="flex items-center mb-3">
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
                    <span>{feature}</span>
                  </li>
                  ))}
                </ul>
                <button
                  onClick={() =>{
                    annualSub ? 
                    
                    handlePaymentPlan({
                      userId: user?.id,
                      plan: planItem.name+'_annual'.toUpperCase(),
                      credit: planItem.credits,
                      amount: Math.round(((parseInt(planItem.dollar_amount) * countryCurrency.rate)*12)*0.8),
                    })
                    :
                    handlePaymentPlan({
                      userId: user?.id,
                      plan: planItem.name.toUpperCase(),
                      // {.currency} {paymentAmount.starter}
                      amount: parseInt(planItem.dollar_amount) * countryCurrency.rate,
                      credit: planItem.credits,
                    })
                  }
                  }
                  className="bg-orange-500 cursor-pointer text-white font-medium py-3 px-6 rounded-xl hover:bg-orange-400 transition-all w-full"
                >
                  Buy Now
                </button>
              </div>
              ))}
 
            </div>
          </section>

          <div className=" ">
            <Dialog
              header="Payment Options"
              visible={visible}
              className="p-2 bg-white w-full max-w-[400px] lg:w-1/2"
              // style={{ maxWidth: "400px" }}
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
                    onChange={(e)=>setCreditAmount(parseInt(e.target.value))}


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
                      {countryCurrency.symbol}
                      {/* {' '}{countryCurrency.rate*(creditAmount/100)} {' '} */}
                      {/* {calculatePrice(creditAmount).toLocaleString()} */}
                      {(calculatePrice(creditAmount)).toLocaleString()}
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
                className="bg-orange-500 text-white font-medium py-3 px-6 rounded-md hover:bg-orange-400 transition-all w-full text-lg"
              >
                Buy Now
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BuyCredit;

// export default function BuyCredit() {
//   return (
//     <div className="p-5">

//       <div className="mb-5">
//         <h3 className="text-xl font-bold">Choose a plan</h3>
//         <p className="text-sm text-gray-400">Choose the perfect plan for your business needs.</p>
//       </div>

//     </div>
//   )
// }
