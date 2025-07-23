import axios from "axios";

const baseUrl = import.meta.env.VITE_BE_URL

const getCreditBalance = async () => {
    return await axios.get(`${baseUrl}/credits/total`, )
}
// const getColabCreditBalance = async () => {
//     return await axios.get(`${baseUrl}/collaborator/:collaboratorId/credits/total`, )
// }

const addCredit = async (payload: any) => {
    return await axios.post(`${baseUrl}/credits/add`, payload)
}

const getAllTransactions = async (payload: any) => {
    return await axios.get(`${baseUrl}/transactions?page=${payload}&limit=5`)
}


export {
    getCreditBalance,
    addCredit,
    getAllTransactions,
}