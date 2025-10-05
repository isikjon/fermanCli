import { Image, StyleSheet, TouchableOpacity, View, InteractionManager } from 'react-native'
import React, { FC, useCallback, useEffect, useState, useRef } from 'react'
import Empty from '../assets/svg/Empty'
import Txt from './Text'
import Counter from './Counter'
import Button from './Button'
import { ProductType } from '../types'
import useCatalogStore from '../store/catalog'
import useCartStore from '../store/cart'
import useNotificationStore from '../store/notification'
import { useNavigation } from '@react-navigation/native'

interface Props {
    item: ProductType
}

const ProductCard: FC<Props> = ({ item }) => {
    const navigation = useNavigation()
    const { getImage } = useCatalogStore()
    const { addItemToCart, cartList } = useCartStore()
    const { setMessage } = useNotificationStore()
    const [inCart, setInCart] = useState(false)
    const isMounted = useRef(true)
    const isNavigatingRef = useRef(false)
    const [image, setImage] = useState<string | null>(null)
    
    const cartItem = cartList.find(i => i.id === item.id)
    const initialAmount = cartItem 
        ? (item.weighed && cartItem.weight !== undefined ? cartItem.weight : cartItem.amount)
        : (item.weighed ? 0.1 : 1)
    const [amount, setAmount] = useState(initialAmount)
    
    const getImageUrl = useCallback(async () => {
        const imageMetadata = await getImage(item.image)
        if (isMounted.current) {
            setImage(imageMetadata || null)
        }
    }, [item.image, getImage])

    const checkInCart = useCallback(() => {
        const data = cartList.find(i => i.id === item.id)
        if (data) {
            const cartAmount = item.weighed && data.weight !== undefined ? data.weight : data.amount
            setAmount(cartAmount)
            setInCart(true)
        } else {
            setInCart(false)
            setAmount(item.weighed ? 0.1 : 1)
        }
    }, [cartList, item.id, item.weighed])

    useEffect(() => {
        checkInCart()
        
        let timer: NodeJS.Timeout
        const handle = InteractionManager.runAfterInteractions(() => {
            timer = setTimeout(() => {
                if (isMounted.current) {
                    getImageUrl()
                }
            }, 200)
        })
        
        return () => {
            isMounted.current = false
            handle.cancel()
            if (timer) clearTimeout(timer)
        }
    }, [getImageUrl, checkInCart])

    const step = item.weighed ? 0.1 : 1
    const totalPrice = (amount * item.price).toFixed(2)

    return (
        <TouchableOpacity
            style={styles.Item}
            activeOpacity={0.5}
            onPress={() => {
                if (isNavigatingRef.current) return
                isNavigatingRef.current = true
                console.log('🖱️ [ProductCard] CLICKED', item.name.substring(0, 30))
                navigation.navigate('product', { id: item.id })
                setTimeout(() => {
                    isNavigatingRef.current = false
                }, 1000)
            }}
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
                <Counter
                    amount={amount}
                    step={step}
                    onChange={setAmount}
                    sign={item.weighed ? "кг" : ""}
                    max={item.stock}
                    isSmall
                />

                <Button
                    onClick={() => {
                        if (!inCart) {
                            const cartData = cartList.find(i => i.id === item.id)
                            const currentInCart = item.weighed 
                                ? (cartData?.weight || 0)
                                : (cartData?.amount || 0)
                            const newTotal = item.weighed ? currentInCart + amount : currentInCart + amount
                            
                            if (item.stock !== undefined && newTotal > item.stock) {
                                setMessage('На складе недостаточно товара', 'error')
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
                            navigation.navigate('cart')
                        }
                    }}
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
