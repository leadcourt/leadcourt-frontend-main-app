import axios from "axios";

const baseUrl = import.meta.env.VITE_BE_URL

const getAllData = async (payload: any) => {
    return await axios.post(`${baseUrl}/filter`, payload)
}

const searchOption = async (payload: any) => {
    return await axios.post(`${baseUrl}/filter/search-options`, payload)
}

const searchOptionDesignation = async (payload: any) => {
    return await axios.post(`${baseUrl}/filter/designations`, payload)
}

const getDataPhoneAndEmail = async (payload: any) => {
    return await axios.post(`${baseUrl}/filter/row-access`, payload)
}

const getLinkedInUrl = async (payload: any) => {
    return await axios.post(`${baseUrl}/filter/linkedin`, payload)
}

const searchLinkedInProfile = async (payload: any) => {
    return await axios.post(`${baseUrl}/filter/linkedin-search`, payload)
}

const addProfilesToList = async (payload: any) => {
    return await axios.post(`${baseUrl}/list/store`, payload)
}

const createNewList = async (payload: any) => {
    return await axios.post(`${baseUrl}/list/create`, payload)
}

const getAllList = async (payload: any) => {
    return await axios.post(`${baseUrl}/list/summary`, payload)
}

const getSingleListDetail = async (payload: any) => {
    return await axios.post(`${baseUrl}/list/show`, payload)
}

const deleteAList = async (listname: any) => {
    return await axios.delete(`${baseUrl}/list/${listname}`)
}


const renameAList = async (payload: any) => {
    return await axios.post(`${baseUrl}/list/rename`, payload)
}

const exportList = async (payload: any) => {
    return await axios.post(`${baseUrl}/list/export`, payload)
}
 
// newletter on sign-up
const addSubscriber = async (payload: any) => {
    return await axios.post(`${baseUrl}/add-subscriber`, payload)
}

 

export {
    getAllData,
    searchOption,
    searchOptionDesignation,
    getAllList,
    getSingleListDetail,
    addProfilesToList,
    getDataPhoneAndEmail,
    getLinkedInUrl,
    searchLinkedInProfile,
    createNewList,
    deleteAList,
    renameAList,
    exportList,

    addSubscriber,
}

