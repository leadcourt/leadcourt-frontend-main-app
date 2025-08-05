import axios from "axios";
import { toast } from "react-toastify";

const baseUrl = import.meta.env.VITE_BE_URL + '/collaboration';

// const collab_baseUrl = "http://localhost:3000/api/collaboration";
// const baseUrl = 'https://dev.kyoto-creative.online/api/collaboration'

const collaboration_getAllData_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/filter`, payload);
};

const collaboration_searchOption_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/filter/search-options`, payload);
};

const collaboration_searchOptionDesignation_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/filter/designations`, payload);
};

const collaboration_getDataPhoneAndEmail_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/filter/row-access`, payload);
};

const collaboration_getLinkedInUrl_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/filter/linkedin`, payload);
};

const collaboration_getAllList_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/list/summary`, payload);
};

const collaboration_getSingleListDetail_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/list/show`, payload);
};

const collaboration_deleteAList_api = async (listname: any) => {
    return await axios.delete(`${baseUrl}/list/${listname}`)
}

const collaboration_renameAList_api = async (payload: any) => {
    return await axios.post(`${baseUrl}/list/rename`, payload)
}


const collaboration_addProfilesToList_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/list/store`, payload);
};

const collaboration_createNewList_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/list/create`, payload);
};

const collaboration_exportList_api = async (payload: any) => {
  return await axios.post( `${baseUrl}/list/export`, payload);
};

// ================= CREDITS ======================

// {headers: { "x-collab-url": `${baseUrl}/credits/total` },}
const collaboration_getCreditBalance_api = async () => {
  return await axios.get(baseUrl + "/credits/total",);
};

//================== PHONE ================================


const collaboration_showPhoneAndEmail_api = async (type: string, row: any, user: any ) => {
  const payload = {
    row_ids: [...row],
    type: type,
    userId: user?.id,
  };


  try {
    const res = await collaboration_getDataPhoneAndEmail_api(payload)
 
    return res

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
  collaboration_addProfilesToList_api,
  collaboration_createNewList_api,
  collaboration_exportList_api,
  collaboration_deleteAList_api,
  collaboration_renameAList_api,
  collaboration_getCreditBalance_api,
  collaboration_showPhoneAndEmail_api,
};
