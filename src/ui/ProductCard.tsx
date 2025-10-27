import { StyleSheet, TouchableOpacity, View, Image } from 'react-native'
import React, { FC, useCallback, useEffect, useState } from 'react'
import Empty from '../assets/svg/Empty'
import Txt from './Text'
import Counter from './Counter'
import Button from './Button'
import { ProductType } from '../types'
import useCatalogStore from '../store/catalog'
import useCartStore from '../store/cart'
import { useNavigation } from '@react-navigation/native'
import { formatPrice } from '../functions'

interface Props {
    item: ProductType
    width?: number
}

const ProductCard: FC<Props> = ({ item, width }) => {
    const navigation = useNavigation()
    const { getImage } = useCatalogStore()
    const [amount, setAmount] = useState(item.weighed ? 0.1 : 1)
    const [image, setImage] = useState<string | null>(null)
    const { addItemToCart, cartList } = useCartStore()
    const [inCart, setInCart] = useState(false)
    
    const getImageUrl = useCallback(async () => {
        if (item.image) {
            const imageMetadata = await getImage(item.image)
            setImage(imageMetadata || null)
        }
    }, [item.image, getImage])

    const checkInCart = useCallback(() => {
        const data = cartList.find(i => i.id === item.id)
        if (data) {
            setAmount(item.weighed && data.weight !== undefined ? data.weight : data.amount)
            setInCart(true)
        } else {
            setInCart(false)
        }
    }, [cartList, item.id, item.weighed])

    useEffect(() => {
        getImageUrl()
        checkInCart()
    }, [getImageUrl, checkInCart])

    const step = item.weighed ? 0.1 : 1
    const totalPrice = formatPrice(amount * item.price)

    const handleAddToCart = useCallback(() => {
        if (!inCart) {
            if (item.stock !== undefined && amount > item.stock) {
                alert('На складе недостаточно товара')
                return
            }
            
            addItemToCart({
                amount: item.weighed ? 1 : amount,
                id: item.id,
                image: item.image,
                name: item.name,
                price: item.price,
                isWeighted: item.weighed,
                weight: item.weighed ? amount : undefined,
                stock: item.stock
            })
        } else {
            navigation.navigate('cart' as never)
        }
    }, [inCart, item, amount, addItemToCart, navigation])
    
    const handleProductPress = useCallback(() => {
        navigation.navigate('product' as never, { id: item.id } as never)
    }, [item.id, navigation])

    return (
        <TouchableOpacity
            style={styles.Item}
            activeOpacity={0.5}
            onPress={handleProductPress}
        >
            <View style={styles.Content}>
                {image ? (
                    <Image style={styles.Image} source={{ uri: image }} />
                ) : (
                    <View style={styles.Empty}><Empty /></View>
                )}

                <View style={styles.Info}>
                    <Txt>{item.name}</Txt>
                    <Txt weight='RobotoCondensed-Bold'>
                        {`${formatPrice(item.price)} ₽ / ${item.weighed ? "кг" : "шт"}`}
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
                        max={item.stock}
                        isSmall
                    />
                )}

                <Button
                    onClick={handleAddToCart}
                    background={inCart ? "#EEEEEE" : "#4FBD01"}
                >
                    <Txt color={inCart ? "#4D4D4D" : "#fff"} weight='RobotoCondensed-Bold' size={18}>
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
