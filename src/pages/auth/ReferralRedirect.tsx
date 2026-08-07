import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const ReferralRedirect: React.FC = () => {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (referralCode) {
      // Store in persistent cookie (30 days) and localStorage for robustness
      Cookies.set("referral_code", referralCode, { expires: 30, path: "/", sameSite: "lax" });
      localStorage.setItem("referral_code", referralCode);
      // Redirect to register page with ?ref= parameter
      navigate(`/auth/register?ref=${encodeURIComponent(referralCode)}`, { replace: true });
    } else {
      navigate("/auth/register", { replace: true });
    }
  }, [referralCode, navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <i className="pi pi-spin pi-spinner text-3xl text-orange-500" />
        <p className="text-sm font-medium text-gray-600">Redirecting to LeadCourt signup...</p>
      </div>
    </div>
  );
};

export default ReferralRedirect;
