import { orderPayload } from "../../functions";
import { IOrder } from "../../types";
import axios from "axios";
import { MOYSKLAD_TOKEN } from "./products";

const AUTH = { Authorization: MOYSKLAD_TOKEN }

export const createCustomer = async (name: string, phone: string) => {
    const payload = {
        name, phone,
        tags: ["Мобильное приложение"]
    }

    const response = await axios.post("https://api.moysklad.ru/api/remap/1.2/entity/counterparty", payload, {
        headers: AUTH
    })
    return response
};

export const getCustomer = async (phone: string) => {
    const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/counterparty?filter=phone=${phone}`, {
        headers: AUTH
    })
    return response.data
};

export const createOrder = async (data: IOrder) => {
    const payload = orderPayload(data)

    const response = await axios.post("https://api.moysklad.ru/api/remap/1.2/entity/customerorder", payload, {
        headers: AUTH
    })
    
    return response
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

export const checkPromoCode = async (code: string) => {
    try {
        const searchCode = code.trim().toUpperCase()
        const response = await axios.get(
            `https://api.moysklad.ru/api/remap/1.2/entity/customentity?filter=name~${encodeURIComponent(searchCode)}`,
            { headers: AUTH }
        )
        
        if (response.data.rows && response.data.rows.length > 0) {
            const promo = response.data.rows.find((p: any) => 
                p.name?.toUpperCase() === searchCode
            ) || response.data.rows[0]
            
            const discountAttr = promo.attributes?.find((attr: any) => 
                attr.name === 'Скидка' || attr.name === 'Размер скидки' || attr.name === 'Discount'
            )
            const discount = discountAttr?.value || promo.discount || 0
            
            const activeAttr = promo.attributes?.find((attr: any) => 
                attr.name === 'Активен' || attr.name === 'Активный' || attr.name === 'Active'
            )
            const isActive = activeAttr ? activeAttr.value !== false : true
            
            const discountValue = typeof discount === 'number' ? discount : parseFloat(String(discount)) || 0
            
            return {
                valid: isActive && discountValue > 0,
                discount: discountValue,
                id: promo.id
            }
        }
        
        return { valid: false, discount: 0, id: null }
    } catch (error: any) {
        return { valid: false, discount: 0, id: null }
    }
}
