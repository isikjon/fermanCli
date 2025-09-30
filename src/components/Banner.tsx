import { StyleSheet, View } from 'react-native'
import React from 'react'
import Txt from '../ui/Text'
import Cup from '../assets/svg/Cup'


const Banner = () => {
    return (
        <View style={styles.Banner}>
            <Cup width={26} height={26} />

            <View style={styles.FlexBox}>
                <Txt size={18} weight='Jingleberry'>Бесплатная доставка от ххх руб. Минимальный заказ: 600 руб.</Txt>
            </View>
        </View>
    )
}

export default Banner

const styles = StyleSheet.create({
    Banner: {
        flex: 1,
        backgroundColor: "#FD8A0A",
        paddingVertical: 13,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: 20,
    },
    FlexBox: {
        flex: 1
    }
})