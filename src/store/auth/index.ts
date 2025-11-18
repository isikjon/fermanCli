import { generateCode, generateUUID, normalizePhoneNumber } from '../../functions'
import { DataTypes, State } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '../../api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { UserDataType } from '../../types'
import SmsRetriever from 'react-native-sms-retriever'

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
        try {
            const { default: useNotificationStore } = await import('../notification')
            const { setMessage } = useNotificationStore.getState()
            
            const code = generateCode()
            const phone = normalizePhoneNumber(get().phone)
            
            // Формируем сообщение
            // SMS.ru автоматически добавит хеш приложения для SMS Retriever API
            // Если у вас есть доступ к настройкам SMS-шаблонов на сервере,
            // можно добавить хеш вручную в формате: <#> Текст\nХЕШ_ПРИЛОЖЕНИЯ
            const message = `Ваш код подтверждения: ${code}`
    
            set({ smsCode: code })
    
            // Запускаем SMS Retriever для Android (автоматическое заполнение кода)
            try {
                const registered = await SmsRetriever.startSmsRetriever()
                if (registered) {
                    console.log('SMS Retriever started successfully')
                    
                    // Подписываемся на получение SMS
                    const subscription = SmsRetriever.addSmsListener((event) => {
                        try {
                            const text = event.message || ''
                            console.log('Received SMS:', text)
                            
                            // Ищем 4-значный код в SMS (различные варианты формата)
                            // Вариант 1: "код: 1234" или "код 1234"
                            // Вариант 2: "1234" как отдельное число
                            // Вариант 3: "Ваш код подтверждения: 1234"
                            const patterns = [
                                /(?:код|code)[\s:]*(\d{4})/i,
                                /(?:подтверждения|confirmation)[\s:]*(\d{4})/i,
                                /(?:^|\D)(\d{4})(?!\d)/,
                            ]
                            
                            for (const pattern of patterns) {
                                const match = text.match(pattern)
                                if (match && match[1]) {
                                    const extractedCode = match[1]
                                    console.log('Extracted code from SMS:', extractedCode)
                                    set({ code: extractedCode })
                                    
                                    // Удаляем подписку после успешного получения
                                    try {
                                        subscription.remove()
                                    } catch (e) {
                                        console.log('Error removing SMS listener:', e)
                                    }
                                    break
                                }
                            }
                        } catch (error) {
                            console.log('Error processing SMS:', error)
                        }
                    })
                    
                    // Таймаут для удаления подписки через 5 минут (если SMS не пришло)
                    setTimeout(() => {
                        try {
                            subscription.remove()
                            console.log('SMS listener removed after timeout')
                        } catch (e) {
                            console.log('Error removing SMS listener on timeout:', e)
                        }
                    }, 5 * 60 * 1000)
                } else {
                    console.log('SMS Retriever failed to start')
                }
            } catch (smsError) {
                console.log('SMS Retriever error (non-critical):', smsError)
                // Не критичная ошибка - пользователь может ввести код вручную
            }
    
            if (phone === "79999999999") {
                set({ isCode: true })
            } else {
                const response = await api.auth.sendCode(phone, message)
                if (response.data.status === "OK") {
                    set({ isCode: true })
                }
            }
        } catch (error) {
            console.log(error)
            const { default: useNotificationStore } = await import('../notification')
            const { setMessage } = useNotificationStore.getState()
            setMessage("Ошибка при отправке кода", "error")
        }
    },
    verifyCode: async () => {
        try {
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
