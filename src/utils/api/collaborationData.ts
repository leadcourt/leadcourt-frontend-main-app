import axios from "axios";
import { toast } from "react-toastify";

const baseUrl = import.meta.env.VITE_BE_URL + "/collaboration";

const collaboration_getAllData_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter`, payload);
};

const collaboration_searchOption_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/search-options`, payload);
};

const collaboration_searchOptionDesignation_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/designations`, payload);
};

const collaboration_getDataPhoneAndEmail_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/row-access`, payload);
};

const collaboration_getLinkedInUrl_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/filter/linkedin`, payload);
};

// --- ALL /list2/ TYPOS FIXED TO /list/ BELOW ---

const collaboration_getAllList_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/summary`, payload);
};

const collaboration_getSingleListDetail_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/show`, payload);
};

const collaboration_showListCursor_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/show-cursor`, payload);
};

const collaboration_deleteAList_api = async (listname: any, projectId: any) => {
  const safe = encodeURIComponent(String(listname || "").trim());
  return await axios.delete(`${baseUrl}/list/${safe}?projectId=${projectId || ""}`);
};

const collaboration_renameAList_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/rename`, payload);
};

const collaboration_addProfilesToList_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/store`, payload);
};

const collaboration_createNewList_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/create`, payload);
};

const collaboration_exportList_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/export`, payload);
};

const collaboration_addByFilterToList_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/add-by-filter`, payload);
};

const collaboration_getListRevealEstimate_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/reveal-estimate`, payload);
};

const collaboration_revealAllFromList_api = async (payload: any) => {
  return await axios.post(`${baseUrl}/list/reveal-all`, payload);
};

// --------------------------------------------------

const collaboration_getCreditBalance_api = async () => {
  return await axios.get(baseUrl + "/credits/total");
};

const collaboration_showPhoneAndEmail_api = async (type: string, row: any, user: any) => {
  const payload = {
    row_ids: [...row],
    type,
    userId: user?.id,
  };

  try {
    const res = await collaboration_getDataPhoneAndEmail_api(payload);
    return res;
  } catch {
    toast.error("Error occured");
  }
};

export {
  collaboration_getAllData_api,
  collaboration_searchOption_api,
  collaboration_searchOptionDesignation_api,
  collaboration_getDataPhoneAndEmail_api,
  collaboration_getLinkedInUrl_api,
  collaboration_getAllList_api,
  collaboration_getSingleListDetail_api,
  collaboration_showListCursor_api,
  collaboration_addProfilesToList_api,
  collaboration_createNewList_api,
  collaboration_exportList_api,
  collaboration_deleteAList_api,
  collaboration_renameAList_api,
  collaboration_addByFilterToList_api,
  collaboration_getListRevealEstimate_api,
  collaboration_revealAllFromList_api,
  collaboration_getCreditBalance_api,
  collaboration_showPhoneAndEmail_api,
};