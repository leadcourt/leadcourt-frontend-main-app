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
  return await axios.post(`${baseUrl}/list2/store`, payload);
};

const addByFilterToList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list2/add-by-filter`, payload);
};

const createNewList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list2/create`, payload);
};

const getAllList = async (payload?: any) => {
  return await axios.post(`${baseUrl}/list2/summary`, payload || {});
};

const getSingleListDetail = async (payload: any) => {
  return await axios.post(`${baseUrl}/list2/show`, payload);
};

const getSingleListDetailCursor = async (payload: any) => {
  return await axios.post(`${baseUrl}/list2/show-cursor`, payload);
};

const getListRevealEstimate = async (payload: any) => {
  return await axios.post(`${baseUrl}/list2/reveal-estimate`, payload);
};

const revealAllFromList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list2/reveal-all`, payload);
};

const deleteAList = async (listname: any) => {
  return await axios.delete(`${baseUrl}/list2/${listname}`);
};

const renameAList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list2/rename`, payload);
};

const exportList = async (payload: any) => {
  return await axios.post(`${baseUrl}/list2/export`, payload);
};

const addSubscriber = async (payload: any) => {
  return await axios.post(`${baseUrl}/add-subscriber`, payload);
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