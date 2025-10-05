import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import FullLogo from '../assets/FullLogo'
import Button from '../ui/Button'
import Txt from '../ui/Text'
import PhoneInput from '../ui/PhoneInput'
import useAuthStore from '../store/auth'
import Input from '../ui/Input'
import Icons from '../ui/Icons'
import Back from '../ui/Back'
import CodeInput from '../ui/CodeInput'
import useGlobalStore from '../store'
import { useNavigation } from '@react-navigation/native'

const auth = () => {
    const { phone, changeData, isCode, code, sendCode, verifyCode, timer, startTimer, changeIsCode, autoFillCode } = useAuthStore()
    const { isFirstLaunch, setFirstLaunch, isDeliverySet, isAuth } = useGlobalStore()
    const navigation = useNavigation<any>()

    const handleSkip = async () => {
        console.log('Skipping auth, setting isFirstLaunch to false')
        setFirstLaunch(false)
        // Небольшая задержка чтобы убедиться что состояние сохранилось
        setTimeout(() => {
            // Если доставка не настроена, переходим на экран доставки
            if (!isDeliverySet) {
                navigation.replace('delivery')
            } else {
                navigation.replace('home')
            }
        }, 100)
    }

    // Кнопка "Пропустить" не показывается при первом запуске - авторизация обязательна
    const showSkipButton = false

    useEffect(() => {
        if (isCode) {
            const timer = setTimeout(() => {
                autoFillCode()
            }, 3000)
            
            return () => clearTimeout(timer)
        }
    }, [isCode, autoFillCode])

    return (
        <View style={styles.Container}>
            {showSkipButton && (
                <TouchableOpacity 
                    style={styles.SkipButton} 
                    onPress={handleSkip}
                    activeOpacity={0.7}
                >
                    <Icons.Close width={24} height={24} color="#4D4D4D" />
                </TouchableOpacity>
            )}

            <FullLogo />

            <View style={styles.InfoBox}>
                <Txt size={18} weight="Bold" style={styles.InfoTitle}>
                    Добро пожаловать!
                </Txt>
                <Txt size={14} color="#666" style={styles.InfoText}>
                    Войдите, чтобы получить доступ к полному функционалу приложения, копить и списывать бонусные баллы
                </Txt>
            </View>

            {!isCode
                ? <View style={styles.Form}>
                    <PhoneInput
                        onChange={value => changeData(value, "phone")}
                        label="Телефон"
                        placeholder="+7 (ХХХ) ХХХ ХХ-ХХ"
                        value={phone}
                    />
                    <Button height={56} onClick={() => {
                        sendCode()
                        startTimer()
                    }}>
                        <Txt color="#fff" weight='Bold' size={18}>Отправить код</Txt>
                    </Button>
                </View>
                : <View style={styles.Form}>
                    {/* Кнопка "Назад" скрыта когда авторизация обязательна */}
                    {!(!isAuth) && <Back onClick={() => changeIsCode(false)} />}

                    <CodeInput
                        onChange={value => changeData(value, "code")}
                        value={code}
                    />

                    <Button height={56} onClick={() => verifyCode()}>
                        <Txt color="#fff" weight='Bold' size={18}>Войти</Txt>
                    </Button>

                    {timer <= 1
                        ? <Button height={56} outline onClick={() => {
                            sendCode()
                            startTimer()
                        }}>
                            <Txt color="#4FBD01" weight='Bold' size={18}>Отправить новый код</Txt>
                        </Button>
                        : <Txt size={16}>Отправить новый код через {timer} сек</Txt>
                    }
                </View>
            }
        </View>
    )
}

export default auth

const styles = StyleSheet.create({
    Container: {
        paddingTop: StatusBar.currentHeight,
        flex: 1,
        backgroundColor: "#fff"
    },
    Form: {
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 12
    },
    SkipButton: {
        position: 'absolute',
        top: (StatusBar.currentHeight || 0) + 16,
        right: 16,
        zIndex: 1000,
        padding: 8,
    },
    InfoBox: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    InfoTitle: {
        marginBottom: 8,
    },
    InfoText: {
        opacity: 0.7,
    }
})