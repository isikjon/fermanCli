import { CartType } from "../../types";

export interface State {
    cartList: CartType[]

    calculateAmount: () => number,
    addItemToCart: (item: CartType) => Promise<void>,
    removeItemFromCart: (id: string) => Promise<void>,
    getCartList: () => Promise<void>,
    changeCartItem: (id: string, updatedItem: CartType) => Promise<void>
    clearCart: () => void
}