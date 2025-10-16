import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useEffect, useState } from 'react'
import FastImage from 'react-native-fast-image'
import Txt from '../ui/Text'
import Counter from '../ui/Counter'
import Icons from '../ui/Icons'
import Row from '../components/Row'
import { CartType } from '../types'
import useCatalogStore from '../store/catalog'
import Empty from '../assets/svg/Empty'
import useCartStore from '../store/cart'
import { useNavigation } from '@react-navigation/native'
import { formatPrice } from '../functions'
import { MOYSKLAD_TOKEN } from '../api/functions/products'

interface Props {
    item: CartType
}

const CartItem: FC<Props> = ({ item }) => {
    const navigation = useNavigation()
    const { getImage } = useCatalogStore()
    const [image, setImage] = useState<string | null>(null)
    const { removeItemFromCart, changeCartItem } = useCartStore()
    const [amount, setAmount] = useState(item.amount)
    const [weight, setWeight] = useState(item.weight || 0.1)
    
    useEffect(() => {
        setAmount(item.amount)
        setWeight(item.weight || 0.1)
    }, [item.amount, item.weight])
    
    const displayAmount = item.isWeighted ? weight : amount
    const step = item.isWeighted ? 0.1 : 1
    const price = item.isWeighted ? item.price * weight : item.price * amount

    const getImageUrl = useCallback(async () => {
        const imageMetadata = await getImage(item.image)
        setImage(imageMetadata || null)
    }, [item])

    useEffect(() => {
        getImageUrl()
    }, [getImageUrl])

    return (
        <View style={styles.CartItem}>
            <Row gap={24}>
                <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('product' as never, { id: item.id } as never)}
                    activeOpacity={0.5}
                >
                    <Row>
                        {image ? (
                            <FastImage 
                                style={styles.Image} 
                                source={{ 
                                    uri: image,
                                    headers: { Authorization: MOYSKLAD_TOKEN },
                                    priority: FastImage.priority.normal,
                                }}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        ) : (
                            <View style={styles.Empty}><Empty width={40} height={40} /></View>
                        )}

                        <View style={styles.Title}>
                            <Txt weight='RobotoCondensed-Bold' size={16} lines={3}>{item.name}</Txt>
                            {item.isWeighted ? (
                                <>
                                    <Txt>{weight.toFixed(1)} кг</Txt>
                                    <Txt>{`${weight.toFixed(1)}кг x ${formatPrice(item.price)}/кг = ${formatPrice(price)} руб.`}</Txt>
                                </>
                            ) : (
                                <Txt>{`${amount}шт x ${formatPrice(item.price)} = ${formatPrice(price)} руб.`}</Txt>
                            )}
                        </View>
                    </Row>
                </TouchableOpacity>

                <Counter
                    amount={displayAmount}
                    onChange={value => {
                        if (item.isWeighted) {
                            setWeight(value)
                            changeCartItem(item.id, { ...item, weight: value })
                        } else {
                            setAmount(value)
                            changeCartItem(item.id, { ...item, amount: value })
                        }
                    }}
                    step={step}
                    min={item.isWeighted ? 0.1 : 1}
                    max={item.stock}
                    sign={item.isWeighted ? "кг" : ""}
                    isNotFull
                    isSmall
                />
            </Row>

            <Row>
                <Txt size={28} weight='RobotoCondensed-Bold'>{`${formatPrice(price)} руб.`}</Txt>
                <TouchableOpacity activeOpacity={0.5} onPress={() => removeItemFromCart(item.id)}>
                    <Icons.Trash />
                </TouchableOpacity>
            </Row>
        </View>
    )
}

export default CartItem

const styles = StyleSheet.create({
    CartItem: {
        gap: 16,
        width: "100%",
        paddingBottom: 24,
        borderBottomColor: "#15151526",
        borderBottomWidth: 1
    },
    Image: {
        width: 75,
        height: 75,
        borderRadius: 12,
        resizeMode: "cover",
    },
    Empty: {
        width: 75,
        height: 75,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#15151580",
        alignItems: "center",
        justifyContent: "center"
    },
    Title: {
        flex: 1,
        width: "100%",
        gap: 4
    }
})
