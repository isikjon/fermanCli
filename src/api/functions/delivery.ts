import axios from "axios";

export const getSugesstionAdreses = async (query: string) => {
    const API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';

    return await axios.post(API_URL, { 
        query,
        locations: [
            {
                "region": "Приморский"
            }
        ],
        locations_boost: [
            {
                "city": "Владивосток"
            }
        ],
        count: 10
    }, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Token 7c6d984de1dc2ded79b856e4589fa987e4a07a00`,
        },
    });
};