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
    <div className="leadcourt-theme-wrapper min-h-screen relative overflow-x-hidden font-sans text-white bg-[#0a0a0a]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        @import url("https://unpkg.com/primeicons/primeicons.css");

        .leadcourt-theme-wrapper {
          font-family: 'Space Grotesk', sans-serif;
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
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 107, 53, 0.3);
          padding: 10px 20px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          color: white;
          box-shadow: 0 5px 20px rgba(255, 107, 53, 0.1);
        }
        
        .lc-credit-pill i { color: #ff6b35; font-size: 1.1rem; }

        .lc-btn-icon {
          min-width: 45px;
          height: 45px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.3s ease, border-color 0.3s ease;
          color: #ff6b35;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.85rem;
        }

        /* Mobile-only toggle buttons (hamburger / close) */
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
          background: rgba(255, 107, 53, 0.1);
          border-color: #ff6b35;
        }

        /* Only rotate icons on buttons that explicitly have lc-btn-rotate */
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
          filter: blur(80px);
          opacity: 0.6;
          animation: float 20s infinite ease-in-out;
        }

        .orb1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #ff6b35, #ff8c42);
          top: -200px;
          right: -200px;
          animation-delay: 0s;
        }

        .orb2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #ff4500, #ff6347);
          bottom: -150px;
          left: -150px;
          animation-delay: 5s;
        }

        .orb3 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #ffa500, #ff8c00);
          top: 50%;
          left: 50%;
          animation-delay: 10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(100px, -100px) scale(1.1); }
          50% { transform: translate(-50px, 100px) scale(0.9); }
          75% { transform: translate(-100px, -50px) scale(1.05); }
        }

        .lc-container {
          max-width: 1600px;
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

        .hero::before {
          content: '';
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,107,53,0.3) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(60px);
          animation: pulse 4s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 0.5; }
        }

        .hero h1 {
          font-size: clamp(48px, 8vw, 96px);
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #ff6b35 50%, #ff4500 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 24px;
          letter-spacing: -2px;
          line-height: 1.1;
        }

        .hero p {
          font-size: 24px;
          opacity: 0.8;
          font-weight: 300;
          max-width: 600px;
          margin: 0 auto;
        }

        .pricing-toggle {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 30px;
          margin: 40px 0 60px 0;
          position: relative;
        }

        .toggle-group {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 107, 53, 0.2);
          padding: 8px;
          border-radius: 100px;
          display: flex;
          gap: 8px;
          box-shadow: 0 20px 60px rgba(255, 107, 53, 0.2);
        }

        .toggle-btn {
          padding: 16px 40px;
          border: none;
          border-radius: 100px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Space Grotesk', sans-serif;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
          color: white;
          box-shadow: 0 10px 40px rgba(255, 107, 53, 0.4);
          transform: scale(1.05);
        }

        .save-badge {
          background: linear-gradient(135deg, #fff 0%, #ffa500 100%);
          color: #000;
          padding: 12px 28px;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 700;
          box-shadow: 0 10px 40px rgba(255, 165, 0, 0.4);
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .enterprise-banner {
          background: linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(255,69,0,0.1) 100%);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 107, 53, 0.3);
          padding: 50px 60px;
          border-radius: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 80px;
          position: relative;
          overflow: hidden;
        }

        .enterprise-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%);
          animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .enterprise-content {
          position: relative;
          z-index: 1;
        }

        .enterprise-content h3 {
          font-size: 32px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #fff 0%, #ff6b35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .enterprise-content p {
          font-size: 18px;
          opacity: 0.8;
        }

        .enterprise-btn {
          background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
          color: white;
          border: none;
          padding: 20px 50px;
          border-radius: 15px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 15px 50px rgba(255, 107, 53, 0.4);
          position: relative;
          z-index: 1;
          font-family: 'Space Grotesk', sans-serif;
        }

        .enterprise-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 70px rgba(255, 107, 53, 0.6);
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 40px;
          margin-bottom: 100px;
          perspective: 1000px;
        }

        .pricing-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 25px;
          padding: 35px 30px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,107,53,0.05) 0%, rgba(255,69,0,0.05) 100%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .pricing-card:hover {
          transform: translateY(-20px) rotateX(5deg);
          border-color: rgba(255, 107, 53, 0.5);
          box-shadow: 0 40px 100px rgba(255, 107, 53, 0.3);
        }

        .pricing-card:hover::before {
          opacity: 1;
        }

        .pricing-card.featured {
          background: linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(255,69,0,0.1) 100%);
          border: 2px solid #ff6b35;
          transform: scale(1.08);
          box-shadow: 0 30px 80px rgba(255, 107, 53, 0.4);
          z-index: 2;
        }

        .popular-badge {
          position: absolute;
          top: 30px;
          right: -35px;
          background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
          color: white;
          padding: 10px 50px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          transform: rotate(45deg);
          box-shadow: 0 5px 20px rgba(255, 107, 53, 0.5);
        }

        .plan-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
          position: relative;
          z-index: 1;
        }

        .plan-name {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }

        .plan-description {
          font-size: 14px;
          opacity: 0.7;
          margin-bottom: 25px;
          position: relative;
          z-index: 1;
        }

        .price-section {
          margin: 25px 0;
          position: relative;
          z-index: 1;
        }

        .price {
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-bottom: 8px;
        }

        .currency {
          font-size: 24px;
          color: #ff6b35;
          font-weight: 700;
        }

        .amount {
          font-size: 52px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #ff6b35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .period {
          font-size: 16px;
          opacity: 0.6;
        }

        .features-list {
          list-style: none;
          margin: 25px 0;
          position: relative;
          z-index: 1;
          flex-grow: 1;
        }

        .features-list li {
          padding: 10px 0;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0.9;
          transition: all 0.3s ease;
        }

        .features-list li:hover {
          opacity: 1;
          transform: translateX(10px);
        }

        .features-list li::before {
          content: "✦";
          color: #ff6b35;
          font-size: 16px;
          width: 26px;
          height: 26px;
          background: rgba(255, 107, 53, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cta-button {
          width: 100%;
          padding: 20px;
          border: none;
          border-radius: 15px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          z-index: 1;
          overflow: hidden;
          font-family: 'Space Grotesk', sans-serif;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: width 0.6s ease, height 0.6s ease, top 0.6s ease, left 0.6s ease;
          transform: translate(-50%, -50%);
        }

        .cta-button:hover::before {
          width: 400px;
          height: 400px;
        }

        .cta-button span {
          position: relative;
          z-index: 1;
        }

        .cta-button.primary {
          background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
          color: white;
          box-shadow: 0 15px 50px rgba(255, 107, 53, 0.4);
        }

        .cta-button.primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 25px 70px rgba(255, 107, 53, 0.6);
        }

        .cta-button.secondary {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 2px solid rgba(255, 107, 53, 0.5);
        }

        .cta-button.secondary:hover {
          background: rgba(255, 107, 53, 0.1);
          border-color: #ff6b35;
        }

        .custom-credit-section {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 40px;
          padding: 80px 60px;
          position: relative;
          overflow: hidden;
        }

        .custom-credit-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%);
          animation: rotate 30s linear infinite reverse;
        }

        .credit-header {
          text-align: center;
          margin-bottom: 60px;
          position: relative;
          z-index: 1;
        }

        .credit-header h2 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #fff 0%, #ff6b35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .credit-header p {
          font-size: 18px;
          opacity: 0.7;
        }

        .slider-container {
          margin: 60px 0;
          position: relative;
          z-index: 1;
        }

        .slider-wrapper {
          position: relative;
          padding: 40px 0;
        }

        input[type="range"] {
          width: 100%;
          height: 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
          position: relative;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-track {
          height: 12px;
          border-radius: 10px;
          background: linear-gradient(to right, #ff6b35 0%, #ff4500 100%);
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
          cursor: pointer;
          box-shadow: 0 10px 40px rgba(255, 107, 53, 0.6);
          border: 4px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 15px 50px rgba(255, 107, 53, 0.8);
        }

        input[type="range"]::-moz-range-thumb {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
          cursor: pointer;
          box-shadow: 0 10px 40px rgba(255, 107, 53, 0.6);
          border: 4px solid rgba(255, 255, 255, 0.2);
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          font-size: 16px;
          opacity: 0.6;
        }

        .credit-display {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin: 60px 0;
          position: relative;
          z-index: 1;
        }

        .credit-box {
          background: rgba(255, 107, 53, 0.1);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 107, 53, 0.3);
          border-radius: 25px;
          padding: 50px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .credit-box:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 60px rgba(255, 107, 53, 0.3);
        }

        .credit-box label {
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 2px;
          opacity: 0.7;
          display: block;
          margin-bottom: 20px;
        }

        .credit-value {
          font-size: 64px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #ff6b35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .credit-subtext {
          font-size: 18px;
          opacity: 0.5;
          margin-top: 10px;
        }

        .particle {
          position: fixed;
          width: 4px;
          height: 4px;
          background: #ff6b35;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          animation: particleFloat 4s ease-in infinite;
        }

        @keyframes particleFloat {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-1000px) scale(1); }
        }

        @media (max-width: 1200px) {
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-card.featured { transform: scale(1); }
        }
        @media (max-width: 768px) {
          .lc-topbar { padding: 15px 20px; }
          .lc-container { padding: 20px 20px; }
          .hero h1 { font-size: 48px; }
          .enterprise-banner { flex-direction: column; text-align:center; padding: 40px 30px; gap: 20px;}
          .credit-display { grid-template-columns: 1fr; }
          .toggle-btn { padding: 12px 24px; font-size: 16px; }
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

      <Dialog
        header={couponResult ? "Success" : "Redeem Coupon"}
        visible={redeemOpen}
        style={{ width: "420px", padding: "1.5rem", backgroundColor: "white" }}
        onHide={closeRedeem}
      >
        {!couponResult ? (
          <div className="space-y-4">
            <label className="text-sm text-gray-600">Enter Coupon</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. LC-QGBN-B3SW-GNVX"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 text-gray-900"
            />
            <button
              onClick={onRedeem}
              disabled={redeeming}
              className="bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg hover:bg-orange-400 transition-all w-full"
            >
              {redeeming ? "Redeeming..." : "Redeem Coupon"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-green-600 font-semibold">
              Coupon applied successfully!
            </p>
            <div className="text-sm text-gray-700 space-y-1">
              <div>
                <span className="font-medium">Plan:</span> {couponResult.plan}
              </div>
              <div>
                <span className="font-medium">Expiry:</span>{" "}
                {couponResult.isLTD ? "Lifetime" : "—"}
              </div>
              <div>
                <span className="font-medium">Credits Added:</span>{" "}
                {couponResult.addedCredits?.toLocaleString?.() ??
                  couponResult.addedCredits}
              </div>
              <div>
                <span className="font-medium">Updated Credits:</span>{" "}
                {couponResult.credits?.toLocaleString?.() ??
                  couponResult.credits}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Code: {couponResult.code}
              </div>
            </div>
            <button
              onClick={closeRedeem}
              className="bg-gray-800 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition-all w-full"
            >
              Close
            </button>
          </div>
        )}
      </Dialog>

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
              <span className="hidden sm:inline text-xs font-medium text-white">
                Redeem Coupon
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
          <p>Choose the perfect plan for your business needs.</p>
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
              Our enterprise plans offer custom solutions tailored to your
              specific requirements..
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
                  <div className="popular-badge">Most Popular</div>
                )}

                <div className="plan-icon">
                  {index === 0 ? "🌱" : index === 1 ? "⚡" : "🏢"}
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
                  <span>Buy Now</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="custom-credit-section">
          <div className="credit-header">
            <h2>Custom Credit Purchase</h2>
            <p>
              Need a specific amount of credits? Use the slider to select
              exactly how many credits you want.
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
              <label>Selected:</label>
              <div className="credit-value">
                {creditAmount.toLocaleString()}
              </div>
              <div className="credit-subtext">credits</div>
            </div>
            <div className="credit-box">
              <label>Total Price:</label>
              <div className="credit-value">
                {countryCurrency.symbol}
                {calculatePrice(creditAmount).toLocaleString()}
              </div>
              <div className="credit-subtext">one-time payment</div>
            </div>
          </div>

          <button
            className="cta-button primary"
            style={{
              maxWidth: "400px",
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
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyCredit;
