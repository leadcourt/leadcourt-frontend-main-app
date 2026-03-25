import axios from "axios";

const baseUrl = import.meta.env.VITE_BE_URL;

const getAllData = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter`, payload);
};

const searchOption = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/search-options`, payload);
};

const searchOptionDesignation = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/designations`, payload);
};

const getDataPhoneAndEmail = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/row-access`, payload);
};

const getLinkedInUrl = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/linkedin`, payload);
};

const searchLinkedInProfile = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/linkedin-search`, payload);
};

const addProfilesToList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/store`, payload);
};

const addByFilterToList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/add-by-filter`, payload);
};

const createNewList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/create`, payload);
};

const getAllList = async (payload?: any) => {
  return await axios.post(`${baseUrl}/list/summary`, payload || {});
};

// ==========================================
// 🔙 V1 ENDPOINTS (Reads from MongoDB & handles revealing)
// ==========================================

const getSingleListDetail = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/show`, payload);
};

const getSingleListDetailCursor = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/show-cursor`, payload);
};

const getListRevealEstimate = async (payload: any) => {
  // We calculate this on the frontend now, no need to hit the server
  return { data: { phoneCredits: 0, emailCredits: 0, phoneCount: 0, emailCount: 0 } };
};

const revealAllFromList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/reveal-all`, payload);
};

// ==========================================
// 🚀 V2 ENDPOINTS (New Background Worker Logic)
// ==========================================

const exportList = async (payload: any) => {
  // This is the ONLY route that should point to list2
  return await axios.post(`${baseUrl}/list2/export`, payload);
};

// ==========================================
// 🔙 STANDARD LIST MANAGEMENT
// ==========================================

const deleteAList = async (listname: any) => {
  return await axios.delete(`${baseUrl}/list/${listname}`);
};

const renameAList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/rename`, payload);
};

const addSubscriber = async (payload: any) => {
  const authUrl = baseUrl.replace('/api', '/auth');
  return await axios.post(`${authUrl}/ext/login`, payload);
};

export {
  getAllData,
  searchOption,
  searchOptionDesignation,
  getAllList,
  getSingleListDetail,
  getSingleListDetailCursor,
  getListRevealEstimate,
  revealAllFromList,
  addProfilesToList,
  addByFilterToList,
  getDataPhoneAndEmail,
  getLinkedInUrl,
  searchLinkedInProfile,
  createNewList,
  deleteAList,
  renameAList,
  exportList,
  addSubscriber,
};