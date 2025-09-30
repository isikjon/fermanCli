import { OrderItemType, OrderType } from "@/types"

export interface State {
    afterAuth: boolean,
    ordersList: OrderType[],
    openedOrderId: string,
    openedOrderPositions: OrderItemType[]
    deliveryTime: string,

    changeDeliveryTime: (value: string) => void,
    changeOpenedOrderId: (value: string) => void,
    changeAfterAuth: (value: boolean) => void
    getCustomer: () => Promise<string>
    createOrder: (bonusType: number, express: boolean, comment?: string) => Promise<void>
    getOrderList: () => Promise<string>
    getPositions: () => Promise<OrderItemType[]>
}