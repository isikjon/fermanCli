import axios from "axios"

export async function sendCode(phone: string, message: string) {
    return await axios.get(`https://sms.ru/sms/send`, {
        params: {
            api_id: '8EC86059-F03F-AE01-8A33-3F8443B51BC4',
            to: phone,
            msg: message,
            json: 1,
        },
    })
}