import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC } from 'react'
import Icons from './Icons'
import Txt from './Text'
import useNotificationStore from '../store/notification'

interface Props {
    amount: number
    onChange: (value: number) => void
    step?: number   // шаг (по умолчанию 1)
    isLarger?: boolean
    isNotFull?: boolean
    min?: number    // минимальное значение (по умолчанию 1)
    isSmall?: boolean
    sign?: string
    max?: number    // максимальное значение (лимит остатка)
}

const Counter: FC<Props> = ({
                                amount,
                                onChange,
                                step = 1,      // шаг прибавления/убавления
                                min = 1,       // минимальное значение
                                isLarger,
                                isNotFull,
                                isSmall,
                                sign,
                                max
                            }) => {
    const { setMessage } = useNotificationStore()
    const isMinusDisabled = amount <= min
    const isPlusDisabled = typeof max === 'number' ? amount >= max : false

    const handleDecrease = () => {
        if (amount - step >= min) {
            onChange(Number((amount - step).toFixed(2)))
        }
    }

    const handleIncrease = () => {
        const next = Number((amount + step).toFixed(2))
        if (typeof max === 'number' && next > max) {
            setMessage('На складе больше товара нет', 'error')
            onChange(Number(max.toFixed(2)))
            return
        }
        onChange(next)
    }

    const valueFontSize = isLarger ? 24 : isSmall ? 16 : (step < 1 ? 18 : 20)

    return (
        <View style={[styles.Counter, isNotFull && styles.IsNotFull, isSmall && styles.SmallCounter]}>
            <TouchableOpacity
                style={[
                    styles.Button,
                    isMinusDisabled && styles.Disabled,
                    isLarger && styles.Large,
                    isSmall && styles.Small
                ]}
                activeOpacity={0.5}
                onPress={handleDecrease}
                disabled={isMinusDisabled}
            >
                <Icons.Minus
                    width={isLarger ? 16 : 10}
                    height={isLarger ? 16 : 10}
                    color={isMinusDisabled ? "#4D4D4D" : "#fff"}
                />
            </TouchableOpacity>

            <Txt size={valueFontSize} weight={isSmall ? "Regular" : 'Bold'}>
                {step < 1 ? amount.toFixed(1) : amount} {sign}
            </Txt>

            <TouchableOpacity
                style={[styles.Button, isLarger && styles.Large, isSmall && styles.Small, isPlusDisabled && styles.Disabled]}
                activeOpacity={0.5}
                onPress={handleIncrease}
                disabled={isPlusDisabled}
            >
                <Icons.Plus
                    width={isLarger ? 16 : 10}
                    height={isLarger ? 16 : 10}
                    color={isPlusDisabled ? "#4D4D4D" : "#fff"}
                />
            </TouchableOpacity>
        </View>
    )
}

export default Counter

const styles = StyleSheet.create({
    Counter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    Button: {
        width: 30,
        height: 30,
        backgroundColor: "#4FBD01",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6
    },
    Disabled: {
        backgroundColor: "#EEEEEE"
    },
    Large: {
        width: 56,
        height: 56,
        borderRadius: 8
    },
    IsNotFull: {
        justifyContent: "flex-start",
        gap: 16,
        flex: 0
    },
    Small: {
        width: 22,
        height: 22,
        borderRadius: 5
    },
    SmallCounter: {
        justifyContent: "flex-start",
        gap: 10,
        flex: 0
    }
})
