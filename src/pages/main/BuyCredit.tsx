import { useState, useEffect } from "react";
import "./BuyCredit.css"; // Imports your new CSS file
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