import { CartType } from '../../types';
import { State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice } from '../../functions';

const useCartStore = create<State>()(devtools((set, get) => ({
    cartList: [],

    calculateAmount: () => {
        const cartList = get().cartList;
        const total = cartList.reduce((sum, item) => sum + item.amount * (item.isWeighted ? item.price * (item.weight || 0.1) : item.price), 0);
        return parseFloat(formatPrice(total));
    },

    addItemToCart: async (item: CartType) => {
        const cart = get().cartList;

        const existing = cart.find(p => p.id === item.id);
        let updatedCart;

        if (existing) {
            updatedCart = cart.map(p => {
                if (p.id === item.id) {
                    if (item.isWeighted && item.weight !== undefined && p.weight !== undefined) {
                        return { ...p, weight: p.weight + item.weight }
                    } else {
                        return { ...p, amount: p.amount + item.amount }
                    }
                }
                return p
            });
        } else {
            updatedCart = [...cart, item];
        }

        set({ cartList: updatedCart });
        await AsyncStorage.setItem("cartData", JSON.stringify(updatedCart));
    },
    removeItemFromCart: async (id: string) => {
        const cart = get().cartList;
        const filteredData = cart.filter(item => item.id !== id);

        set({ cartList: filteredData });
        await AsyncStorage.setItem("cartData", JSON.stringify(filteredData));
    },
    getCartList: async () => {
        const data = await AsyncStorage.getItem("cartData");
        const parsedData = data ? JSON.parse(data) as CartType[] : [];

        set({ cartList: parsedData });
    },
    changeCartItem: async (id: string, updatedItem: CartType) => {
        const cart = get().cartList;
        const updatedCart = cart.map(item =>
            item.id === id ? updatedItem : item
        );

        set({ cartList: updatedCart });
        await AsyncStorage.setItem("cartData", JSON.stringify(updatedCart));
    },
    clearCart: async () => {
        set({ cartList: [] })
        await AsyncStorage.setItem("cartData", JSON.stringify([]));
    }
})))

export default useCartStore