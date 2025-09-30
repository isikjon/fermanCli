import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import React, { FC } from 'react'

interface Props {
    children: React.ReactNode
    onClick?: () => void
    padding?: number
    height?: number
    background?: string
    outline?: boolean
    disabled?: boolean
    style?: ViewStyle
}

const Button: FC<Props> = ({ 
    children, 
    onClick, 
    padding, 
    height = 40, 
    background = "#4FBD01", 
    outline, 
    disabled = false,
    style 
}) => {
    return (
        <TouchableOpacity
            onPress={disabled ? undefined : onClick}
            activeOpacity={disabled ? 1 : 0.5}
            style={[
                styles.Button, 
                {
                    paddingHorizontal: padding,
                    height,
                    backgroundColor: disabled ? '#ccc' : background
                }, 
                outline && styles.Outline,
                disabled && styles.Disabled,
                style
            ]}
            disabled={disabled}
        >
            {children}
        </TouchableOpacity>
    )
}

export default Button

const styles = StyleSheet.create({
    Button: {
        width: "100%",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center"
    },
    Outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#4FBD01"
    },
    Disabled: {
        opacity: 0.5
    }
})