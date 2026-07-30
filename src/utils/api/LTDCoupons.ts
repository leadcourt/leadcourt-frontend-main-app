import axios from "axios";

const baseUrl = import.meta.env.VITE_BE_URL;

export const redeemCoupon = async (code: string) => {
  return axios.post(`${baseUrl}/ltd/redeem`, { code });
};

export const validatePartnerCoupon = async (code: string) => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
  return axios.post(`${baseUrl}/partner-coupons/validate`, { code }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
