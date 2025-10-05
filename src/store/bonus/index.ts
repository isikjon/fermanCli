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
            const phoneNumber = userData.phoneNumber !== "" ? userData.phoneNumber : storageUserData?.phoneNumber

            console.log('📞 [getBonuses] phoneNumber:', phoneNumber)
            
            if (!phoneNumber) {
                console.log('⚠️ [getBonuses] No phone number found')
                return
            }

            const response = await api.bonus.getClient(phoneNumber)
            console.log('💰 [getBonuses] response:', response.data)
            
            if (response.data && typeof response.data.balance === 'number') {
                set({ bonuses: response.data.balance })
                console.log('✅ [getBonuses] Bonuses loaded:', response.data.balance)
            } else {
                console.log('⚠️ [getBonuses] Invalid response format:', response.data)
                set({ bonuses: 0 })
            }
        } catch (error) {
            console.log('❌ [getBonuses] ERROR:', error)
            set({ bonuses: 0 })
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