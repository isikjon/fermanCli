import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native'
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
    const setItemInCart = useCartStore(state => state.setItemInCart)
    const removeItemFromCart = useCartStore(state => state.removeItemFromCart)
    const changeCartItem = useCartStore(state => state.changeCartItem)
    const cartList = useCartStore(state => state.cartList)
    const { deliveryData } = useDeliveryStore()
    
    const cartItem = useMemo(() => 
        cartList.find(i => i.id === item.id), 
        [cartList, item.id]
    )

    const cartStoreId = useMemo(() => {
        const stored = cartList.find(i => i.storeId)
        return stored?.storeId || null
    }, [cartList])
    
    const inCart = !!cartItem
    const initialAmount = useMemo(() => {
        if (cartItem) {
            const amt = item.weighed && cartItem.weight !== undefined ? cartItem.weight : cartItem.amount
            console.log('📦 [ProductCard] Initial amount from cart:', {
                id: item.id,
                name: item.name.substring(0, 30),
                amount: amt,
                isWeighed: item.weighed
            });
            return amt
        }
        console.log('📦 [ProductCard] Initial amount (not in cart):', {
            id: item.id,
            name: item.name.substring(0, 30),
            amount: item.weighed ? 0.1 : 1
        });
        return item.weighed ? 0.1 : 1
    }, [cartItem, item.weighed, item.id, item.name])
    
    const [amount, setAmount] = useState(initialAmount)

    useEffect(() => {
        if (cartItem) {
            const newAmount = item.weighed && cartItem.weight !== undefined ? cartItem.weight : cartItem.amount
            console.log('📦 [ProductCard] Syncing amount from cart:', {
                id: item.id,
                name: item.name.substring(0, 30),
                oldAmount: amount,
                newAmount: newAmount
            });
            setAmount(newAmount)
        } else {
            const resetAmount = item.weighed ? 0.1 : 1
            console.log('📦 [ProductCard] Resetting amount (not in cart):', {
                id: item.id,
                name: item.name.substring(0, 30),
                resetTo: resetAmount
            });
            setAmount(resetAmount)
        }
    }, [cartItem, item.weighed, item.id, item.name])

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
        
        console.log('➕ [ProductCard] Add to cart button clicked:', {
            id: item.id,
            name: item.name.substring(0, 30),
            amount: amount,
            inCart: inCart,
            isOutOfStock: isOutOfStock
        });

        if (cartStoreId && item.storeId && cartStoreId !== item.storeId) {
            console.log('❌ [ProductCard] Blocked: store mismatch', { cartStoreId, itemStoreId: item.storeId })
            setMessage('Этот товар доступен на другом складе. Завершите текущий заказ или очистите корзину.', 'error')
            return
        }

        if (cartStoreId && !item.storeId) {
            console.log('❌ [ProductCard] Blocked: item without store for existing cart store', { cartStoreId })
            setMessage('Не удалось определить склад для товара. Попробуйте обновить список или оформить отдельный заказ.', 'error')
            return
        }

        if (isGreenPriceBlockedBySelfPickup) {
            console.log('❌ [ProductCard] Blocked: Green price with self-pickup');
            setMessage('Зелёные ценники доступны только при доставке!', 'error')
            return
        }
        
        if (inCart) {
            console.log('🛒 [ProductCard] Navigating to cart (item already in cart)');
            navigation.navigate('cart' as never)
            return
        }
        
        if (isOutOfStock) {
            console.log('❌ [ProductCard] Blocked: Out of stock');
            setMessage('Товар отсутствует в наличии', 'error')
            return
        }
        
        if (item.stock !== undefined && amount > item.stock) {
            console.log('❌ [ProductCard] Blocked: Not enough stock', { amount, stock: item.stock });
            setMessage('На складе недостаточно товара', 'error')
            return
        }
        
        console.log('✅ [ProductCard] Adding to cart:', {
            amount: item.weighed ? 1 : amount,
            weight: item.weighed ? amount : undefined,
            isWeighted: item.weighed
        });

        setItemInCart({
            amount: item.weighed ? 1 : amount,
            id: item.id,
            image: item.image,
            name: item.name,
            price: discountedPrice,
            isWeighted: item.weighed,
            weight: item.weighed ? amount : undefined,
            stock: item.stock,
            stockByStore: item.stockByStore,
            storeId: item.storeId
        })
    }, [item, amount, setItemInCart, removeItemFromCart, isOutOfStock, inCart, isGreenPriceBlockedBySelfPickup, discountedPrice, navigation])
    
    const handleProductPress = useCallback(() => {
        navigation.navigate('product' as never, { id: item.id } as never)
    }, [item.id, navigation])
    
    const handleAmountChange = useCallback((value: number) => {
        const roundedValue = roundAmount(value, item.weighed)
        console.log('🔄 [ProductCard] Amount changed:', {
            id: item.id,
            name: item.name.substring(0, 30),
            oldAmount: amount,
            newAmount: roundedValue,
            inCart: inCart
        });

        setAmount(roundedValue)

        if (inCart && cartItem) {
            console.log('🔄 [ProductCard] Updating cart directly (item already in cart)');
            if (item.weighed) {
                changeCartItem(item.id, { ...cartItem, weight: roundedValue })
            } else {
                changeCartItem(item.id, { ...cartItem, amount: roundedValue })
            }
        }
    }, [item.weighed, item.id, item.name, amount, inCart, cartItem, changeCartItem])

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

    const screenWidth = Dimensions.get('window').width
    const isSmallScreen = screenWidth < 360
    
    const buttonTextSize = useMemo(() => {
        if (isGreenPriceBlockedBySelfPickup) {
            return isSmallScreen ? 13 : 15
        }
        return 18
    }, [isGreenPriceBlockedBySelfPickup, isSmallScreen])

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
                    disabled={(isOutOfStock && !inCart) || isGreenPriceBlockedBySelfPickup}
                >
                    <Txt color={buttonTextColor} weight='RobotoCondensed-Bold' size={buttonTextSize}>
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
