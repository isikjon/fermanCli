import React, { useEffect } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import useGlobalStore from '../store'
import useAuthStore from '../store/auth'
import useBonusStore from '../store/bonus'
import FastImage from 'react-native-fast-image'

interface Props {
}

const WelcomeScreen: React.FC<Props> = () => {
    const navigation = useNavigation<any>()
    const { isFirstLaunch, isAuth, isDeliverySet } = useGlobalStore()
    const { initializeAuth } = useAuthStore()
    const { getBonuses } = useBonusStore()

    useEffect(() => {
        const initializeApp = async () => {
            try {
                await initializeAuth()
                
                if (isAuth) {
                    await getBonuses()
                }
            } catch (error) {
            }
            
            const timer = setTimeout(() => {
                if (!isAuth) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'auth' }],
                    })
                } else if (isAuth && !isDeliverySet) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'delivery' }],
                    })
                } else if (isAuth && isDeliverySet) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'home' }],
                    })
                }
            }, 2000)

            return () => clearTimeout(timer)
        }

        initializeApp()
    }, [navigation, isFirstLaunch, isAuth, isDeliverySet, initializeAuth])

    return (
        <View style={styles.Container}>
            <FastImage 
                source={require('../assets/images/ezgif-266e19ebdc2d94.gif')} 
                style={styles.FullScreenGif}
                resizeMode={FastImage.resizeMode.cover}
            />
        </View>
    )
}

export default WelcomeScreen

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center'
    },
    Background: {
        position: 'absolute',
        width: width,
        height: height,
        top: 0,
        left: 0
    },
    MillFooting: {
        position: 'absolute',
        width: width * 0.4,
        height: height * 0.3,
        right: 48,
        top: (height - height * 0.3 - 48) / 2,
    },
    FullScreenGif: {
        position: 'absolute',
        width: width,
        height: height,
        top: 0,
        left: 0
    }
})
