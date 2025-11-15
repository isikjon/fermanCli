import { State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { calculateDeliveryPrice, getZoneForLocation, formatPrice } from '../../functions'
import api from '../../api'
import { CartType, IOrder, OrderItemType } from '../../types'
import { selfPickupList } from '../../constants'
import { ordersDTO } from '../../functions/dtos'
import { navigate } from '../../components/Navigation'
import NotificationService from '../../services/NotificationService'
import { resolveStoreQueueFromDelivery } from '../../utils/storePriority'

const calculateItemRequiredAmount = (item: CartType) => {
    if (item.isWeighted) {
        return item.weight ?? item.amount
    }
    return item.amount
}

const selectStoreForCart = (items: CartType[], storeQueue: string[]): string | null => {
    if (!items.length) {
        return storeQueue[0] || null
    }

    const checkedStores = new Set<string>()

    const canFulfillFromStore = (storeId: string) => {
        const canFulfill = items.every(item => {
            const required = calculateItemRequiredAmount(item)
            const stockMap = item.stockByStore

            if (stockMap && Object.prototype.hasOwnProperty.call(stockMap, storeId)) {
                return stockMap[storeId] >= required
            }

            if (item.storeId === storeId && item.stock !== undefined) {
                return item.stock >= required
            }

            return false
        })

        if (canFulfill) {
            return true
        }

        checkedStores.add(storeId)
        return false
    }

    for (const storeId of storeQueue) {
        if (canFulfillFromStore(storeId)) {
            return storeId
        }
    }

    const candidatePool = new Set<string>()
    items.forEach(item => {
        if (item.stockByStore) {
            Object.keys(item.stockByStore).forEach(id => candidatePool.add(id))
        }
        if (item.storeId) {
            candidatePool.add(item.storeId)
        }
    })

    for (const storeId of candidatePool) {
        if (!checkedStores.has(storeId) && canFulfillFromStore(storeId)) {
            return storeId
        }
    }

    const fallbackStore = items.find(item => item.storeId)?.storeId
    if (fallbackStore && !checkedStores.has(fallbackStore) && canFulfillFromStore(fallbackStore)) {
        return fallbackStore
    }

    const fallbackQueueStore = storeQueue.find(storeId => !checkedStores.has(storeId))
    if (fallbackQueueStore && canFulfillFromStore(fallbackQueueStore)) {
        return fallbackQueueStore
    }

    return null
}

const useCheckoutStore = create<State>()(devtools((set, get) => ({
    afterAuth: false,
    ordersList: [],
    openedOrderId: "",
    openedOrderPositions: [],
    deliveryTime: "",
    isCreatingOrder: false,

    changeDeliveryTime: (value: string) => set({ deliveryTime: value }),
    changeAfterAuth: (value: boolean) => set({ afterAuth: value }),
    changeOpenedOrderId: (value: string) => set({ openedOrderId: value }),

    getCustomer: async () => {
        try {
            const { default: useAuthStore } = await import('../auth')
            const { default: useProfileStore } = await import('../profile')
            
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
        try {
            set({ isCreatingOrder: true })
            console.log('🔄 [createOrder] Loading started...')
            
            const { default: useNotificationStore } = await import('../notification')
            const { default: useCartStore } = await import('../cart')
            const { default: useDeliveryStore } = await import('../delivery')
            const { default: useBonusStore } = await import('../bonus')
            
            const { setMessage } = useNotificationStore.getState()

            console.log('🛒 [createOrder] START')
            const { getCustomer, deliveryTime } = get()
            const { clearCart, cartList, calculateAmount } = useCartStore.getState()
            const { addresses, deliveryData } = useDeliveryStore.getState()
            const { calculateBonus } = useBonusStore.getState()

            const customerId = await getCustomer()
            console.log('👤 [createOrder] customerId:', customerId)

            const address = addresses.find((_, index) => index === deliveryData?.id)
            const zone = address && getZoneForLocation(address?.lat, address?.lng)
            const storeQueue = resolveStoreQueueFromDelivery(deliveryData, addresses)
            const storeId = selectStoreForCart(cartList, storeQueue)
            const pickupCityIndex = deliveryData?.city ?? 0
            const pickupPoint = deliveryData?.type === 1
                ? selfPickupList[pickupCityIndex]?.list?.[deliveryData?.id || 0]
                : undefined
            const bonusAmount = await calculateBonus(bonusType, express)
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
                console.log('❌ [createOrder] No storeId for delivery', { storeQueue })
                setMessage("Не удалось подобрать склад для заказа", "error")
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
                        : pickupPoint?.address || "",
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
            
            set({ isCreatingOrder: false })
            console.log('✅ [createOrder] Loading completed')
            
            navigate('orderSuccess', { orderAmount: totalAmount, orderNumber: orderNumber })

        } catch (error: any) {
            console.log('❌ [createOrder] ERROR:', error)
            if (error?.response) {
                console.log('❌ [createOrder] ERROR Response:', error.response.data)
            }
            
            set({ isCreatingOrder: false })
            console.log('❌ [createOrder] Loading stopped (error)')
            
            const { default: useNotificationStore } = await import('../notification')
            const { setMessage } = useNotificationStore.getState()
            setMessage("Ошибка при создании заказа", "error")
        }
    },

    getOrderList: async () => {
        const { default: useNotificationStore } = await import('../notification')
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
