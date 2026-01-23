import axios from "axios";

const baseUrl = import.meta.env.VITE_BE_URL + "/collaboration/integrations";

export const collaboration_checkHubspotConnection = async () => {
  return await axios.get(`${baseUrl}/hubspot/check`);
};

export const collaboration_exportToHubspotApi = async (payload: { listName: string | undefined }) => {
  return await axios.post(`${baseUrl}/hubspot/export`, payload);
};

export const collaboration_removeHubspotConnection = async () => {
  return await axios.delete(`${baseUrl}/hubspot/remove`);
};

export const collaboration_exchangeHubspotCode = async (payload: any) => {
  return await axios.post(`${baseUrl}/hubspot/exchange-code`, payload);
};

export const collaboration_connectBrevo = async (payload: { apiKey: string }) => {
  return await axios.post(`${baseUrl}/brevo/connect`, payload);
};

export const collaboration_checkBrevoConnection = async (verify: boolean = false) => {
  const q = verify ? "?verify=1" : "";
  return await axios.get(`${baseUrl}/brevo/check${q}`);
};

export const collaboration_removeBrevoConnection = async () => {
  return await axios.delete(`${baseUrl}/brevo/remove`);
};

export const collaboration_exportToBrevoApi = async (payload: { listName: string | undefined }) => {
  return await axios.post(`${baseUrl}/brevo/export`, payload);
};
