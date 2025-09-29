import axios from "axios";

const baseUrl = import.meta.env.VITE_BE_URL;

export const redeemCoupon = async (code: string) => {
  return axios.post(`${baseUrl}/ltd/redeem`, { code });
};
