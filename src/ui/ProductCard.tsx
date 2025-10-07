import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useEffect, useState, useRef, useMemo } from 'react'
import Empty from '../assets/svg/Empty'
import Txt from './Text'
import Counter from './Counter'
import Button from './Button'
import { ProductType } from '../types'
import useCatalogStore from '../store/catalog'
import useCartStore from '../store/cart'
import useNotificationStore from '../store/notification'
import { useNavigation } from '@react-navigation/native'
import { performanceMonitor } from '../utils/performanceMonitor'
import { formatPrice } from '../functions'

interface Props {
    item: ProductType
    width?: number
}

const ProductCard: FC<Props> = ({ item, width }) => {
    const navigation = useNavigation()
    const { getImage, setSelectedAmount, getSelectedAmount, clearSelectedAmount } = useCatalogStore()
    const { addItemToCart, cartList } = useCartStore()
    const { setMessage } = useNotificationStore()
    const isMounted = useRef(true)
    const isNavigatingRef = useRef(false)
    const [image, setImage] = useState<string | null>(null)
    
    const cartItem = useMemo(() => cartList.find(i => i.id === item.id), [cartList, item.id])
    
    const inCart = useMemo(() => !!cartItem, [cartItem])
    
    const amount = useMemo(() => {
        if (cartItem) {
            return item.weighed && cartItem.weight !== undefined ? cartItem.weight : cartItem.amount
        }
        const savedAmount = getSelectedAmount(item.id)
        if (savedAmount !== undefined) {
            return savedAmount
        }
        return item.weighed ? 0.1 : 1
    }, [cartItem, item.weighed, item.id])
    
    const [localAmount, setLocalAmount] = useState(amount)
    
    useEffect(() => {
        setLocalAmount(amount)
    }, [amount])
    
    const getImageUrl = useCallback(async () => {
        if (!item.image) return
        const imageMetadata = await getImage(item.image)
        if (isMounted.current) {
            setImage(imageMetadata || null)
        }
    }, [item.image, getImage])

    useEffect(() => {
        isMounted.current = true
        getImageUrl()
        
        return () => {
            isMounted.current = false
        }
    }, [getImageUrl])

    const step = useMemo(() => item.weighed ? 0.1 : 1, [item.weighed])
    const totalPrice = useMemo(() => formatPrice(localAmount * item.price), [localAmount, item.price])

    return (
        <TouchableOpacity
            style={styles.Item}
            activeOpacity={0.5}
            onPress={() => {
                if (isNavigatingRef.current) return
                isNavigatingRef.current = true
                
                performanceMonitor.logInteraction('Click Product Card', item.name.substring(0, 30))
                console.log('📦 ProductCard stock info:', {
                    name: item.name?.substring(0, 50),
                    stock: item.stock,
                    inCart: inCart,
                    currentAmount: cartItem?.amount || 0
                });
                navigation.navigate('product' as never, { id: item.id } as never)
                
                setTimeout(() => {
                    isNavigatingRef.current = false
                }, 500)
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
                        {`${formatPrice(item.price)} ₽ / ${item.weighed ? "кг" : "шт"}`}
                    </Txt>
                    <Txt size={14} color="#666">
                        Итого: {totalPrice} ₽
                    </Txt>
                </View>
            </View>

            <View style={styles.Box}>
                <Counter
                    amount={localAmount}
                    step={step}
                    onChange={(value) => {
                        setLocalAmount(value)
                        setSelectedAmount(item.id, value)
                    }}
                    sign={item.weighed ? "кг" : ""}
                    max={item.stock}
                    isSmall
                />

                <Button
                    onClick={() => {
                        if (!inCart) {
                            performanceMonitor.logInteraction('Add to Cart', item.name.substring(0, 30))
                            const cartData = cartList.find(i => i.id === item.id)
                            const currentInCart = item.weighed 
                                ? (cartData?.weight || 0)
                                : (cartData?.amount || 0)
                            const newTotal = item.weighed ? currentInCart + localAmount : currentInCart + localAmount
                            
                            console.log('🛒 Adding to cart:', {
                                name: item.name?.substring(0, 50),
                                stock: item.stock,
                                currentInCart: currentInCart,
                                adding: localAmount,
                                newTotal: newTotal,
                                willBlock: item.stock !== undefined && newTotal > item.stock
                            });
                            
                            if (item.stock !== undefined && newTotal > item.stock) {
                                setMessage('На складе недостаточно товара', 'error')
                                return
                            }
                            
                            addItemToCart({
                                amount: item.weighed ? 1 : localAmount,
                                id: item.id,
                                image: item.image,
                                name: item.name,
                                price: item.price,
                                isWeighted: item.weighed,
                                weight: item.weighed ? localAmount : undefined,
                                stock: item.stock
                            })
                            clearSelectedAmount(item.id)
                        } else {
                            performanceMonitor.logInteraction('Go to Cart', 'ProductCard')
                            navigation.navigate('cart' as never)
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

export default React.memo(ProductCard, (prevProps, nextProps) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.price === nextProps.item.price &&
        prevProps.item.stock === nextProps.item.stock &&
        prevProps.width === nextProps.width
    )
})

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
