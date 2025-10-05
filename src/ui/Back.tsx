import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { FC } from 'react'
import Icons from './Icons'
import Txt from './Text'

interface Props {
    onClick: () => void
}

const Back: FC<Props> = ({ onClick }) => {
    return (
        <TouchableOpacity style={styles.BackButton} onPress={onClick} activeOpacity={0.5}>
            <Icons.ArrowRight style={styles.BackIcon} />
            <Txt color='#4D4D4D' weight='Bold' size={18}>Назад</Txt>
        </TouchableOpacity>
    )
}

export default Back

const styles = StyleSheet.create({
    BackButton: {
        alignItems: "center",
        flexDirection: "row",
        gap: 8
    },
    BackIcon: {
        width: 24,
        height: 24,
        transform: [{ rotate: "180deg" }]
    }
})