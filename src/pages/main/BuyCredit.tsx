import { useState, useEffect } from "react";
import "./BuyCredit.css";
import PayPalButton from "../../component/PayPalButton";
import { Dialog } from "primereact/dialog";
import {
  useRecoilValue,
  useSetRecoilState,
  useResetRecoilState,
  useRecoilState,
} from "recoil";
import {
  creditState,
  userState,
  accessTokenState,
  refreshTokenState,
} from "../../utils/atom/authAtom";
import {
  collabCreditState,
  collabProjectState,
} from "../../utils/atom/collabAuthAtom";
import SupportPage from "../../component/settings/SupportPage";
import PaymentInIndia from "../../component/settings/PaymentInIndia";
import { getLocation } from "../../utils/api/location";
import { useSearchParams, useNavigate } from "react-router-dom";
import paymentFailed from "../../assets/icons/payment_failed.jpeg";
import planData from "../../utils/buyCredit.json";
import { toast } from "react-toastify";
import { redeemCoupon } from "../../utils/api/LTDCoupons";
import { getCreditBalance } from "../../utils/api/creditApi";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";

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

type CouponSuccess = {
  plan: string;
  isLTD: boolean;
  credits: number;
  addedCredits: number;
  code: string;
};

const BuyCredit = () => {
  const user = useRecoilValue(userState);
  const credit = useRecoilValue(creditState);
  const setCreditInfo = useSetRecoilState(creditState);

  const resetAccessToken = useResetRecoilState(accessTokenState);
  const resetRefreshToken = useResetRecoilState(refreshTokenState);
  const resetUser = useResetRecoilState(userState);
  const resetCredit = useResetRecoilState(creditState);
  const resetCollabcreditInfo = useResetRecoilState(collabCreditState);
  const resetCollabState = useResetRecoilState(collabProjectState);

  const navigate = useNavigate();

  const [location, setLocation] = useState<string>("");
  const [annualSub, setAnnualSub] = useState<boolean>(false);
  const [creditAmount, setCreditAmount] = useState<number>(10000);
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

  const [countryCurrency, setCountryCurrency] = useState({
    rate: 1,
    currency: "usd",
    symbol: "$",
  });

  const currencyConverter = [
    { rate: 87.65, currency: "inr", symbol: "₹" },
    { rate: 1, currency: "usd", symbol: "$" },
  ];

  const [urlSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);

  const checkUrlSearchParams = () => {
    const status = urlSearchParams?.get("status");
    if (status === "failed") setPaymentStatus(true);
  };

  const calculatePrice = (credits: number): number => {
    if (location === "IN") {
      return Math.round((credits / 1000) * (currencyConverter[0].rate * 10));
    } else {
      return Math.round((credits / 1000) * (currencyConverter[1].rate * 10));
    }
  };

  const handlePaymentPlan = async (planType: PaymentPlanType) => {
    if (location?.toUpperCase() === "IN") {
      setIndiaPayment({
        location: "IN",
        display: true,
        amount: planType.amount,
        subscriptionType: planType.plan,
      });
    } else {
      setVisible(true);
      setPaymentPlan(planType);
    }
  };

  const displayDialog = (info: string) => setOptions(info);

  const checkLocation = async () => {
    try {
      // Using a reliable, free IP location service
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      
      console.log("📍 Location Detected:", data.country_name);

      // ipapi.co returns "IN" for country and "India" for country_name
      const isIndia = data.country === "IN" || data.country_name?.toUpperCase() === "INDIA";
      
      setLocation(data.country);
      setCountryCurrency(isIndia ? currencyConverter[0] : currencyConverter[1]);
    } catch (error) {
      console.error("❌ Location API failed. Defaulting to USD.", error);
      setCountryCurrency(currencyConverter[1]); // Failsafe fallback
    }
  };

  useEffect(() => {
    checkLocation();
    checkUrlSearchParams();

    const intervalId = setInterval(() => {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.animationDelay = Math.random() * 4 + "s";
      const container = document.getElementById("particle-container");
      if (container) {
        container.appendChild(particle);
        setTimeout(() => {
          particle.remove();
        }, 4000);
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  const [redeemOpen, setRedeemOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponSuccess | null>(null);

  const onRedeem = async () => {
    const trimmed = (couponCode || "").trim();
    if (!trimmed) {
      toast.error("Please enter a coupon code.");
      return;
    }
    setRedeeming(true);
    try {
      const res = await redeemCoupon(trimmed);
      const data: CouponSuccess = res?.data?.data;
      if (!res?.data?.success || !data) {
        throw new Error(res?.data?.error || "Failed to redeem.");
      }
      setCouponResult(data);

      const total = await getCreditBalance();
      setCreditInfo({
        id: user?.id ?? "",
        credits: total?.data?.credits || 0,
        subscriptionType: total?.data?.subscriptionType || "FREE",
      });

      toast.success("Coupon applied successfully!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to redeem coupon.";
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  };

  const closeRedeem = () => {
    setRedeemOpen(false);
    setCouponCode("");
    setCouponResult(null);
  };

  const triggerSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="leadcourt-theme-wrapper min-h-screen relative overflow-x-hidden font-sans text-gray-700 bg-white">
      
      {/* DIALOGS */}
      <Dialog
        header="Payment Failed"
        visible={paymentStatus}
        style={{ width: "400px", padding: "1.5rem", backgroundColor: "white" }}
        onHide={() => {
          if (paymentStatus) return;
          setPaymentStatus(!paymentStatus);
        }}
      >
        <div>
          <div className="w-fit m-auto">
            <img src={paymentFailed} className="h-[100px]" alt="" />
          </div>
          <p className="max-w-[300px] text-center m-auto mt-5 text-sm text-gray-500">
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

      <Dialog
        header={couponResult ? "Success" : "Redeem Coupon"}
        visible={redeemOpen}
        style={{ width: "420px", padding: "1.5rem", backgroundColor: "white" }}
        onHide={closeRedeem}
      >
        {!couponResult ? (
          <div className="space-y-4 pt-2">
            <label className="text-sm font-medium text-gray-600">Enter Coupon Code</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. LC-QGBN-B3SW-GNVX"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f34f14] text-gray-800"
            />
            <button
              onClick={onRedeem}
              disabled={redeeming}
              className="bg-[#f34f14] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#de450f] transition-all w-full"
            >
              {redeeming ? "Redeeming..." : "Apply Coupon"}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center py-2">
            <i className="pi pi-check-circle text-green-500 text-5xl mb-2 block"></i>
            <p className="text-gray-800 text-lg font-bold">
              Coupon applied successfully!
            </p>
            <div className="text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-xl text-left border border-gray-100">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Plan:</span> 
                <span>{couponResult.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Expiry:</span>{" "}
                <span>{couponResult.isLTD ? "Lifetime" : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Credits Added:</span>{" "}
                <span className="text-green-600 font-bold">+{couponResult.addedCredits?.toLocaleString?.() ?? couponResult.addedCredits}</span>
              </div>
              <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-700">Updated Balance:</span>{" "}
                <span className="font-bold text-[#f34f14]">{couponResult.credits?.toLocaleString?.() ?? couponResult.credits}</span>
              </div>
            </div>
            <button
              onClick={closeRedeem}
              className="bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-all w-full mt-2"
            >
              Close
            </button>
          </div>
        )}
      </Dialog>

      <Dialog
        header="Payment Options"
        visible={visible}
        className="p-2 bg-white w-full max-w-[400px] lg:w-1/2 rounded-xl"
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
        draggable={false}
        resizable={false}
      >
        <div className="py-5">
          <PayPalButton paymentInfo={paymentPlan} />
        </div>
      </Dialog>

      {/* BACKGROUND */}
      <div className="animated-bg">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div id="particle-container"></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="lc-container">
        
        {/* HEADER SECTION (Aligns with Image 1) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
           
           <div>
              <div className="flex items-center gap-3 mb-2">
                {!sidebarOpen && (
                  <button onClick={triggerSidebarToggle} className="lg:hidden text-gray-500 hover:text-orange-500 transition-colors">
                    <i className="pi pi-bars text-xl"></i>
                  </button>
                )}
                <h1 className="text-3xl font-extrabold text-gray-900">Choose a plan</h1>
              </div>
              <p className="text-gray-500 text-sm mb-6">Choose the perfect plan for your lead generation needs.</p>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-white border border-gray-200 rounded-full p-1 flex shadow-sm w-fit">
                  <button
                    className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${!annualSub ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                    onClick={() => setAnnualSub(false)}
                  >
                    Monthly
                  </button>
                  <button
                    className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${annualSub ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                    onClick={() => setAnnualSub(true)}
                  >
                    Annual
                  </button>
                </div>
                <div className="bg-orange-50 text-[#f34f14] px-4 py-2 rounded-lg text-xs font-bold border border-orange-100 uppercase tracking-wide">
                  Save 20%
                </div>
              </div>
           </div>

           <div className="flex items-center gap-4 w-full lg:w-auto">
             <div className="border border-red-200 bg-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-gray-700 shadow-sm w-full lg:w-auto justify-center">
               <i className="pi pi-desktop text-[#f34f14]"></i> 
               Balance: <span className="text-[#f34f14]">{credit?.credits?.toLocaleString()} credits</span>
             </div>
             <button onClick={() => setRedeemOpen(true)} className="bg-[#f34f14] hover:bg-[#de450f] text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-orange-500/20 whitespace-nowrap">
               Redeem
             </button>
           </div>
        </div>

        {/* PRICING GRID (4 Columns) */}
        <div className="pricing-grid">
          {planData.map((planItem, index) => {
            // Highlighting Pro plan
            const isFeatured = planItem.name === "Pro";
            const currentPrice = annualSub
              ? Math.round(parseInt(planItem.dollar_amount) * countryCurrency.rate * 12 * 0.8)
              : parseInt(planItem.dollar_amount) * countryCurrency.rate;

            return (
              <div key={index} className={`pricing-card ${isFeatured ? "featured" : ""}`}>
                {isFeatured && (
                  <div className="popular-badge">Recommended</div>
                )}

                <div className="plan-icon">
                  {index === 0 ? <i className="pi pi-star-fill"></i> : index === 1 ? <i className="pi pi-bolt"></i> : <i className="pi pi-building"></i>}
                </div>
                <div className="plan-name">{planItem.name}</div>
                <div className="plan-description">{planItem.description}</div>

                <div className="price-section">
                  <div className="price">
                    <span className="currency">{countryCurrency.symbol}</span>
                    <span className="amount">{currentPrice.toLocaleString()}</span>
                    <span className="period">{annualSub ? "/yr" : "/mo"}</span>
                  </div>
                </div>

                <ul className="features-list">
                  {planItem.features.map((feature: string, featIndex: number) => {
                    if (feature === "credits") {
                      const creditVal = annualSub ? planItem.credits * 12 : planItem.credits;
                      return (
                        <li key={featIndex}>{creditVal.toLocaleString()} credits</li>
                      );
                    }
                    return <li key={featIndex}>{feature}</li>;
                  })}
                </ul>

                <button
                  className={`cta-button ${isFeatured ? "" : "secondary"}`}
                  onClick={() => {
                    annualSub
                      ? handlePaymentPlan({
                          userId: user?.id,
                          plan: (planItem.name + "_annual").toUpperCase(),
                          credit: planItem.credits,
                          amount: currentPrice,
                        })
                      : handlePaymentPlan({
                          userId: user?.id,
                          plan: planItem.name.toUpperCase(),
                          amount: currentPrice,
                          credit: planItem.credits,
                        });
                  }}
                >
                  Get Started
                </button>
              </div>
            );
          })}

          {/* ENTERPRISE CARD (4th Column) */}
          <div className="pricing-card border border-red-200">
             <div className="bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1 rounded w-fit mb-4 uppercase tracking-widest">Enterprise</div>
             <h3 className="text-xl font-extrabold text-gray-900 mb-2 leading-tight">Need more leads for your business?</h3>
             <p className="text-xs text-gray-500 mb-6 flex-grow">Our enterprise plans offer custom solutions tailored to your specific requirements.</p>
             
             <ul className="features-list mb-6">
               <li className="text-sm text-gray-600 flex items-center gap-3"><i className="pi pi-check text-[#f34f14] text-xs"></i> Unlimited credits</li>
               <li className="text-sm text-gray-600 flex items-center gap-3"><i className="pi pi-check text-[#f34f14] text-xs"></i> Custom integrations</li>
               <li className="text-sm text-gray-600 flex items-center gap-3"><i className="pi pi-check text-[#f34f14] text-xs"></i> SLA guarantee</li>
               <li className="text-sm text-gray-600 flex items-center gap-3"><i className="pi pi-check text-[#f34f14] text-xs"></i> Dedicated manager</li>
               <li className="text-sm text-gray-600 flex items-center gap-3"><i className="pi pi-check text-[#f34f14] text-xs"></i> Priority onboarding</li>
             </ul>
             
             <button onClick={() => displayDialog("Support")} className="w-full py-3.5 border-2 border-[#f34f14] text-[#f34f14] rounded-xl font-bold hover:bg-orange-50 transition-colors mt-auto">
               Contact Us
             </button>
          </div>
        </div>

        {/* CUSTOM CREDIT SECTION (Image 2 Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Panel: Slider */}
           <div className="lg:col-span-2 border border-red-200 rounded-2xl bg-white p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
             <div className="mb-10">
               <h3 className="text-xl font-extrabold text-gray-900 mb-2">Custom Credit Purchase</h3>
               <p className="text-sm text-gray-500">Need a specific amount of credits? Use the slider to select exactly how many credits you want.</p>
             </div>

             <div className="w-full relative z-10 mb-8">
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-4">
                  <span>1,000 credits</span>
                  <span>50,000 credits</span>
                </div>
                
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #f34f14 ${(creditAmount - 1000) / 49000 * 100}%, #e5e7eb ${(creditAmount - 1000) / 49000 * 100}%)`
                  }}
                />
             </div>

             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Selected Credits</div>
                  <div className="text-3xl font-extrabold text-[#f34f14]">{creditAmount.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Price</div>
                  <div className="text-3xl font-extrabold text-gray-900">{countryCurrency.symbol}{calculatePrice(creditAmount).toLocaleString()}</div>
                </div>
             </div>

             <button
               className="w-full bg-[#f34f14] hover:bg-[#de450f] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
               onClick={() =>
                 handlePaymentPlan({
                   userId: user?.id,
                   plan: "CUSTOM",
                   amount: calculatePrice(creditAmount),
                   credit: creditAmount,
                 })
               }
             >
               Purchase Custom Credits
             </button>
           </div>

           {/* Right Panel: Why Buy */}
           <div className="lg:col-span-1 border border-red-200 rounded-2xl bg-gray-50 flex flex-col overflow-hidden shadow-sm">
              <div className="p-6 flex-grow">
                 <h3 className="text-lg font-extrabold text-gray-900 mb-6">Why buy custom credits?</h3>
                 <ul className="space-y-5">
                    <li className="flex justify-between items-start">
                      <div className="flex gap-3 items-center text-gray-900 font-bold text-sm">
                        <i className="pi pi-check text-[#f34f14] text-xs"></i> Never expire
                      </div>
                      <span className="text-gray-500 text-xs text-right mt-0.5">Credits roll over forever</span>
                    </li>
                    <li className="flex justify-between items-start border-t border-gray-200 pt-4">
                      <div className="flex gap-3 items-center text-gray-900 font-bold text-sm">
                        <i className="pi pi-check text-[#f34f14] text-xs"></i> Flexible volume
                      </div>
                      <span className="text-gray-500 text-xs text-right mt-0.5">1,000 to 50,000 at once</span>
                    </li>
                    <li className="flex justify-between items-start border-t border-gray-200 pt-4">
                      <div className="flex gap-3 items-center text-gray-900 font-bold text-sm">
                        <i className="pi pi-check text-[#f34f14] text-xs"></i> Pay as you go
                      </div>
                      <span className="text-gray-500 text-xs text-right mt-0.5">No recurring commitment</span>
                    </li>
                    <li className="flex justify-between items-start border-t border-gray-200 pt-4">
                      <div className="flex gap-3 items-center text-gray-900 font-bold text-sm">
                        <i className="pi pi-check text-[#f34f14] text-xs"></i> Best rate at 10k+
                      </div>
                      <span className="text-gray-500 text-xs text-right mt-0.5">{countryCurrency.symbol}{(calculatePrice(10000) / 10000).toFixed(2)} per credit</span>
                    </li>
                 </ul>
              </div>
              <div className="bg-[#f34f14] p-5 text-white flex justify-between items-end">
                 <div>
                   <div className="text-[10px] uppercase tracking-wider opacity-80 mb-1 font-semibold">Current selection</div>
                   <div className="font-extrabold text-lg">{creditAmount.toLocaleString()} credits</div>
                 </div>
                 <div className="text-right">
                   <div className="text-[10px] uppercase tracking-wider opacity-80 mb-1 font-semibold">You pay</div>
                   <div className="font-extrabold text-2xl leading-none tracking-tight">{countryCurrency.symbol}{calculatePrice(creditAmount).toLocaleString()}</div>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default BuyCredit;s