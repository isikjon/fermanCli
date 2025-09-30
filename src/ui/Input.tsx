import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import React, { FC } from 'react'
import Txt from './Text'
import { CustomSvgProps } from '../types'

interface Props {
    label?: string
    placeholder?: string
    value?: string
    onChange: (value: string) => void
    withIcon?: { component: React.FC<CustomSvgProps>, onClick: () => void }
    readonly?: boolean
    maxLenght?: number
    isNumber?: boolean
    onFocus?: () => void  // вот это добавили
}

const Input: FC<Props> = ({ onChange, label, placeholder, value, withIcon, readonly, maxLenght, isNumber, onFocus }) => {
    return (
        <View style={styles.InputBox}>
            {label && <Txt size={16} weight='Bold'>{label}</Txt>}

            <View style={styles.Input}>
                <TextInput
                    style={styles.InputElement}
                    value={value}
                    placeholder={placeholder}
                    onChangeText={onChange}
                    placeholderTextColor="rgba(77, 77, 77, 0.5)"
                    readOnly={readonly}
                    maxLength={maxLenght}
                    keyboardType={isNumber ? "numeric" : "default"}
                    onFocus={onFocus}  // прокидываем
                />
                {withIcon && (
                    <TouchableOpacity activeOpacity={0.5} onPress={withIcon.onClick}>
                        <withIcon.component width={24} height={24} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

export default Input

const styles = StyleSheet.create({
    InputBox: {
        gap: 4
    },
    Input: {
        height: 56,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "rgba(77, 77, 77, 0.5)",
        borderRadius: 8,
        alignItems: "center",
        flexDirection: "row",
        gap: 8
    },
    InputElement: {
        flex: 1
    }
})
