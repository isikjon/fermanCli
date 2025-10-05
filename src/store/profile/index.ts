import { State, Types } from './types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage';
import useDeliveryStore from '../delivery';
import useNotificationStore from '../notification';

const useProfileStore = create<State>()(devtools((set, get) => ({
    formData: {
        fullName: "",
        dateBirth: "",
    },

    saveData: async () => {
        const { setMessage } = useNotificationStore.getState()
        const addressList = useDeliveryStore.getState().addresses
        const data = get().formData

        await AsyncStorage.setItem("addressList", JSON.stringify(addressList))
        await AsyncStorage.setItem("profileData", JSON.stringify(data))
        setMessage("Данные сохранены", "success")
    },
    getProfileData: async () => {
        const data = await AsyncStorage.getItem("profileData")
        const parsedData = data && JSON.parse(data) as { fullName: string, dateBirth: string, }

        if (parsedData) {
            set({ formData: parsedData })
        }
    },
    changeProfileData: (value: string, type: Types) => {
        const formData = { ...get().formData }

        switch (type) {
            case "fullName": formData.fullName = value; break;
            case "dateBirth": formData.dateBirth = value; break;
        }

        set({ formData })
    }
})))

export default useProfileStore