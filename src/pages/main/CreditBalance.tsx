import { Link } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { creditState, userState } from "../../utils/atom/authAtom";
import { getAllTransactions, getCreditBalance } from "../../utils/api/creditApi";
import { useEffect, useState } from "react";
import TextToCapitalize from "../../component/TextToCapital";
import { useSearchParams } from "react-router-dom";
import { confirmDodoPayment } from "../../utils/api/payment";
import { toast } from "react-toastify";
import "./BuyCredit.css";

interface TransactionDataStructure {
  currency: string;
  plan: string;
  price: number;
  purchaseDate: string;
  status: string;
  subscriptionId: string;
}

export default function CreditBalance() {
  const user = useRecoilValue(userState);
  const [creditInfo, setCreditInfo] = useRecoilState(creditState);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [transactions, setTransactions] = useState<TransactionDataStructure[]>();
  const [searchParams] = useSearchParams();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} ${formattedTime}`;
  };

  const getCredit = async () => {
    const total = await getCreditBalance();
    setCreditInfo({
      id: user?.id ?? "",
      credits: total?.data?.credits || 0,
      subscriptionType: total?.data?.subscriptionType || "FREE",
      expiresAt: total?.data?.expiresAt ?? null,
      proRemainingDays: total?.data?.proRemainingDays ?? 0,
      starterRemainingDays: total?.data?.starterRemainingDays ?? 0,
      isLTD: total?.data?.isLTD ?? false,
    });

    const tx = await getAllTransactions(pageNumber);
    setTransactions(tx?.data?.data);
  };

  const formatPlanName = (plan: string) => {
    const upperPlan = String(plan || '').toUpperCase();
    if (['STARTER', 'TOPUP_20', 'TOP UP 20'].includes(upperPlan)) {
      return 'Starter Plan';
    }
    if (['STARTER_ANNUAL', 'TOPUP_192', 'TOP UP 192'].includes(upperPlan)) {
      return 'Starter Annual Plan';
    }
    if (['PRO', 'TOPUP_60', 'TOP UP 60'].includes(upperPlan)) {
      return 'Pro Plan';
    }
    if (['PRO_ANNUAL', 'TOPUP_576', 'TOP UP 576'].includes(upperPlan)) {
      return 'Pro Annual Plan';
    }
    if (['BUSINESS', 'TOPUP_100', 'TOP UP 100'].includes(upperPlan)) {
      return 'Business Plan';
    }
    if (['BUSINESS_ANNUAL', 'TOPUP_960', 'TOP UP 960'].includes(upperPlan)) {
      return 'Business Annual Plan';
    }
    if (upperPlan === 'CUSTOM' || upperPlan === 'CUSTOM CREDITS') {
      return 'Custom Credits';
    }

    if (plan.includes("_ANNUAL")) {
      return `${TextToCapitalize(
        plan.replace("_ANNUAL", "").toLowerCase()
      )} Annual Plan`;
    }
    return `${TextToCapitalize(plan.toLowerCase())} Plan`;
  };

  const getActivePlanDisplay = () => {
    const subType = String(creditInfo?.subscriptionType || 'FREE').toUpperCase();
    if (subType === 'TOPUP') {
      if (creditInfo?.proRemainingDays && creditInfo.proRemainingDays > 0) return 'PRO';
      if (creditInfo?.starterRemainingDays && creditInfo.starterRemainingDays > 0) return 'STARTER';
      return 'PRO'; // Default fallback for historical TOPUP to make it look premium
    }
    if (subType === 'CUSTOM') return 'CUSTOM PLAN';
    return subType;
  };

  const getUpcomingPlan = () => {
    if (creditInfo?.isLTD) return "NONE"; // LTD => no upcoming plan
    if (creditInfo?.proRemainingDays && creditInfo.proRemainingDays > 0) {
      return `Pro (${creditInfo.proRemainingDays} days)`;
    }
    if (
      creditInfo?.starterRemainingDays &&
      creditInfo.starterRemainingDays > 0
    ) {
      return `Starter (${creditInfo.starterRemainingDays} days)`;
    }
    return "NONE";
  };

  const isSuccessfulDodoReturn = () => {
    const status = String(searchParams.get("status") || "").toLowerCase();
    return status === "succeeded" || status === "success" || status === "active";
  };

  useEffect(() => {
    const method = searchParams.get("method");
    const paymentId = searchParams.get("payment_id");
    const shouldPollForCompletion = method === "DODO" && isSuccessfulDodoReturn();

    let isMounted = true;
    let attempts = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const refresh = async () => {
      if (!isMounted) return;
      await getCredit();
    };

    const reconcileDodoPayment = async () => {
      if (!shouldPollForCompletion || !paymentId) return;
      try {
        await confirmDodoPayment({ paymentId });
      } catch (error) {
        console.warn('Dodo payment confirmation skipped or failed:', error);
      }
    };

    (async () => {
      await reconcileDodoPayment();
      await refresh();
    })();

    if (shouldPollForCompletion) {
      intervalId = setInterval(async () => {
        attempts += 1;
        await refresh();
        if (attempts >= 6 && intervalId) {
          clearInterval(intervalId);
        }
      }, 2000);
    }

    setPageNumber(1);

    // Particles background floating effect
    const particlesInterval = setInterval(() => {
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

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      clearInterval(particlesInterval);
    };
  }, [searchParams]);

  return (
    <div className="leadcourt-theme-wrapper min-h-screen relative overflow-x-hidden font-sans text-gray-700 bg-white">

      {/* BACKGROUND */}
      <div className="animated-bg">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div id="particle-container"></div>
      </div>

      <div className="lc-container max-w-6xl mx-auto px-4 py-10 relative z-10">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">My Subscriptions</h1>
            <p className="text-gray-500 text-sm">Monitor your plans, billing history, and active credit status.</p>
          </div>
          <Link
            to="/subscription"
            className="bg-[#f34f14] hover:bg-[#de450f] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-orange-500/20 text-sm flex items-center gap-2"
          >
            <i className="pi pi-sync"></i>
            Change or Renew Plan
          </Link>
        </div>

        {/* OVERVIEW WIDGETS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

          {/* Credit Balance Card */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Credit Balance</p>
                <h3 className="text-3xl font-extrabold text-[#f34f14] mt-1">{creditInfo?.credits?.toLocaleString() ?? 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f34f14] flex items-center justify-center">
                <i className="pi pi-wallet text-lg"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Credits roll over dynamically</p>
          </div>

          {/* Active Plan Card */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Plan</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1 uppercase leading-none">{getActivePlanDisplay()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f34f14] flex items-center justify-center">
                <i className="pi pi-briefcase text-lg"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Current active billing tier</p>
          </div>

          {/* Upcoming Plan Card */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming Plan</p>
                <h3 className="text-xl font-extrabold text-gray-800 mt-2 truncate max-w-[150px]">{getUpcomingPlan()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f34f14] flex items-center justify-center">
                <i className="pi pi-calendar-plus text-lg"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Auto-renew pending status</p>
          </div>

          {/* Expiry Date Card */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expiry Date</p>
                <h3 className="text-xl font-extrabold text-gray-800 mt-2">
                  {creditInfo?.isLTD
                    ? "LIFETIME"
                    : creditInfo?.expiresAt
                    ? formatDate(creditInfo.expiresAt)
                    : "—"}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f34f14] flex items-center justify-center">
                <i className="pi pi-calendar text-lg"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Plan validity expiration</p>
          </div>

        </div>

        {/* TRANSACTION HISTORY TABLE */}
        <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden mb-10">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Billing History</h2>
              <p className="text-xs text-gray-400 mt-1">Detailed record of recent subscription renewals and payments.</p>
            </div>
            <div className="text-xs font-bold text-[#f34f14] bg-orange-50 border border-orange-100 px-4 py-2 rounded-full">
              {transactions?.length ?? 0} Transactions
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            {transactions && transactions.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-4 px-8">Plan / Product</th>
                    <th className="py-4 px-6">Transaction ID</th>
                    <th className="py-4 px-6">Purchase Date</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-8 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {transactions.map((items) => (
                    <tr key={items.subscriptionId} className="hover:bg-gray-50/50 transition-colors">

                      {/* Plan / Product */}
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#f34f14] flex items-center justify-center font-bold text-xs">
                            <i className="pi pi-star-fill"></i>
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900">{formatPlanName(items.plan)}</div>
                            <div className="text-[10px] text-gray-400 font-medium">B2B Lead Court</div>
                          </div>
                        </div>
                      </td>

                      {/* Transaction ID */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg w-fit">
                          <span>{items.subscriptionId?.substring(0, 16) ?? "N/A"}...</span>
                          <button
                            title="Copy ID"
                            onClick={() => {
                              navigator.clipboard.writeText(items.subscriptionId);
                              toast.info("Copied to clipboard!");
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <i className="pi pi-copy text-[10px]"></i>
                          </button>
                        </div>
                      </td>

                      {/* Purchase Date */}
                      <td className="py-5 px-6 font-medium text-gray-600">
                        {formatDateTime(items.purchaseDate)}
                      </td>

                      {/* Price */}
                      <td className="py-5 px-6 font-extrabold text-gray-900">
                        {items.currency === "USD" ? "$" : items.currency === "INR" ? "₹" : ""}
                        {items.price.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-5 px-8 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold tracking-wide
                            ${
                              items.status === "COMPLETED"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : items.status === "DENIED" || items.status.toLowerCase() === "failed"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            }`}
                        >
                          {items.status === "COMPLETED" ? "Successful" : TextToCapitalize(items.status.toLowerCase())}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mb-4 border border-gray-100">
                  <i className="pi pi-receipt text-2xl"></i>
                </div>
                <h3 className="font-bold text-gray-700">No transactions found</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[250px]">You haven't initiated any payment transactions yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
