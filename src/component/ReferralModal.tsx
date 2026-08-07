import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRecoilValue } from "recoil";
import { userState } from "../utils/atom/authAtom";
import { API_BASE } from "../config/api";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const user = useRecoilValue(userState);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ signedUp: 0, converted: 0, creditsEarned: 0 });

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    const fetchReferralStats = async () => {
      try {
        const [refRes, commRes] = await Promise.all([
          fetch(`${API_BASE}/partners/referrals/${user.id}`),
          fetch(`${API_BASE}/partners/commissions/${user.id}`),
        ]);
        const refData = await refRes.json();
        const commData = await commRes.json();

        const signedUpCount = refData.success && Array.isArray(refData.referrals) ? refData.referrals.length : 0;
        const commissionsList = commData.success && Array.isArray(commData.commissions) ? commData.commissions : [];
        const convertedCount = commissionsList.length;
        const totalEarned = commData.stats?.totalEarned || commissionsList.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);

        setStats({
          signedUp: signedUpCount,
          converted: convertedCount,
          creditsEarned: Math.round(totalEarned),
        });
      } catch (err) {
        console.error("Failed to fetch referral stats:", err);
      }
    };
    fetchReferralStats();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  // Dynamic referral URL based on current window origin (localhost in dev, app.leadcourt.com in prod)
  const referralCode = user?.id || "your-code";
  const referralUrl = `${window.location.origin}/r/${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
          aria-label="Close modal"
        >
          <i className="pi pi-times text-lg" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          {/* Title & Subtitle */}
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Refer a Friend, <span className="text-orange-500">Earn free credits</span>
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              The moment someone subscribes through your link, you both get credited — same amount, either side.
            </p>
          </div>

          {/* How It Pays Out Section */}
          <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-200 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              HOW IT PAYS OUT
            </h3>

            {/* Step 01 */}
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-gray-400 font-mono pt-0.5">01</span>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Share your invite link</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                  One link per account — every signup through it is tracked automatically. Signing up alone doesn't unlock credits for either side.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-gray-400 font-mono pt-0.5">02</span>
              <div className="space-y-2 w-full">
                <h4 className="text-sm font-semibold text-gray-900">
                  They subscribe — you both get paid
                </h4>
                <p className="text-xs text-gray-500 leading-normal">
                  The instant their plan goes active,{" "}
                  <span className="inline-block px-1.5 py-0.5 text-[11px] font-semibold bg-orange-100 text-orange-800 rounded">you</span>
                  {" "}and{" "}
                  <span className="inline-block px-1.5 py-0.5 text-[11px] font-semibold bg-gray-200 text-gray-800 rounded">them</span>
                  {" "}each get the same bonus, on top of their plan's credits.
                </p>

                {/* Plan Tiers Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">PLAN 1</div>
                    <div className="text-sm font-extrabold text-orange-500">+500</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">PLAN 2</div>
                    <div className="text-sm font-extrabold text-orange-500">+1,000</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">PLAN 3</div>
                    <div className="text-sm font-extrabold text-orange-500">+2,000</div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 italic pt-1">
                  Brings a second person in later? Same rules apply again — every new subscriber through your link pays out again.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-around bg-gray-50 border border-gray-200 text-gray-800 rounded-xl py-3 px-4 text-xs font-medium">
            <div>
              <span className="font-bold text-gray-900">{stats.signedUp}</span> <span className="text-gray-500">signed up</span>
            </div>
            <span className="text-gray-300">•</span>
            <div>
              <span className="font-bold text-gray-900">{stats.converted}</span> <span className="text-gray-500">converted</span>
            </div>
            <span className="text-gray-300">•</span>
            <div>
              <span className="font-bold text-orange-600">{stats.creditsEarned}</span> <span className="text-orange-600">credits earned</span>
            </div>
          </div>

          {/* Link Field & Copy Action */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <i className="pi pi-link text-gray-400 text-sm" />
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="bg-transparent border-none text-xs text-gray-800 focus:outline-none w-full font-mono select-all"
              />
            </div>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-orange-500/20 text-sm cursor-pointer"
            >
              <i className={`pi ${copied ? "pi-check" : "pi-copy"} text-base`} />
              {copied ? "Copied to Clipboard!" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
