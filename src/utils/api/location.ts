import axios from 'axios';

const baseUrl = import.meta.env.VITE_BE_URL

const getLocation = async () => {
    return await axios.get(`${baseUrl}/location/get-country`)
}

export {
    getLocation,
}