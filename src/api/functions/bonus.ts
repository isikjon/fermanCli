import axios from "axios"

const apiKey = "666c13d171b01d80b04e590794a968b7"

export async function registerUser(phone: string, uuid: string) {
    return await axios.post(`https://bonus.kilbil.ru/load/addclient?h=${apiKey}`, {
        phone: phone,
        first_name: uuid
    })
}

export async function getClient(phone: string) {
    return await axios.post(`https://bonus.kilbil.ru/load/searchclient?h=${apiKey}`, {
        search_mode: 0,
        search_value: phone,
    })
}

export async function bonusIn(client_id: string, bonus_in: number) {
    return await axios.post(`https://bonus.kilbil.ru/load/manualadd?h=${apiKey}`, {
        client_id, bonus_in
    })
}

export async function bonusOut(client_id: string, bonus_out: number) {
    return await axios.post(`https://bonus.kilbil.ru/load/manualadd?h=${apiKey}`, {
        client_id, bonus_out
    })
}