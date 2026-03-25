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
// 🔙 V1 ENDPOINTS (Reads saved lists from MongoDB)
// ==========================================

const getSingleListDetail = async (payload: any) => {
  // Reverted to list (V1) so your table actually shows the saved contacts!
  return await axios.post(`${baseUrl}/list/show`, payload);
};

const getSingleListDetailCursor = async (payload: any) => {
  // Reverted to list (V1) to keep pagination in sync with MongoDB
  return await axios.post(`${baseUrl}/list/show-cursor`, payload);
};

// ==========================================
// 🚀 V2 ENDPOINTS (New Background Worker & DuckDB Logic)
// ==========================================

const getListRevealEstimate = async (payload: any) => {
  // Stays list2: Fixes the 0 credits disabled button bug
  return await axios.post(`${baseUrl}/list2/reveal-estimate`, payload);
};

const revealAllFromList = async (payload: any) => {
  // Stays list2: Fixes the fake "success" toast without deducting credits
  return await axios.post(`${baseUrl}/list2/reveal-all`, payload);
};

const exportList = async (payload: any) => {
  // Stays list2: Connects to your new specific checkbox export logic
  return await axios.post(`${baseUrl}/list2/export`, payload);
};

// ==========================================
// 🔙 V1 ENDPOINTS (Standard List Management)
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