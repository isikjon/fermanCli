import { State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import useNotificationStore from '../notification'
import useCartStore from '../cart'
import { calculateDeliveryPrice, getZoneForLocation, formatPrice } from '../../functions'
import useDeliveryStore from '../delivery'
import api from '../../api'
import { IOrder, OrderItemType } from '../../types'
import useBonusStore from '../bonus'
import useAuthStore from '../auth'
import useProfileStore from '../profile'
import { deliveryDataObj } from '../../constants/delivery'
import { selfPickupList } from '../../constants'
import { ordersDTO } from '../../functions/dtos'
import { navigate } from '../../components/Navigation'
import NotificationService from '../../services/NotificationService'

const useCheckoutStore = create<State>()(devtools((set, get) => ({
    afterAuth: false,
    ordersList: [],
    openedOrderId: "",
    openedOrderPositions: [],
    deliveryTime: "",

    changeDeliveryTime: (value: string) => set({ deliveryTime: value }),
    changeAfterAuth: (value: boolean) => set({ afterAuth: value }),
    changeOpenedOrderId: (value: string) => set({ openedOrderId: value }),

    getCustomer: async () => {
        try {
            const { userData } = useAuthStore.getState()
            const { formData } = useProfileStore.getState()

            console.log('📞 [getCustomer] phoneNumber:', userData.phoneNumber)
            const response = await api.order.getCustomer(userData.phoneNumber)
            console.log('👥 [getCustomer] Response size:', response.meta.size)

            if (response.meta.size !== 0) {
                console.log('✅ [getCustomer] Found existing customer:', response.rows[0].id)
                return response.rows[0].id
            } else {
                const userName = formData.fullName === "" ? userData.phoneNumber : formData.fullName
                console.log('➕ [getCustomer] Creating new customer:', userName)
                const newCustomer = await api.order.createCustomer(userName, userData.phoneNumber)
                console.log('✅ [getCustomer] New customer created:', newCustomer.data.id)
                return newCustomer.data.id
            }
        } catch (error: any) {
            console.log('❌ [getCustomer] ERROR:', error)
            if (error?.response) {
                console.log('❌ [getCustomer] ERROR Response:', error.response.data)
            }
            return undefined
        }
    },

    createOrder: async (bonusType: number, express: boolean, comment?: string) => {
        const { setMessage } = useNotificationStore.getState()

        try {
            console.log('🛒 [createOrder] START')
            const { getCustomer, deliveryTime } = get()
            const { clearCart, cartList, calculateAmount } = useCartStore.getState()
            const { addresses, deliveryData } = useDeliveryStore.getState()
            const { calculateBonus } = useBonusStore.getState()

            const customerId = await getCustomer()
            console.log('👤 [createOrder] customerId:', customerId)

            const address = addresses.find((_, index) => index === deliveryData?.id)
            const zone = address && getZoneForLocation(address?.lat, address?.lng)
            const storeId = deliveryData?.type === 0
                ? deliveryDataObj.zones.find(i => i.zone.name === zone?.description)?.store.id
                : selfPickupList[0].list[deliveryData?.id || 0].storeId
            const bonusAmount = calculateBonus(bonusType, express)
            const deliveryPrice = zone ? calculateDeliveryPrice(calculateAmount(), zone?.description, express) : 0
            const totalAmount = calculateAmount() + deliveryPrice - bonusAmount

            console.log('📦 [createOrder] totalAmount:', totalAmount, 'deliveryPrice:', deliveryPrice, 'bonusAmount:', bonusAmount)

            const items: OrderItemType[] = cartList.map(i => ({
                amount: Number((i.isWeighted && i.weight) ? (i.amount * i.weight).toFixed(1) : i.amount),
                price: Number(formatPrice(i.price)),
                productId: i.id
            }))
            const itemsWithDelivery = [...items, {
                amount: 1,
                price: deliveryPrice,
                productId: "bca82cda-cfaa-11ee-0a80-0d920004a1bb"
            }]

            if (!storeId) {
                console.log('❌ [createOrder] No storeId')
                setMessage("Вы не указали адрес доставки", "error")
                return
            }

            if (deliveryTime === "") {
                console.log('❌ [createOrder] No deliveryTime')
                setMessage(`Укажите время ${deliveryData?.type === 0 ? "доставки" : "самовывоза"}`, "error")
                return
            }

            const payload: IOrder = {
                bonuses: {
                    amount: bonusAmount,
                    type: bonusType
                },
                customerId: customerId,
                delivery: {
                    address: deliveryData?.type === 0
                        ? address?.value || ""
                        : selfPickupList[0].list[deliveryData?.id || 0].address,
                    time: deliveryTime,
                    type: deliveryData ? deliveryData?.type : 1
                },
                items: deliveryData?.type === 1 ? items : itemsWithDelivery,
                storeId: storeId,
                comment: comment || ""
            }

            console.log('📤 [createOrder] Sending to API:', JSON.stringify(payload, null, 2))
            const response = await api.order.createOrder(payload)
            console.log('✅ [createOrder] API Response:', response?.data)

            const orderNumber = response?.data?.name || 'Неизвестен'
            console.log('📋 [createOrder] Order number:', orderNumber)

            clearCart()
            
            await NotificationService.updateLastOrderDate()
            console.log('📅 Last order date updated')

            console.log('🧭 [createOrder] Navigating to orderSuccess with amount:', totalAmount, 'number:', orderNumber)
            navigate('orderSuccess', { orderAmount: totalAmount, orderNumber: orderNumber })

        } catch (error: any) {
            console.log('❌ [createOrder] ERROR:', error)
            if (error?.response) {
                console.log('❌ [createOrder] ERROR Response:', error.response.data)
            }
            setMessage("Ошибка при создании заказа", "error")
        }
    },

    getOrderList: async () => {
        const { setMessage } = useNotificationStore.getState()
        const { getCustomer } = get()
        const customerId = await getCustomer()

        if (customerId) {
            const response = await api.order.getOrders(customerId)
            const data = await ordersDTO(response)
            set({ ordersList: data })
        } else {
            setMessage("Ошибка при получении списка заказов", "error")
        }
    },

    getPositions: async () => {
        set({ openedOrderPositions: [] })

        const { ordersList, openedOrderId } = get()
        const activeOrder = ordersList.find(i => i.id === openedOrderId)

        if (activeOrder) {
            const response = await api.order.getDataFromURL(activeOrder.positions)
            const rows = response.data.rows || []

            const newArray = await Promise.all(
                rows.map(async (i: any) => {
                    const product = await api.order.getDataFromURL(i.assortment.meta.href)
                    const productId = product.data?.name || ""

                    return {
                        amount: i.quantity,
                        price: Number(i.price) / 100,
                        productId: productId
                    }
                })
            )

            set({ openedOrderPositions: newArray })
        }
    }
})))

export default useCheckoutStore
