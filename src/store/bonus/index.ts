import api from '../../api'
import { State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useBonusStore = create<State>()(devtools((set, get) => ({
    bonuses: 0,

    getBonuses: async () => {
        try {
            const { default: useAuthStore } = await import('../auth')
            const { userData } = useAuthStore.getState()
            console.log('📱 [getBonuses] userData from store:', userData)
            
            const storageUserDataStr = await AsyncStorage.getItem("userData")
            console.log('💾 [getBonuses] userData from storage (raw):', storageUserDataStr)
            
            const storageUserData = storageUserDataStr ? JSON.parse(storageUserDataStr) : null
            console.log('💾 [getBonuses] userData from storage (parsed):', storageUserData)
            
            const phoneNumber = userData.phoneNumber !== "" ? userData.phoneNumber : storageUserData?.phoneNumber

            console.log('📞 [getBonuses] Final phoneNumber:', phoneNumber)
            
            if (!phoneNumber) {
                console.log('⚠️ [getBonuses] No phone number found, setting bonuses to 0')
                set({ bonuses: 0 })
                return
            }

            const response = await api.bonus.getClient(phoneNumber)
            console.log('💰 [getBonuses] Full API response:', JSON.stringify(response.data, null, 2))
            
            if (response.data) {
                console.log('🔍 [getBonuses] Response keys:', Object.keys(response.data))
                console.log('🔍 [getBonuses] Balance type:', typeof response.data.balance)
                console.log('🔍 [getBonuses] Balance value:', response.data.balance)
                
                if (typeof response.data.balance === 'number') {
                    set({ bonuses: response.data.balance })
                    console.log('✅ [getBonuses] Bonuses set to:', response.data.balance)
                } else if (response.data.balance !== undefined) {
                    const bonusValue = parseFloat(response.data.balance) || 0
                    set({ bonuses: bonusValue })
                    console.log('✅ [getBonuses] Bonuses converted and set to:', bonusValue)
                } else {
                    console.log('⚠️ [getBonuses] No balance field in response')
                    set({ bonuses: 0 })
                }
            } else {
                console.log('⚠️ [getBonuses] Empty response data')
                set({ bonuses: 0 })
            }
        } catch (error: any) {
            console.log('❌ [getBonuses] ERROR:', error)
            console.log('❌ [getBonuses] ERROR message:', error?.message)
            console.log('❌ [getBonuses] ERROR response:', error?.response?.data)
            set({ bonuses: 0 })
        }
    },
    changeBonus: async () => { },
    calculateBonus: async (bonusType: number, express: boolean) => {
        const { bonuses } = get()
        const { default: useCartStore } = await import('../cart')
        const { calculateAmount } = useCartStore.getState()

        const totalOrderPrice = calculateAmount()
        const bonusAmount = bonusType === 0 ? totalOrderPrice * 0.30 : totalOrderPrice * 0.02
        const totalBonus = bonuses < bonusAmount ? bonuses : bonusAmount

        return Math.round(totalBonus)
    }
})))

export default useBonusStore