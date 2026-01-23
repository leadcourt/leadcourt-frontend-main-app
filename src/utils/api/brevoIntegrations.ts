import axios from "axios";

const baseUrl = import.meta.env.VITE_BE_URL

export const connectBrevo = (payload: { apiKey: string }) => {
  return axios.post(`${baseUrl}/integrations/brevo/connect`, payload);
};

export const checkBrevoConnection = (verify: boolean = false) => {
  const q = verify ? "?verify=1" : "";
  return axios.get(`${baseUrl}/integrations/brevo/check${q}`);
};

export const removeBrevoConnection = () => {
  return axios.delete(`${baseUrl}/integrations/brevo/remove`);
};

export const exportToBrevoApi = (payload: { listName: string | undefined }) => {
  return axios.post(`${baseUrl}/integrations/brevo/export`, payload);
};
