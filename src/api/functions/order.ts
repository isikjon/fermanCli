import { orderPayload } from "../../functions";
import { IOrder } from "../../types";
import axios from "axios";
import { MOYSKLAD_TOKEN } from "./products";

const AUTH = { Authorization: MOYSKLAD_TOKEN }

export const createCustomer = async (name: string, phone: string) => {
    console.log('👤 [API createCustomer] Creating customer:', { name, phone })
    try {
        const payload = {
            name, phone,
            tags: ["Мобильное приложение"]
        }

        const response = await axios.post("https://api.moysklad.ru/api/remap/1.2/entity/counterparty", payload, {
            headers: AUTH
        })
        console.log('✅ [API createCustomer] SUCCESS:', response.data)
        return response
    } catch (error: any) {
        console.log('❌ [API createCustomer] ERROR:', error)
        if (error?.response) {
            console.log('❌ [API createCustomer] ERROR Response:', error.response.data)
        }
        throw error
    }
};

export const getCustomer = async (phone: string) => {
    console.log('🔍 [API getCustomer] Searching for phone:', phone)
    try {
        const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/counterparty?filter=phone=${phone}`, {
            headers: AUTH
        })
        console.log('✅ [API getCustomer] Response:', response.data)
        return response.data
    } catch (error: any) {
        console.log('❌ [API getCustomer] ERROR:', error)
        if (error?.response) {
            console.log('❌ [API getCustomer] ERROR Response:', error.response.data)
        }
        throw error
    }
};

export const createOrder = async (data: IOrder) => {
    try {
        const payload = orderPayload(data)
        console.log('🌐 [API createOrder] Payload:', JSON.stringify(payload, null, 2))
        console.log('📋 [API createOrder] Project:', payload.project)
        console.log('🏷️ [API createOrder] Tags:', payload.tags)

        const response = await axios.post("https://api.moysklad.ru/api/remap/1.2/entity/customerorder", payload, {
            headers: AUTH
        })

        console.log('✅ [API createOrder] SUCCESS:', response.data)
        console.log('📋 [API createOrder] Created order name:', response.data.name)
        console.log('🏷️ [API createOrder] Created order tags:', response.data.tags)
        console.log('📋 [API createOrder] Created order project:', response.data.project)
        
        return response
    } catch (error: any) {
        console.log('❌ [API createOrder] ERROR:', error)
        if (error?.response) {
            console.log('❌ [API createOrder] ERROR Response:', error.response.data)
            console.log('❌ [API createOrder] ERROR Status:', error.response.status)
        }
        throw error
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