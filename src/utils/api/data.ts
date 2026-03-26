import axios from "axios";

const baseUrl = import.meta.env.VITE_BE_URL;

const getAllData = async (payload: any) => await axios.post(`${baseUrl}/filter`, payload);
const searchOption = async (payload: any) => await axios.post(`${baseUrl}/filter/search-options`, payload);
const searchOptionDesignation = async (payload: any) => await axios.post(`${baseUrl}/filter/designations`, payload);
const getDataPhoneAndEmail = async (payload: any) => await axios.post(`${baseUrl}/filter/row-access`, payload);
const getLinkedInUrl = async (payload: any) => await axios.post(`${baseUrl}/filter/linkedin`, payload);
const searchLinkedInProfile = async (payload: any) => await axios.post(`${baseUrl}/filter/linkedin-search`, payload);

// --- ALL LIST ROUTES NOW UNIFIED TO V2 (/list2/) ---
const addProfilesToList = async (payload: any) => await axios.post(`${baseUrl}/list2/store`, payload);
const addByFilterToList = async (payload: any) => await axios.post(`${baseUrl}/list2/add-by-filter`, payload);
const createNewList = async (payload: any) => await axios.post(`${baseUrl}/list2/create`, payload);
const getAllList = async (payload?: any) => await axios.post(`${baseUrl}/list2/summary`, payload || {});
const getSingleListDetail = async (payload: any) => await axios.post(`${baseUrl}/list2/show`, payload);
const getSingleListDetailCursor = async (payload: any) => await axios.post(`${baseUrl}/list2/show-cursor`, payload);
const exportList = async (payload: any) => await axios.post(`${baseUrl}/list2/export`, payload);
const deleteAList = async (listname: any) => await axios.delete(`${baseUrl}/list2/${listname}`);
const renameAList = async (payload: any) => await axios.post(`${baseUrl}/list2/rename`, payload);

const addSubscriber = async (payload: any) => await axios.post(`${baseUrl.replace('/api', '/auth')}/ext/login`, payload);

// --- BYPASS DELETED ROUTES (Frontend handles this logic now) ---
// const getListRevealEstimate = async () => ({ data: { phoneCredits: 0, emailCredits: 0, phoneCount: 0, emailCount: 0 } });
// const revealAllFromList = async () => ({ data: { error: true, message: "Use bulkReveal" } });
const getListRevealEstimate = async (payload: any) => await axios.post(`${baseUrl}/list2/reveal-estimate`, payload);
const revealAllFromList = async (payload: any) => await axios.post(`${baseUrl}/list2/reveal-all`, payload);

export {
  getAllData, searchOption, searchOptionDesignation, getAllList, getSingleListDetail,
  getSingleListDetailCursor, getListRevealEstimate, revealAllFromList, addProfilesToList,
  addByFilterToList, getDataPhoneAndEmail, getLinkedInUrl, searchLinkedInProfile,
  createNewList, deleteAList, renameAList, addSubscriber,exportList,
};