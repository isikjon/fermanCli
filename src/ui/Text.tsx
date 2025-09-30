import { StyleSheet, Text } from 'react-native'
import React, { FC, ReactNode } from 'react'

interface Props {
    children: ReactNode
    color?: string
    size?: number
    weight?: "RobotoCondensed-Regular" | "RobotoCondensed-Bold" | "Jingleberry",
    lines?: number
    lineHeight?: number
}

const Txt: FC<Props> = ({ children, color = "#4D4D4D", size = 14, lineHeight, weight = "RobotoCondensed-Regular", lines }) => {
    return (
        <Text
            style={{
                color,
                fontSize: size,
                fontFamily: weight,
                lineHeight: lineHeight,
            }}
            numberOfLines={lines}
        >{children}</Text>
    )
}

export default Txt

const styles = StyleSheet.create({})