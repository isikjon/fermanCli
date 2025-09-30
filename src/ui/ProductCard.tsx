import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useEffect, useState } from 'react'
import Empty from '../assets/svg/Empty'
import Txt from './Text'
import Counter from './Counter'
import Button from './Button'
import { ProductType } from '../types'
import useCatalogStore from '../store/catalog'
import useCartStore from '../store/cart'
import { useNavigation } from '@react-navigation/native'

interface Props {
    item: ProductType
}

const ProductCard: FC<Props> = ({ item }) => {
    const navigation = useNavigation()
    const { getImage } = useCatalogStore()
    const [amount, setAmount] = useState(item.weighed ? 0.1 : 1)
    const [image, setImage] = useState<string | null>(null)
    const { addItemToCart, cartList } = useCartStore()
    const [inCart, setInCart] = useState(false)
    
    const getImageUrl = useCallback(async () => {
        const imageMetadata = await getImage(item.image)
        setImage(imageMetadata || null)
    }, [item.image, getImage])

    const checkInCart = useCallback(() => {
        const data = cartList.find(i => i.id === item.id)
        if (data) {
            setAmount(data.amount)
            setInCart(true)
        } else {
            setInCart(false)
        }
    }, [cartList, item.id])

    useEffect(() => {
        getImageUrl()
        checkInCart()
    }, [getImageUrl, checkInCart])

    const step = item.weighed ? 0.1 : 1
    const totalPrice = (amount * item.price).toFixed(2)

    return (
        <TouchableOpacity
            style={styles.Item}
            activeOpacity={0.5}
            onPress={() => navigation.navigate('product', { id: item.id })}
        >
            <View style={styles.Content}>
                {image ? (
                    <Image style={styles.Image} source={{ uri: image }} />
                ) : (
                    <View style={styles.Empty}><Empty /></View>
                )}

                <View style={styles.Info}>
                    <Txt>{item.name}</Txt>
                    <Txt weight='Bold'>
                        {`${item.price} ₽ / ${item.weighed ? "кг" : "шт"}`}
                    </Txt>
                    <Txt size={14} color="#666">
                        Итого: {totalPrice} ₽
                    </Txt>
                </View>
            </View>

            <View style={styles.Box}>
                {!inCart && (
                    <Counter
                        amount={amount}
                        step={step}
                        onChange={value => setAmount(Number(value.toFixed(2)))}
                        sign={item.weighed ? "кг" : ""}
                        isSmall
                    />
                )}

                <Button
                    onClick={() =>
                        !inCart
                            ? addItemToCart({
                                amount: amount,
                                id: item.id,
                                image: item.image,
                                name: item.name,
                                price: item.price,
                                isWeighted: item.weighed,
                            })
                            : navigation.navigate('cart')
                    }
                    background={inCart ? "#EEEEEE" : "#4FBD01"}
                >
                    <Txt color={inCart ? "#4D4D4D" : "#fff"} weight='Bold' size={18}>
                        {inCart ? "В корзине" : "В корзину"}
                    </Txt>
                </Button>
            </View>
        </TouchableOpacity>
    )
}

ProductCard.displayName = 'ProductCard'

export default ProductCard

const styles = StyleSheet.create({
    Item: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#4FBD01",
        padding: 16,
        borderRadius: 16,
        maxWidth: "48%",
    },
    Content: {
        flexGrow: 1
    },
    Image: {
        width: "100%",
        height: 150,
        borderRadius: 16,
    },
    Empty: {
        height: 150,
        width: "100%",
        borderWidth: 1,
        borderColor: "#4FBD01",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center"
    },
    Info: {
        marginTop: 16,
        gap: 4
    },
    Box: {
        marginTop: 20,
        gap: 16,
    }
})
