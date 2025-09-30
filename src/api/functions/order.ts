import { orderPayload } from "../../functions";
import { IOrder } from "../../types";
import axios from "axios";

const AUTH = { Authorization: "Bearer d9009c91bf25fea1dd73acbc9e0cb227dcde7880" }

export const createCustomer = async (name: string, phone: string) => {
    const payload = {
        name, phone,
        tags: ["Мобильное приложение"]
    }

    return await axios.post("https://api.moysklad.ru/api/remap/1.2/entity/counterparty", payload, {
        headers: AUTH
    })
};

export const getCustomer = async (phone: string) => {
    const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/counterparty?filter=phone=${phone}`, {
        headers: AUTH
    })

    return response.data
};

export const createOrder = async (data: IOrder) => {
    try {
        const payload = orderPayload(data)

        return await axios.post("https://api.moysklad.ru/api/remap/1.2/entity/customerorder", payload, {
            headers: AUTH
        })
    } catch (error) {
        console.log(error)
    }
};

export const getOrders = async (customerId: string) => {
    const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/customerorder?filter=agent=https://api.moysklad.ru/api/remap/1.2/entity/customentity/${customerId}`, {
        headers: AUTH
    })

    return response.data.rows
};

export const getDataFromURL = async (url: string) => {
    return await axios.get(url, {
        headers: AUTH
    })
}