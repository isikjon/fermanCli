import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useEffect, useState } from 'react'
import Txt from '../ui/Text'
import Counter from '../ui/Counter'
import Icons from '../ui/Icons'
import Row from '../components/Row'
import { CartType } from '../types'
import useCatalogStore from '../store/catalog'
import Empty from '../assets/svg/Empty'
import useCartStore from '../store/cart'
import { useNavigation } from '@react-navigation/native'

interface Props {
    item: CartType
}

const CartItem: FC<Props> = ({ item }) => {
    const navigation = useNavigation()
    const { getImage } = useCatalogStore()
    const [image, setImage] = useState<string | null>(null)
    const { removeItemFromCart, changeCartItem } = useCartStore()
    const [amount, setAmount] = useState(item.amount)
    const price = item.isWeighted ? item.price * (item.weight || 0.1) : item.price

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
                    onPress={() => navigation.navigate('product', { productId: item.id })}
                    activeOpacity={0.5}
                >
                    <Row>
                        {image ? (
                            <Image style={styles.Image} source={{ uri: image }} />
                        ) : (
                            <View style={styles.Empty}><Empty width={40} height={40} /></View>
                        )}

                        <View style={styles.Title}>
                            <Txt weight='Bold' size={16} lines={3}>{item.name}</Txt>
                            {item.isWeighted && <Txt>{item.weight?.toFixed(1) || 0.1} кг</Txt>}
                            <Txt>{`${item.amount}x${price.toFixed()}=${(item.amount * price).toFixed()} руб.`}</Txt>
                        </View>
                    </Row>
                </TouchableOpacity>

                <Counter
                    amount={amount}
                    onChange={value => {
                        setAmount(value)
                        changeCartItem(item.id, { ...item, amount: value })
                    }}
                    max={item.stock}
                    isNotFull
                    isSmall
                />
            </Row>

            <Row>
                <Txt size={28} weight='Bold'>{`${(item.amount * price).toFixed()} руб.`}</Txt>
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
