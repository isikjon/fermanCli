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
            console.log('🚀 [WelcomeScreen] Starting initialization...')
            
            try {
                await initializeAuth()
                console.log('✅ [WelcomeScreen] Auth initialized')
                
                if (isAuth) {
                    console.log('💰 [WelcomeScreen] Loading bonuses for authorized user...')
                    await getBonuses()
                    console.log('✅ [WelcomeScreen] Bonuses loaded')
                }
            } catch (error) {
                console.log('❌ [WelcomeScreen] Initialization error:', error)
            }
            
            const timer = setTimeout(() => {
                console.log('🔍 [WelcomeScreen] Checking state: isFirstLaunch =', isFirstLaunch, 'isAuth =', isAuth, 'isDeliverySet =', isDeliverySet)
                
                if (!isAuth) {
                    // Если не авторизован - обязательно на авторизацию
                    console.log('WelcomeScreen: Navigating to auth (not authorized)')
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'auth' }],
                    })
                } else if (isAuth && !isDeliverySet) {
                    console.log('WelcomeScreen: Navigating to delivery (user authorized but no delivery set)')
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'delivery' }],
                    })
                } else if (isAuth && isDeliverySet) {
                    console.log('WelcomeScreen: Navigating to home (user authorized and delivery set)')
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'home' }],
                    })
                }
            }, 2000) // 2 секунды 

            return () => clearTimeout(timer)
        }

        initializeApp()
    }, [navigation, isFirstLaunch, isAuth, isDeliverySet, initializeAuth])

    return (
        <View style={styles.Container}>
            {/* GIF анимация на весь экран */}
  
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
        width: width * 0.4, // 40% ширины экрана
        height: height * 0.3, // 30% высоты экрана
        right: 48, // 48px от правого края
        top: (height - height * 0.3 - 48) / 2, // по центру по высоте с учетом отступа снизу 48px
    },
    FullScreenGif: {
        position: 'absolute',
        width: width,
        height: height,
        top: 0,
        left: 0
    }
})
