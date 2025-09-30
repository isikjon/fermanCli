import api from '../../api'
import { State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import useAuthStore from '../auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useDeliveryStore from '../delivery'
import { calculateDeliveryPrice, getZoneForLocation } from '../../functions'
import useCartStore from '../cart'

const useBonusStore = create<State>()(devtools((set, get) => ({
    bonuses: 0,

    getBonuses: async () => {
        try {
            const { userData } = useAuthStore.getState()
            const storageUserData = JSON.parse(await AsyncStorage.getItem("userData") as string)
            const phoneNumber = userData.phoneNumber !== "" ? userData.phoneNumber : storageUserData.phoneNumber

            const response = await api.bonus.getClient(phoneNumber)
            // console.log(response.data)
            set({ bonuses: response.data.balance })
        } catch (error) {
            console.log(error)
        }
    },
    changeBonus: async () => { },
    calculateBonus: (bonusType: number, express: boolean) => {
        const { bonuses } = get()
        const { calculateAmount } = useCartStore.getState()

        const totalOrderPrice = calculateAmount()
        const bonusAmount = bonusType === 0 ? totalOrderPrice * 0.30 : totalOrderPrice * 0.02
        const totalBonus = bonuses < bonusAmount ? bonuses : bonusAmount

        return totalBonus.toFixed()
    }
})))

export default useBonusStore