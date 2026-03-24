import { useState, useEffect } from "react";
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
}

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

  const logout = () => {
    resetAccessToken();
    resetRefreshToken();
    resetUser();
    resetCredit();
    resetCollabState();
    resetCollabcreditInfo();
    toast.success("Log out successful");
    navigate("/");
  };

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
    await getLocation().then((res) => {
      setLocation(res?.data?.country);
      setCountryCurrency(
        res?.data?.country === "IN" ? currencyConverter[0] : currencyConverter[1]
      );
    });
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @import url("https://unpkg.com/primeicons/primeicons.css");

        .leadcourt-theme-wrapper {
          font-family: 'Inter', sans-serif;
        }

        .lc-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          position: relative;
          z-index: 50;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
        }

        .lc-nav-actions {
          align-items: center;
          gap: 20px;
        }

        .lc-credit-pill {
          background: #ffffff;
          border: 1px solid #fee2e2;
          padding: 10px 20px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: #4b5563;
          box-shadow: 0 4px 6px -1px rgba(243, 79, 20, 0.05);
        }
        
        .lc-credit-pill i { color: #f34f14; font-size: 1.1rem; }

        .lc-btn-icon {
          min-width: 45px;
          height: 45px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid #fee2e2;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #6b7280;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .lc-mobile-toggle {
          display: flex;
        }

        @media (min-width: 768px) {
          .lc-mobile-toggle {
            display: none !important;
          }
        }

        .lc-btn-icon i {
          font-size: 1rem;
          transition: transform 0.3s ease;
        }

        .lc-btn-icon:hover {
          background: #fef2f2;
          color: #f34f14;
          border-color: #f34f14;
        }

        .lc-btn-rotate:hover i {
          transform: rotate(90deg);
        }

        .animated-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.4;
          animation: float 25s infinite ease-in-out;
        }

        .orb1 {
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, #f34f1415 0%, transparent 70%);
          top: -200px;
          right: -100px;
          animation-delay: 0s;
        }

        .orb2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #fb923c15 0%, transparent 70%);
          bottom: -150px;
          left: -150px;
          animation-delay: 5s;
        }

        .orb3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #ef444410 0%, transparent 70%);
          top: 50%;
          left: 50%;
          animation-delay: 10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -50px) scale(1.05); }
          50% { transform: translate(-25px, 50px) scale(0.95); }
          75% { transform: translate(-50px, -25px) scale(1.02); }
        }

        .lc-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px;
          position: relative;
          z-index: 1;
        }

        .hero {
          text-align: center;
          margin-bottom: 60px;
          position: relative;
          margin-top: 20px;
        }

        .hero h1 {
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 800;
          color: #374151;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .hero p {
          font-size: 20px;
          color: #6b7280;
          font-weight: 400;
          max-width: 600px;
          margin: 0 auto;
        }

        .pricing-toggle {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin: 40px 0 60px 0;
          position: relative;
        }

        .toggle-group {
          background: #f3f4f6;
          padding: 6px;
          border-radius: 100px;
          display: flex;
          gap: 4px;
        }

        .toggle-btn {
          padding: 12px 32px;
          border: none;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background: transparent;
          color: #6b7280;
          font-family: 'Inter', sans-serif;
        }

        .toggle-btn.active {
          background: #ffffff;
          color: #f34f14;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        .save-badge {
          background: #fef2f2;
          color: #f34f14;
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 700;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .enterprise-banner {
          background: linear-gradient(135deg, #f34f14 0%, #ff7a45 100%);
          padding: 40px 50px;
          border-radius: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 80px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(243, 79, 20, 0.15);
        }

        .enterprise-content {
          position: relative;
          z-index: 1;
        }

        .enterprise-content h3 {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .enterprise-content p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
        }

        .enterprise-btn {
          background: #ffffff;
          color: #f34f14;
          border: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          z-index: 1;
          font-family: 'Inter', sans-serif;
        }

        .enterprise-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          padding: 14px 36px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 30px;
          margin-bottom: 100px;
        }

        .pricing-card {
          background: #ffffff;
          border: 1px solid #fee2e2;
          border-radius: 24px;
          padding: 40px 30px;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .pricing-card:hover {
          transform: translateY(-6px);
          border-color: #fca5a5;
          box-shadow: 0 15px 35px rgba(243, 79, 20, 0.05);
        }

        .pricing-card.featured {
          border: 2px solid #f34f14;
          transform: scale(1.02);
          box-shadow: 0 15px 35px rgba(243, 79, 20, 0.08);
          z-index: 2;
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          right: 30px;
          background: #f34f14;
          color: white;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .plan-icon {
          width: 50px;
          height: 50px;
          background: #fef2f2;
          color: #f34f14;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 20px;
        }

        .plan-name {
          font-size: 24px;
          font-weight: 700;
          color: #4b5563;
          margin-bottom: 8px;
        }

        .plan-description {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .price-section {
          margin: 20px 0;
        }

        .price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .currency {
          font-size: 20px;
          color: #9ca3af;
          font-weight: 600;
        }

        .amount {
          font-size: 48px;
          font-weight: 800;
          color: #f34f14;
          line-height: 1;
        }

        .period {
          font-size: 16px;
          color: #9ca3af;
          font-weight: 500;
        }

        .features-list {
          list-style: none;
          margin: 30px 0;
          flex-grow: 1;
          padding: 0;
        }

        .features-list li {
          padding: 8px 0;
          font-size: 15px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .features-list li::before {
          content: "✓";
          color: #f34f14;
          font-size: 14px;
          font-weight: 900;
          width: 24px;
          height: 24px;
          background: #fef2f2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cta-button {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .cta-button.primary {
          background: #f34f14;
          color: white;
        }

        .cta-button.primary:hover {
          background: #de450f;
        }

        .cta-button.secondary {
          background: #ffffff;
          color: #f34f14;
          border: 1px solid #f34f14;
        }

        .cta-button.secondary:hover {
          background: #fef2f2;
        }

        .custom-credit-section {
          background: #ffffff;
          border: 1px solid #fee2e2;
          border-radius: 32px;
          padding: 60px;
          position: relative;
          text-align: center;
        }

        .credit-header {
          margin-bottom: 40px;
        }

        .credit-header h2 {
          font-size: 36px;
          font-weight: 800;
          color: #374151;
          margin-bottom: 12px;
        }

        .credit-header p {
          font-size: 16px;
          color: #6b7280;
        }

        .slider-container {
          margin: 40px 0;
        }

        .slider-wrapper {
          position: relative;
          padding: 20px 0;
        }

        input[type="range"] {
          width: 100%;
          height: 8px;
          border-radius: 10px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f34f14;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(243, 79, 20, 0.3);
          border: 4px solid #ffffff;
          transition: all 0.2s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f34f14;
          cursor: pointer;
          border: 4px solid #ffffff;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .credit-display {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin: 40px 0;
        }

        .credit-box {
          background: #ffffff;
          border: 1px solid #fee2e2;
          border-radius: 20px;
          padding: 30px;
          text-align: center;
        }

        .credit-box label {
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 700;
          color: #6b7280;
          display: block;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }

        .credit-value {
          font-size: 48px;
          font-weight: 800;
          color: #f34f14;
        }

        .credit-subtext {
          font-size: 14px;
          color: #9ca3af;
          margin-top: 5px;
        }

        .particle {
          position: fixed;
          width: 4px;
          height: 4px;
          background: #f34f14;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          animation: particleFloat 4s ease-in infinite;
        }

        @keyframes particleFloat {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-1000px) scale(1); }
        }

        @media (max-width: 1200px) {
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-card.featured { transform: scale(1); }
          .popular-badge { top: 20px; right: 20px; }
        }
        @media (max-width: 768px) {
          .lc-topbar { padding: 15px 20px; }
          .lc-container { padding: 20px; }
          .hero h1 { font-size: 36px; }
          .enterprise-banner { flex-direction: column; text-align:center; padding: 30px 20px; gap: 20px;}
          .credit-display { grid-template-columns: 1fr; }
          .toggle-btn { padding: 10px 20px; font-size: 14px; }
          .lc-credit-pill { padding: 8px 12px; }
        }
      `}</style>

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
        <div className="orb orb3"></div>
        <div id="particle-container"></div>
      </div>

      {/* TOPBAR */}
      <div className="lc-topbar">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              type="button"
              onClick={triggerSidebarToggle}
              className="lc-btn-icon lc-mobile-toggle"
            >
              <i className="pi pi-bars"></i>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {sidebarOpen && (
            <button
              type="button"
              onClick={triggerSidebarToggle}
              className="lc-btn-icon lc-mobile-toggle"
            >
              <i className="pi pi-times"></i>
            </button>
          )}

          <div
            className={`lc-nav-actions ${
              sidebarOpen ? "hidden md:flex" : "flex"
            }`}
          >
            <button
              type="button"
              onClick={() => setRedeemOpen(true)}
              className="lc-btn-icon lc-btn-rotate"
            >
              <i className="pi pi-ticket"></i>
              <span className="hidden sm:inline text-sm font-medium">
                Redeem
              </span>
            </button>

            <div className="lc-credit-pill">
              <i className="pi pi-wallet"></i>
              <p>{credit?.credits?.toLocaleString()}</p>
            </div>

            <button className="lc-btn-icon" onClick={logout} type="button">
              <i className="pi pi-sign-out"></i>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="lc-container">
        <div className="hero">
          <h1>Choose a plan</h1>
          <p>Choose the perfect plan for your lead generation needs.</p>
        </div>

        <div className="pricing-toggle">
          <div className="toggle-group">
            <button
              className={`toggle-btn ${!annualSub ? "active" : ""}`}
              onClick={() => setAnnualSub(false)}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${annualSub ? "active" : ""}`}
              onClick={() => setAnnualSub(true)}
            >
              Annual
            </button>
          </div>
          <div className="save-badge">Save 20%</div>
        </div>

        <div className="enterprise-banner">
          <div className="enterprise-content">
            <h3>Need more leads for your business?</h3>
            <p>
              Our enterprise plans offer custom solutions tailored to your specific requirements.
            </p>
          </div>
          <button
            className="enterprise-btn"
            onClick={() => displayDialog("Support")}
          >
            Contact Us
          </button>
        </div>

        <div className="pricing-grid">
          {planData.map((planItem, index) => {
            const isFeatured = index === 1 || planItem.name === "Pro";
            const currentPrice = annualSub
              ? Math.round(
                  parseInt(planItem.dollar_amount) *
                    countryCurrency.rate *
                    12 *
                    0.8
                )
              : parseInt(planItem.dollar_amount) * countryCurrency.rate;

            return (
              <div
                key={index}
                className={`pricing-card ${isFeatured ? "featured" : ""}`}
              >
                {isFeatured && (
                  <div className="popular-badge">Recommended</div>
                )}

                <div className="plan-icon">
                  {index === 0 ? <i className="pi pi-star-fill text-xl"></i> : index === 1 ? <i className="pi pi-bolt text-xl"></i> : <i className="pi pi-building text-xl"></i>}
                </div>
                <div className="plan-name">{planItem.name}</div>
                <div className="plan-description">{planItem.description}</div>

                <div className="price-section">
                  <div className="price">
                    <span className="currency">{countryCurrency.symbol}</span>
                    <span className="amount">
                      {currentPrice.toLocaleString()}
                    </span>
                    <span className="period">
                      {annualSub ? "/yr" : "/mo"}
                    </span>
                  </div>
                </div>

                <ul className="features-list">
                  {planItem.features.map(
                    (feature: string, featIndex: number) => {
                      if (feature === "credits") {
                        const creditVal = annualSub
                          ? planItem.credits * 12
                          : planItem.credits;
                        return (
                          <li key={featIndex}>
                            {creditVal.toLocaleString()} credits
                          </li>
                        );
                      }
                      return <li key={featIndex}>{feature}</li>;
                    }
                  )}
                </ul>

                <button
                  className={`cta-button ${
                    isFeatured ? "primary" : "secondary"
                  }`}
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
                  <span>Get Started</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="custom-credit-section">
          <div className="credit-header">
            <h2>Custom Credit Purchase</h2>
            <p>
              Need a specific amount of credits? Use the slider to select exactly how many credits you want.
            </p>
          </div>

          <div className="slider-container">
            <div className="slider-wrapper">
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value))}
              />
              <div className="slider-labels">
                <span>1,000 credits</span>
                <span>50,000 credits</span>
              </div>
            </div>
          </div>

          <div className="credit-display">
            <div className="credit-box">
              <label>Selected Credits</label>
              <div className="credit-value">
                {creditAmount.toLocaleString()}
              </div>
            </div>
            <div className="credit-box">
              <label>Total Price</label>
              <div className="credit-value">
                {countryCurrency.symbol}
                {calculatePrice(creditAmount).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            className="cta-button primary"
            style={{
              maxWidth: "350px",
              margin: "0 auto",
              display: "block",
            }}
            onClick={() =>
              handlePaymentPlan({
                userId: user?.id,
                plan: "CUSTOM",
                amount: calculatePrice(creditAmount),
                credit: creditAmount,
              })
            }
          >
            <span>Purchase Custom Credits</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyCredit;