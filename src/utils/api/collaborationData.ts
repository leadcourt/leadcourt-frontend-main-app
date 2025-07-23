import axios from "axios";
import { toast } from "react-toastify";

const baseUrl = import.meta.env.VITE_BE_URL;

const collab_baseUrl = "http://localhost:3000/api/teams/dashboard/dashboard";

const collaboration_getAllData_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/filter` 
    },
  });
};

const collaboration_searchOption_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/filter/search-options` 
    },
  });
};

const collaboration_searchOptionDesignation_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/filter/designations` 
    },
  });
};

const collaboration_getDataPhoneAndEmail_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/filter/row-access` 
    },
  });
};

const collaboration_getLinkedInUrl_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/filter/linkedin` 
    },
  });
};

const collaboration_getAllList_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/list/summary`
    },
  });
};

const collaboration_getSingleListDetail_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/list/show` 
    },
  });
};

const collaboration_addProfilesToList_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/list/store` 
    },
  });
};

const collaboration_createNewList_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/list/create` 
    },
  });
};

const collaboration_exportList_api = async (payload: any) => {
  return await axios.post(collab_baseUrl, payload, {
    headers: { 
        "x-collab-method": `post`,
        "x-collab-url": `${baseUrl}/list/export` 
    },
  });
};

// ================= CREDITS ======================

const collaboration_getCreditBalance_api = async () => {
  return await axios.get(collab_baseUrl, {
    headers: { "x-collab-url": `${baseUrl}/credits/total` },
  });
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

  collaboration_getCreditBalance_api,
  collaboration_showPhoneAndEmail_api,
};
