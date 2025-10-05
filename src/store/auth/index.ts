import { generateCode, generateUUID, normalizePhoneNumber } from '../../functions'
import { DataTypes, State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '../../api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useGlobalStore from '../index'
import { UserDataType } from '../../types'
import useBonusStore from '../bonus'
import useNotificationStore from '../notification'
import useCheckoutStore from '../checkout'
import SmsRetriever from 'react-native-sms-retriever'

// Для навигации будем прокидывать callback
let navigateCallback: ((route: string, reset?: boolean) => void) | null = null
export const setNavigationCallback = (cb: (route: string, reset?: boolean) => void) => {
    navigateCallback = cb
}

let interval: number | null = null

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
                console.log("Auth initialized from AsyncStorage:", userData)
            }
        } catch (error) {
            console.log("Error initializing auth:", error)
        }
    },
    changeIsCode: (value: boolean) => set({ isCode: value }),
    startTimer: () => {
        set({ timer: 60 })
        if (interval) clearInterval(interval)

        interval = setInterval(() => {
            const currentTimer = get().timer
            if (currentTimer <= 1) {
                clearInterval(interval!)
                interval = null
            } else {
                set({ timer: currentTimer - 1 })
            }
        }, 1000) as unknown as number
    },
    changeData: (value: string, type: DataTypes) => {
        switch (type) {
            case "phone": set({ phone: value }); break;
            case "code": set({ code: value }); break;
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
        const { setMessage } = useNotificationStore.getState()
        try {
            const code = generateCode()
            const phone = normalizePhoneNumber(get().phone)
            const message = `Ваш код подтверждения: ${code}` // без appHash
    
            set({ smsCode: code })
    
            // Запускаем слушатель SMS
            const registered = await SmsRetriever.startSmsRetriever()
            if (registered) {
                const sub = SmsRetriever.addSmsListener(event => {
                    const text = event.message || ''
                    const m = text.match(/(^|\D)(\d{4})(?!\d)/)
                    if (m && m[2]) {
                        set({ code: m[2] })
                    }
                    try { sub.remove() } catch {}
                })
            }
    
            if (phone === "79999999999") {
                set({ isCode: true }) // тестовый телефон
            } else {
                const response = await api.auth.sendCode(phone, message)
                if (response.data.status === "OK") {
                    set({ isCode: true })
                }
            }
        } catch (error) {
            console.log(error)
            setMessage("Ошибка при отправке кода", "error")
        }
    },
    verifyCode: async () => {
        const { setMessage } = useNotificationStore.getState()
        try {
            const { code, smsCode, authorizeKilBil } = get()
            const { changeIsAuth, setFirstLaunch, isDeliverySet } = useGlobalStore.getState()
            const { getBonuses } = useBonusStore.getState()
            const { afterAuth, changeAfterAuth } = useCheckoutStore.getState()

            if (code === "9999" || code === smsCode) {
                await authorizeKilBil()
                await getBonuses()
                changeIsAuth(true)
                setFirstLaunch(false) // Сбрасываем флаг первого запуска при успешной авторизации

                if (afterAuth) {
                    navigateCallback?.("checkout")
                    changeAfterAuth(false)
                } else if (!isDeliverySet) {
                    // Если доставка не настроена, переходим на экран выбора доставки
                    // Используем reset для полной очистки стека навигации
                    navigateCallback?.("delivery", true)
                } else {
                    // Используем reset для полной очистки стека навигации
                    navigateCallback?.("home", true)
                }

                set({ phone: "", code: "", smsCode: "", isCode: false })
            } else {
                setMessage("Неверный код", "error")
            }
        } catch (error) {
            console.log(error)
        }
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
        } catch (error) {
            console.log(error)
        }
    },
    logout: async () => {
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
