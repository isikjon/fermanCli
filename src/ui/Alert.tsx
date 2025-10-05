import { Dimensions, StyleSheet, Animated, Easing } from 'react-native'
import React, { useEffect, useRef } from 'react'
import useNotificationStore from '../store/notification'
import Txt from './Text'

const Alert = () => {
    const { message, type } = useNotificationStore()

    const slideAnim = useRef(new Animated.Value(-100)).current

    useEffect(() => {
        if (message !== "") {
            Animated.timing(slideAnim, {
                toValue: 20,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start()

            setTimeout(() => {
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: false,
                    easing: Easing.in(Easing.ease)
                }).start()
            }, 2000)
        }
    }, [message])

    return (
        <Animated.View
            style={[
                styles.Message,
                {
                    bottom: slideAnim
                },
                type === "success" && styles.Success,
                type === "error" && styles.Error,
            ]}
        >
            <Txt color="#fff">{message}</Txt>
        </Animated.View>
    )
}

export default Alert

const styles = StyleSheet.create({
    Message: {
        zIndex: 1000,
        position: "absolute",
        width: Dimensions.get("screen").width - 40,
        left: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 20
    },
    Success: {
        backgroundColor: "#4FBD01",
    },
    Error: {
        backgroundColor: "#F73106",
    }
})