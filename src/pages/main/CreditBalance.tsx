import { Link } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { creditState, userState } from "../../utils/atom/authAtom";
import { getAllTransactions, getCreditBalance } from "../../utils/api/creditApi";
import { useEffect, useState } from "react";
import TextToCapitalize from "../../component/TextToCapital";

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
    if (plan.includes("_ANNUAL")) {
      return `${TextToCapitalize(
        plan.replace("_ANNUAL", "").toLowerCase()
      )} Annual Plan`;
    }
    return `${TextToCapitalize(plan.toLowerCase())} Plan`;
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

  useEffect(() => {
    getCredit();
    setPageNumber(1);
  }, []);

  return (
    <div className="p-5 my-3">
      <div className="mt-10 mb-5">
        <p className="text-4xl font-bold text-gray-600 my-2">My Subscriptions</p>
        <p className=" text-gray-500">
          Here is list of package/product that you have subscribed.
        </p>
      </div>

      <div className="my-5 rounded-xl p-5 border border-red-100">
        <div className="grid grid-cols-2 gap-y-6 gap-x-10">
          <div>
            <h3>Credit Balance</h3>
            <p className="flex items-center gap-2">
              <span className="pi pi-wallet text-[#f34f14] text-xs"></span>
              <span className="text-gray-500">{creditInfo?.credits}</span>
            </p>
          </div>

          <div>
            <h3>Upcoming Plan</h3>
            <p className="flex items-center gap-2">
              <span className="pi pi-calendar-plus text-[#f34f14] text-xs"></span>
              <span className="text-gray-500">{getUpcomingPlan()}</span>
            </p>
          </div>

          <div>
            <h3>Active Subscription</h3>
            <p className="flex items-center gap-2">
              <span className="pi pi-briefcase text-[#f34f14] text-xs"></span>
              <span className="text-gray-500">
                {creditInfo?.subscriptionType}
              </span>
            </p>
          </div>

          <div>
            <h3>Expiry Date</h3>
            <p className="flex items-center gap-2">
              <span className="pi pi-calendar text-[#f34f14] text-xs"></span>
              <span className="text-gray-500">
                {creditInfo?.isLTD
                  ? "LIFETIME"
                  : creditInfo?.expiresAt
                  ? formatDate(creditInfo.expiresAt)
                  : "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div>
        {transactions?.map((items) => (
          <div
            key={items.subscriptionId}
            className="lg:flex border border-red-50 hover:shadow shadow-red-200 rounded-xl overflow-hidden mb-5"
          >
            <div className="p-5 w-full">
              <div className="flex justify-between flex-wrap mb-2 lg:mb-0">
                <p className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-[#f34f14]">
                    {formatPlanName(items.plan)}
                  </span>
                </p>
              </div>
              <p>
                <span className="text-sm text-gray-400">Subscription ID:</span>
                <span className="ml-2 text-lg text-gray-600">
                  {items.subscriptionId}
                </span>
              </p>
              <div className="mt-10 flex justify-between flex-wrap">
                <div className="text-sm">
                  <p className="text-gray-400">Start date</p>
                  <p className="text-gray-700">
                    {formatDateTime(items.purchaseDate)}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-400">Price</p>
                  <p className="text-gray-700">
                    {items.currency === "USD"
                      ? "$"
                      : items.currency === "INR"
                      ? "₹"
                      : ""}{" "}
                    {items.price}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-400">Status</p>
                  <p
                    className={` text-gray-700 text-xs px-3 py-1 rounded-full
                    ${
                      items.status === "COMPLETED"
                        ? "bg-green-200"
                        : items.status === "DENIED" ||
                          items.status.toLowerCase() === "failed"
                        ? "bg-red-200"
                        : items.status === "PENDING"
                        ? "bg-yellow-200"
                        : items.status === "REFUNDED"
                        ? "bg-purple-300"
                        : items.status === "REVERSED"
                        ? "bg-blue-300"
                        : ""
                    }`}
                  >
                    {items.status === "DENIED"
                      ? "Failed"
                      : TextToCapitalize(items.status.toLowerCase())}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-5 w-full lg:w-[270px] flex items-center justify-center">
              <div>
                <div className="w-fit m-auto">
                  <Link
                    to="/subscription/"
                    className="bg-[#f34f14] font-bold text-white min-w-[100px] px-3 py-1 transition hover:py-2 text-center rounded-lg"
                  >
                    Change Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
