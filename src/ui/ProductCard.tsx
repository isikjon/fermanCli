import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useEffect, useState, useMemo } from 'react'
import FastImage from 'react-native-fast-image'
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
import { MOYSKLAD_TOKEN } from '../api/functions/products'

interface Props {
    item: ProductType
    width?: number
}

const ProductCard: FC<Props> = ({ item, width }) => {
    const navigation = useNavigation()
    const { getImage, setSelectedAmount, getSelectedAmount, clearSelectedAmount } = useCatalogStore()
    const { addItemToCart, cartList } = useCartStore()
    const { setMessage } = useNotificationStore()
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
        setImage(imageMetadata || null)
    }, [item.image, getImage])

    useEffect(() => {
        getImageUrl()
    }, [getImageUrl])

    const step = useMemo(() => item.weighed ? 0.1 : 1, [item.weighed])
    const totalPrice = useMemo(() => formatPrice(localAmount * item.price), [localAmount, item.price])
    const isOutOfStock = useMemo(() => item.stock !== undefined && item.stock <= 0, [item.stock])
    
    const handleAmountChange = useCallback((value: number) => {
        setLocalAmount(value)
        setSelectedAmount(item.id, value)
    }, [item.id, setSelectedAmount])
    
    const handleAddToCart = useCallback(() => {
        if (isOutOfStock) {
            setMessage('Товар закончился на складе', 'error')
            return
        }
        
        if (!inCart) {
            performanceMonitor.logInteraction('Add to Cart', item.name.substring(0, 30))
            const cartData = cartList.find(i => i.id === item.id)
            const currentInCart = item.weighed 
                ? (cartData?.weight || 0)
                : (cartData?.amount || 0)
            const newTotal = item.weighed ? currentInCart + localAmount : currentInCart + localAmount
            
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
    }, [isOutOfStock, inCart, item, localAmount, cartList, setMessage, addItemToCart, clearSelectedAmount, navigation])
    
    const handleProductPress = useCallback(() => {
        performanceMonitor.logInteraction('Click Product Card', item.name.substring(0, 30))
        navigation.navigate('product' as never, { id: item.id } as never)
    }, [item.id, item.name, navigation])

    return (
        <TouchableOpacity
            style={styles.Item}
            activeOpacity={0.5}
            onPress={handleProductPress}
        >
            <View style={styles.Content}>
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
                    <View style={styles.Empty}><Empty /></View>
                )}

                <View style={styles.Info}>
                    <Txt>{item.name}</Txt>
                    <Txt weight='RobotoCondensed-Bold'>
                        {`${formatPrice(item.price)} ₽ / ${item.weighed ? "кг" : "шт"}`}
                    </Txt>
                    {!isOutOfStock ? (
                        <Txt size={14} color="#666">
                            Итого: {totalPrice} ₽
                        </Txt>
                    ) : (
                        <Txt size={14} color="#FF6B6B" weight='RobotoCondensed-Bold'>
                            Нет в наличии
                        </Txt>
                    )}
                </View>
            </View>

            <View style={styles.Box}>
                {!isOutOfStock && (
                    <Counter
                        amount={localAmount}
                        step={step}
                        onChange={handleAmountChange}
                        sign={item.weighed ? "кг" : ""}
                        max={item.stock}
                        isSmall
                    />
                )}

                <Button
                    onClick={handleAddToCart}
                    background={isOutOfStock ? "#CCCCCC" : (inCart ? "#EEEEEE" : "#4FBD01")}
                >
                    <Txt color={isOutOfStock ? "#666666" : (inCart ? "#4D4D4D" : "#fff")} weight='RobotoCondensed-Bold' size={18}>
                        {isOutOfStock ? "Недоступно" : (inCart ? "В корзине" : "В корзину")}
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
