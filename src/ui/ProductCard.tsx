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

interface Props {
    item: ProductType
    width?: number
}

const ProductCard: FC<Props> = ({ item, width }) => {
    const navigation = useNavigation()
    const addItemToCart = useCartStore(state => state.addItemToCart)
    const cartList = useCartStore(state => state.cartList)
    
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

    // Мемоизируем вычисления
    const step = useMemo(() => item.weighed ? 0.1 : 1, [item.weighed])
    const totalPrice = useMemo(() => formatPrice(amount * item.price), [amount, item.price])
    const priceText = useMemo(() => 
        `${formatPrice(item.price)} ₽ / ${item.weighed ? "кг" : "шт"}`, 
        [item.price, item.weighed]
    )
    const totalPriceText = useMemo(() => `Итого: ${totalPrice} ₽`, [totalPrice])

    const handleAddToCart = useCallback(() => {
        const { setMessage } = require('../store/notification').default.getState()
        
        if (item.stock !== undefined && amount > item.stock) {
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
    }, [item, amount, addItemToCart])
    
    const handleProductPress = useCallback(() => {
        navigation.navigate('product' as never, { id: item.id } as never)
    }, [item.id, navigation])
    
    const handleAmountChange = useCallback((value: number) => {
        setAmount(Number(value.toFixed(2)))
    }, [])

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
                    <Txt weight='RobotoCondensed-Bold'>
                        {priceText}
                    </Txt>
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
                />

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

// Мемоизируем компонент для предотвращения лишних ре-рендеров
export default memo(ProductCard, (prevProps, nextProps) => {
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
