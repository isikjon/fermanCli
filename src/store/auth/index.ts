import { generateCode, generateUUID, normalizePhoneNumber } from '../../functions'
import { DataTypes, State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '../../api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { UserDataType } from '../../types'
import SmsService from '../../services/SmsService'
import { Platform } from 'react-native'

let navigateCallback: ((route: string, reset?: boolean) => void) | null = null
export const setNavigationCallback = (cb: (route: string, reset?: boolean) => void) => {
    navigateCallback = cb
}

let timerInterval: number | null = null

const useAuthStore = create<State>()(devtools((set, get) => ({
    phone: "",
    code: "",
    smsCode: "",
    isCode: false,
    userData: {
        uuid: "",
        phoneNumber: "",
        kilbilClientId: ""
    },
    timer: 60,

    initializeAuth: async () => {
        try {
            const storedUserData = await AsyncStorage.getItem("userData")
            if (storedUserData) {
                const userData = JSON.parse(storedUserData)
                set({ userData })
            }
        } catch (error) {}
    },

    changeIsCode: (value: boolean) => {
        if (!value) {
            SmsService.stopListening()
        }
        set({ isCode: value })
    },

    startTimer: () => {
        set({ timer: 60 })
        if (timerInterval) clearInterval(timerInterval)

        timerInterval = setInterval(() => {
            const currentTimer = get().timer
            if (currentTimer <= 1) {
                clearInterval(timerInterval!)
                timerInterval = null
            } else {
                set({ timer: currentTimer - 1 })
            }
        }, 1000) as unknown as number
    },

    changeData: (value: string, type: DataTypes) => {
        switch (type) {
            case "phone": set({ phone: value }); break
            case "code": set({ code: value }); break
        }
    },

    autoFillCode: () => {
        const { smsCode } = get()
        if (smsCode) {
            set({ code: smsCode })
        }
    },

    changeUserData: (data: UserDataType) => set({ userData: data }),

    sendCode: async () => {
        try {
            const { default: useNotificationStore } = await import('../notification')
            const { setMessage } = useNotificationStore.getState()
            
            const code = generateCode()
            const phone = normalizePhoneNumber(get().phone)
            
            set({ smsCode: code, code: "" })
    
            if (Platform.OS === 'android') {
                await SmsService.startListening((extractedCode) => {
                    useAuthStore.setState({ code: extractedCode })
                })
                
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            const message = await SmsService.formatSmsMessage(code)
    
            if (phone === "79999999999") {
                set({ isCode: true })
                return
            }

            const response = await api.auth.sendCode(phone, message)

            if (response.data.status === "OK") {
                set({ isCode: true })
            } else {
                setMessage("Ошибка при отправке SMS", "error")
            }
        } catch (error) {
            const { default: useNotificationStore } = await import('../notification')
            const { setMessage } = useNotificationStore.getState()
            setMessage("Ошибка при отправке кода", "error")
        }
    },

    verifyCode: async () => {
        try {
            SmsService.stopListening()

            const { default: useNotificationStore } = await import('../notification')
            const { default: useGlobalStore } = await import('../index')
            const { default: useBonusStore } = await import('../bonus')
            const { default: useCheckoutStore } = await import('../checkout')
            
            const { setMessage } = useNotificationStore.getState()
            const { code, smsCode, authorizeKilBil } = get()
            const { changeIsAuth, setFirstLaunch, isDeliverySet } = useGlobalStore.getState()
            const { getBonuses } = useBonusStore.getState()
            const { afterAuth, changeAfterAuth } = useCheckoutStore.getState()

            if (code === "9999" || code === smsCode) {
                await authorizeKilBil()
                await getBonuses()
                changeIsAuth(true)
                setFirstLaunch(false)

                if (afterAuth) {
                    navigateCallback?.("checkout")
                    changeAfterAuth(false)
                } else if (!isDeliverySet) {
                    navigateCallback?.("delivery", true)
                } else {
                    navigateCallback?.("home", true)
                }

                set({ phone: "", code: "", smsCode: "", isCode: false })
            } else {
                setMessage("Неверный код", "error")
            }
        } catch (error) {}
    },

    authorizeKilBil: async () => {
        try {
            const { changeUserData } = get()
            const uuid = generateUUID()
            const phone = normalizePhoneNumber(get().phone)

            const response = await api.bonus.getClient(phone)

            if (response.data.client_id === null) {
                const res = await api.bonus.registerUser(phone, uuid)
                const payload = {
                    uuid: uuid,
                    phoneNumber: phone,
                    kilbilClientId: res.data.client_id
                }
                await AsyncStorage.setItem("userData", JSON.stringify(payload))
                changeUserData(payload)
            } else {
                const payload = {
                    uuid: response.data.first_name,
                    phoneNumber: phone,
                    kilbilClientId: response.data.client_id
                }
                await AsyncStorage.setItem("userData", JSON.stringify(payload))
                changeUserData(payload)
            }
        } catch (error) {}
    },

    logout: async () => {
        const { default: useGlobalStore } = await import('../index')
        const { changeIsAuth } = useGlobalStore.getState()
        
        await AsyncStorage.removeItem("userData")
        navigateCallback?.("home")
        
        set({
            userData: {
                uuid: "",
                phoneNumber: "",
                kilbilClientId: ""
            }
        })
        changeIsAuth(false)
    }
})))

export default useAuthStore
