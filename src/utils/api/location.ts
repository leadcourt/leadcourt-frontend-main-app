import axios from 'axios';

const baseUrl = import.meta.env.VITE_BE_URL

const getLocation = async () => {
    try {
        const response = await axios.get<string>('https://ipapi.co/country/', {
            timeout: 2500,
        });
        const country = String(response.data || '').trim().toUpperCase();

        if (/^[A-Z]{2}$/.test(country)) {
            return {
                data: {
                    country,
                    source: 'browser-public-ip-ipapi',
                },
            };
        }
    } catch (error) {
        console.warn('Browser ipapi lookup failed, trying backup API.', error);
    }

    try {
        const responseIs = await axios.get<{ country: string }>('https://api.country.is', {
            timeout: 2500,
        });
        const countryIs = String(responseIs?.data?.country || '').trim().toUpperCase();

        if (/^[A-Z]{2}$/.test(countryIs)) {
            return {
                data: {
                    country: countryIs,
                    source: 'browser-public-ip-country-is',
                },
            };
        }
    } catch (error) {
        console.warn('Browser backup IP lookup failed, using backend geo lookup.', error);
    }

    return await axios.get(`${baseUrl}/location/get-country`)
}

export {
    getLocation,
}
