import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useEffect, useState, useMemo, memo } from 'react'
import Txt from './Text'
import Counter from './Counter'
import Button from './Button'
import { ProductType } from '../types'
import useCartStore from '../store/cart'
import { useNavigation } from '@react-navigation/native'
import { formatPrice } from '../functions'
import OptimizedImage from './OptimizedImage'
import { roundAmount } from '../utils/roundAmount'
import useDeliveryStore from '../store/delivery'

interface Props {
    item: ProductType
    width?: number
}

const ProductCard: FC<Props> = ({ item, width }) => {
    const navigation = useNavigation()
    const addItemToCart = useCartStore(state => state.addItemToCart)
    const cartList = useCartStore(state => state.cartList)
    const { deliveryData } = useDeliveryStore()
    
    const cartItem = useMemo(() => 
        cartList.find(i => i.id === item.id), 
        [cartList, item.id]
    )
    
    const inCart = !!cartItem
    const initialAmount = useMemo(() => {
        if (cartItem) {
            return item.weighed && cartItem.weight !== undefined ? cartItem.weight : cartItem.amount
        }
        return item.weighed ? 0.1 : 1
    }, [cartItem, item.weighed])
    
    const [amount, setAmount] = useState(initialAmount)

    // Синхронизируем amount с корзиной
    useEffect(() => {
        if (cartItem) {
            const newAmount = item.weighed && cartItem.weight !== undefined ? cartItem.weight : cartItem.amount
            setAmount(newAmount)
        }
    }, [cartItem, item.weighed])

    const isGreenPrice = useMemo(() => item.isGreenPrice === true, [item.isGreenPrice])
    const isSelfPickup = useMemo(() => deliveryData?.type === 1, [deliveryData?.type])
    const isGreenPriceBlockedBySelfPickup = useMemo(() => 
        isGreenPrice && isSelfPickup, 
        [isGreenPrice, isSelfPickup]
    )

    const discountedPrice = useMemo(() => 
        isGreenPrice ? item.price * 0.93 : item.price, 
        [isGreenPrice, item.price]
    )

    const step = useMemo(() => item.weighed ? 0.1 : 1, [item.weighed])
    const totalPrice = useMemo(() => formatPrice(amount * discountedPrice), [amount, discountedPrice])
    
    const priceText = useMemo(() => {
        if (isGreenPrice) {
            return `${formatPrice(discountedPrice)} ₽ / ${item.weighed ? "кг" : "шт"}`;
        }
        return `${formatPrice(item.price)} ₽ / ${item.weighed ? "кг" : "шт"}`;
    }, [isGreenPrice, discountedPrice, item.price, item.weighed])
    
    const totalPriceText = useMemo(() => `Итого: ${totalPrice} ₽`, [totalPrice])

    const isOutOfStock = useMemo(() => 
        item.stock !== undefined && item.stock <= 0, 
        [item.stock]
    )

    const handleAddToCart = useCallback(() => {
        const { setMessage } = require('../store/notification').default.getState()
        
        if (isGreenPriceBlockedBySelfPickup) {
            setMessage('Зелёные ценники доступны только при доставке!', 'error')
            return
        }
        
        if (isOutOfStock) {
            setMessage('Товар отсутствует в наличии', 'error')
            return
        }
        
        if (item.stock !== undefined && amount > item.stock) {
            setMessage('На складе недостаточно товара', 'error')
            return
        }
        
        addItemToCart({
            amount: item.weighed ? 1 : amount,
            id: item.id,
            image: item.image,
            name: item.name,
            price: discountedPrice,
            isWeighted: item.weighed,
            weight: item.weighed ? amount : undefined,
            stock: item.stock
        })
    }, [item, amount, addItemToCart, isOutOfStock, isGreenPriceBlockedBySelfPickup, discountedPrice])
    
    const handleProductPress = useCallback(() => {
        navigation.navigate('product' as never, { id: item.id } as never)
    }, [item.id, navigation])
    
    const handleAmountChange = useCallback((value: number) => {
        setAmount(roundAmount(value, item.weighed))
    }, [item.weighed])

    const buttonBackground = useMemo(() => {
        if (isGreenPriceBlockedBySelfPickup) return "#CCCCCC"
        if (isOutOfStock) return "#CCCCCC"
        if (inCart) return "#EEEEEE"
        return "#4FBD01"
    }, [isGreenPriceBlockedBySelfPickup, isOutOfStock, inCart])

    const buttonText = useMemo(() => {
        if (isGreenPriceBlockedBySelfPickup) return "Только при доставке"
        if (isOutOfStock) return "Нет в наличии"
        if (inCart) return "В корзине"
        return "В корзину"
    }, [isGreenPriceBlockedBySelfPickup, isOutOfStock, inCart])

    const buttonTextColor = useMemo(() => {
        if (isGreenPriceBlockedBySelfPickup) return "#666666"
        if (isOutOfStock) return "#666666"
        if (inCart) return "#4D4D4D"
        return "#fff"
    }, [isGreenPriceBlockedBySelfPickup, isOutOfStock, inCart])

    return (
        <TouchableOpacity
            style={styles.Item}
            activeOpacity={0.5}
            onPress={handleProductPress}
        >
            <View style={styles.Content}>
                <OptimizedImage
                    productId={item.id}
                    index={0}
                    style={styles.Image}
                    resizeMode="cover"
                    emptyStyle={styles.Empty}
                />

                <View style={styles.Info}>
                    <Txt numberOfLines={2}>{item.name}</Txt>
                    {isGreenPrice && (
                        <View style={styles.PriceRow}>
                            <Txt weight='RobotoCondensed-Regular' size={14} color="#999" style={styles.OldPrice}>
                                {formatPrice(item.price)} ₽
                            </Txt>
                            <Txt weight='RobotoCondensed-Bold' color="#4FBD01" size={16}>
                                {priceText}
                            </Txt>
                        </View>
                    )}
                    {!isGreenPrice && (
                        <Txt weight='RobotoCondensed-Bold'>
                            {priceText}
                        </Txt>
                    )}
                    <Txt size={14} color="#666">
                        {totalPriceText}
                    </Txt>
                </View>
            </View>

            <View style={styles.Box}>
                <Counter
                    amount={amount}
                    step={step}
                    onChange={handleAmountChange}
                    sign={item.weighed ? "кг" : ""}
                    max={item.stock}
                    isSmall
                    disabled={isOutOfStock}
                />

                <Button
                    onClick={handleAddToCart}
                    background={buttonBackground}
                    disabled={isOutOfStock || isGreenPriceBlockedBySelfPickup}
                >
                    <Txt color={buttonTextColor} weight='RobotoCondensed-Bold' size={18}>
                        {buttonText}
                    </Txt>
                </Button>
            </View>
        </TouchableOpacity>
    )
}

ProductCard.displayName = 'ProductCard'

// Мемоизируем компонент для предотвращения лишних ре-рендеров
export default memo(ProductCard, (prevProps, nextProps) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.price === nextProps.item.price &&
        prevProps.item.stock === nextProps.item.stock &&
        prevProps.item.isGreenPrice === nextProps.item.isGreenPrice &&
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
    },
    Info: {
        marginTop: 16,
        gap: 4
    },
    Box: {
        marginTop: 20,
        gap: 16,
    },
    PriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
    },
    OldPrice: {
        textDecorationLine: 'line-through',
        textDecorationStyle: 'solid'
    }
})
