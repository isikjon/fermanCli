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

export const checkPromoCode = async (code: string) => {
    try {
        console.log('🎟️ [API checkPromoCode] Checking promo code:', code)
        
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
            
            console.log('✅ [API checkPromoCode] Promo code found:', { 
                id: promo.id, 
                name: promo.name,
                discount: discountValue, 
                isActive 
            })
            
            return {
                valid: isActive && discountValue > 0,
                discount: discountValue,
                id: promo.id
            }
        }
        
        console.log('❌ [API checkPromoCode] Promo code not found')
        return { valid: false, discount: 0, id: null }
    } catch (error: any) {
        console.log('❌ [API checkPromoCode] ERROR:', error)
        if (error?.response) {
            console.log('❌ [API checkPromoCode] ERROR Response:', error.response.data)
        }
        return { valid: false, discount: 0, id: null }
    }
}