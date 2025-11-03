import { CartType } from '../../types';
import { State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice } from '../../functions';
import { roundWeightAmount } from '../../utils/roundAmount';

const useCartStore = create<State>()(devtools((set, get) => ({
    cartList: [],

    calculateAmount: () => {
        const cartList = get().cartList;
        const total = cartList.reduce((sum, item) => {
            if (item.isWeighted) {
                return sum + (item.price * (item.weight || 0.1));
            } else {
                return sum + (item.amount * item.price);
            }
        }, 0);
        return parseFloat(formatPrice(total));
    },

    addItemToCart: async (item: CartType) => {
        console.log('🛒 [CART] addItemToCart called:', {
            id: item.id,
            name: item.name?.substring(0, 30) || 'Unknown',
            amount: item.amount,
            weight: item.weight,
            isWeighted: item.isWeighted
        });

        const cart = get().cartList;
        const existing = cart.find(p => p.id === item.id);

        console.log('🛒 [CART] Existing in cart:', existing ? {
            id: existing.id,
            amount: existing.amount,
            weight: existing.weight
        } : 'NOT FOUND');

        let updatedCart;

        if (existing) {
            updatedCart = cart.map(p => {
                if (p.id === item.id) {
                    if (item.isWeighted && item.weight !== undefined && p.weight !== undefined) {
                        const newWeight = roundWeightAmount(p.weight + item.weight);
                        console.log('🛒 [CART] Adding weight:', p.weight, '+', item.weight, '=', newWeight);
                        return { ...p, weight: newWeight }
                    } else {
                        const newAmount = p.amount + item.amount;
                        console.log('🛒 [CART] Adding amount:', p.amount, '+', item.amount, '=', newAmount);
                        return { ...p, amount: newAmount }
                    }
                }
                return p
            });
        } else {
            console.log('🛒 [CART] Adding new item to cart');
            updatedCart = [...cart, item];
        }

        console.log('🛒 [CART] Updated cart length:', updatedCart.length);
        set({ cartList: updatedCart });
        await AsyncStorage.setItem("cartData", JSON.stringify(updatedCart));
    },
    setItemInCart: async (item: CartType) => {
        console.log('🛒 [CART] setItemInCart called:', {
            id: item.id,
            name: item.name?.substring(0, 30) || 'Unknown',
            amount: item.amount,
            weight: item.weight,
            isWeighted: item.isWeighted
        });

        const cart = get().cartList;
        const existing = cart.find(p => p.id === item.id);

        console.log('🛒 [CART] Existing in cart:', existing ? {
            id: existing.id,
            amount: existing.amount,
            weight: existing.weight
        } : 'NOT FOUND');

        let updatedCart;

        if (existing) {
            console.log('🛒 [CART] REPLACING existing item');
            updatedCart = cart.map(p => {
                if (p.id === item.id) {
                    console.log('🛒 [CART] Old:', { amount: p.amount, weight: p.weight });
                    console.log('🛒 [CART] New:', { amount: item.amount, weight: item.weight });
                    return { ...p, ...item }
                }
                return p
            });
        } else {
            console.log('🛒 [CART] Adding NEW item to cart');
            updatedCart = [...cart, item];
        }

        console.log('🛒 [CART] Final cart length:', updatedCart.length);
        set({ cartList: updatedCart });
        await AsyncStorage.setItem("cartData", JSON.stringify(updatedCart));
    },
    removeItemFromCart: async (id: string) => {
        console.log('🗑️ [CART] removeItemFromCart called:', { id });

        const cart = get().cartList;
        const itemToRemove = cart.find(item => item.id === id);
        
        if (itemToRemove) {
            console.log('🗑️ [CART] Removing item:', {
                name: itemToRemove.name?.substring(0, 30) || 'Unknown',
                amount: itemToRemove.amount,
                weight: itemToRemove.weight
            });
        }

        const filteredData = cart.filter(item => item.id !== id);
        console.log('🗑️ [CART] Cart length after removal:', filteredData.length);

        set({ cartList: filteredData });
        await AsyncStorage.setItem("cartData", JSON.stringify(filteredData));
    },
    getCartList: async () => {
        console.log('📥 [CART] Loading cart from AsyncStorage...');
        const data = await AsyncStorage.getItem("cartData");
        const parsedData = data ? JSON.parse(data) as CartType[] : [];

        console.log('📥 [CART] Loaded cart:', {
            count: parsedData.length,
            items: parsedData.map(item => ({
                id: item.id,
                name: item.name?.substring(0, 30) || 'Unknown',
                amount: item.amount,
                weight: item.weight
            }))
        });

        set({ cartList: parsedData });
    },
    changeCartItem: async (id: string, updatedItem: CartType) => {
        console.log('✏️ [CART] changeCartItem called:', {
            id,
            name: updatedItem.name?.substring(0, 30) || 'Unknown',
            newAmount: updatedItem.amount,
            newWeight: updatedItem.weight
        });

        const cart = get().cartList;
        const oldItem = cart.find(item => item.id === id);

        if (oldItem) {
            console.log('✏️ [CART] Old values:', {
                amount: oldItem.amount,
                weight: oldItem.weight
            });
        }

        const updatedCart = cart.map(item =>
            item.id === id ? updatedItem : item
        );

        console.log('✏️ [CART] Cart updated');
        set({ cartList: updatedCart });
        await AsyncStorage.setItem("cartData", JSON.stringify(updatedCart));
    },
    clearCart: async () => {
        set({ cartList: [] })
        await AsyncStorage.setItem("cartData", JSON.stringify([]));
    }
})))

export default useCartStore