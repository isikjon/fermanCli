import { Image, StyleSheet, View } from 'react-native'
import React from 'react'
import Txt from '@/ui/Text'

const FullLogo = () => {
    return (
        <View style={styles.Logo}>
            <Image source={require("@/assets/images/icon.png")} style={styles.LogoImg} />
            <View style={styles.Text}>
                <Txt size={48} weight='Jingleberry' lineHeight={50}>ФЕРМА ДВ</Txt>
                <View style={{ marginTop: -5 }}>
                    <Txt size={20} weight='Jingleberry'>фермерский магазин</Txt>
                </View>
            </View>
        </View>
    )
}

export default FullLogo

const styles = StyleSheet.create({
    LogoImg: {
        width: 74,
        height: 74
    },
    Logo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
        marginVertical: 23,
        paddingHorizontal: 16,
    },
    Text: {
        alignItems: "center"
    }
})