import axios from 'axios';

const baseUrl = import.meta.env.VITE_BE_URL
// const baseUrl='https://kyoto-creative.online/'

const makePayment = async (payload: any) => {
    return await axios.post(`${baseUrl}/phonepe/payment`, payload)
}

const makeSabpaisaPayment = async (payload: any) => {
    return await axios.post(`${baseUrl}/sabpaisa/payments`, payload)
}
const postSabpaisaEncData = async ( url: string, payload: any) => {
    return await axios.post(url, payload)
}
export {
    makePayment,
    makeSabpaisaPayment,
    postSabpaisaEncData,
}