import { StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import Txt from '../../../ui/Text'
import Counter from '../../../ui/Counter'
import Button from '../../../ui/Button'
import Row from '../../../components/Row'
import useCatalogStore from '../../../store/catalog'
import useCartStore from '../../../store/cart'
import useNotificationStore from '../../../store/notification'
import { useNavigation } from '@react-navigation/native'
import { formatPrice } from '../../../functions'

const Controlls = () => {
    const { activeProduct, setSelectedAmount, getSelectedAmount, clearSelectedAmount } = useCatalogStore()
    const { addItemToCart, cartList } = useCartStore()
    const { setMessage } = useNotificationStore()
    const navigation = useNavigation()
    const [inCart, setInCart] = useState(false)
    
    const cartItem = cartList.find(i => i.id === activeProduct?.id)
    const [amount, setAmount] = useState(1)
    const [weightAmount, setWeightAmount] = useState(0.1)

    const checkInCart = useCallback(() => {
        if (cartList.some(i => i.id === activeProduct?.id)) {
            const cartData = cartList.find(i => i.id === activeProduct?.id)
            if (cartData) {
                if (activeProduct?.weighed && cartData.weight !== undefined) {
                    setWeightAmount(cartData.weight)
                } else {
                    setAmount(cartData.amount)
                }
            }
            setInCart(true)
        } else {
            setInCart(false)
            if (activeProduct?.id) {
                const savedAmount = getSelectedAmount(activeProduct.id)
                if (savedAmount !== undefined) {
                    if (activeProduct.weighed) {
                        setWeightAmount(savedAmount)
                    } else {
                        setAmount(savedAmount)
                    }
                } else {
                    setAmount(1)
                    setWeightAmount(0.1)
                }
            }
        }
    }, [cartList, activeProduct])

    useEffect(() => {
        checkInCart()
    }, [checkInCart])

    if (!activeProduct) return null

    const maxStock = activeProduct.stock
    const isOutOfStock = maxStock !== undefined && maxStock <= 0

    // Логируем остатки товара
    useEffect(() => {
        console.log('📦 Product page stock info:', {
            name: activeProduct.name?.substring(0, 50),
            id: activeProduct.id,
            stock: activeProduct.stock,
            isOutOfStock: isOutOfStock,
            inCart: inCart,
            currentAmount: activeProduct.weighed ? weightAmount : amount
        });
    }, [activeProduct, inCart, amount, weightAmount, isOutOfStock]);

    const totalPrice = formatPrice(activeProduct.price * (activeProduct.weighed ? weightAmount : 1))

    return (
        <View style={styles.Box}>
            <Row gap={12}>
                <View style={styles.FlexBox}>
                    <Txt weight='Jingleberry' size={22} lineHeight={26}>{activeProduct.name}</Txt>
                    {maxStock !== undefined && !isOutOfStock && (
                        <Txt size={14} color="#999" style={{ marginTop: 4 }}>
                            Осталось: {maxStock} {activeProduct.weighed ? 'кг' : 'шт'}
                        </Txt>
                    )}
                    {isOutOfStock && (
                        <Txt size={14} color="#FF6B6B" weight='RobotoCondensed-Bold' style={{ marginTop: 4 }}>
                            Товар закончился
                        </Txt>
                    )}
                </View>

                <View style={styles.Price}>
                    <Txt weight='Bold' size={20} style={{ minWidth: 80, textAlign: 'right' }}>
                        {totalPrice} руб.
                    </Txt>
                    <Txt size={14} color="#666">{activeProduct.weighed ? `${weightAmount.toFixed(1)} кг` : "за шт"}</Txt>
                </View>
            </Row>

            <Row>
                {!inCart && !isOutOfStock && (
                    <Counter 
                        amount={activeProduct.weighed ? weightAmount : amount} 
                        onChange={(value) => {
                            if (activeProduct.weighed) {
                                setWeightAmount(value)
                            } else {
                                setAmount(value)
                            }
                            if (activeProduct.id) {
                                setSelectedAmount(activeProduct.id, value)
                            }
                        }}
                        step={activeProduct.weighed ? 0.1 : 1}
                        min={activeProduct.weighed ? 0.1 : 1}
                        sign={activeProduct.weighed ? "кг" : ""}
                        max={maxStock}
                        isNotFull
                    />
                )}
                <View style={styles.FlexBox}>
                    <Button
                        onClick={() => {
                            if (isOutOfStock) {
                                setMessage('Товар закончился на складе', 'error')
                                return
                            }
                            
                            if (activeProduct && !inCart) {
                                const cartData = cartList.find(i => i.id === activeProduct.id)
                                const currentInCart = activeProduct.weighed 
                                    ? (cartData?.weight || 0)
                                    : (cartData?.amount || 0)
                                const addingAmount = activeProduct.weighed ? weightAmount : amount
                                const newTotal = currentInCart + addingAmount
                                
                                console.log('🛒 Adding to cart from product page:', {
                                    name: activeProduct.name?.substring(0, 50),
                                    stock: maxStock,
                                    currentInCart: currentInCart,
                                    adding: addingAmount,
                                    newTotal: newTotal,
                                    willBlock: maxStock !== undefined && newTotal > maxStock
                                });
                                
                                if (maxStock !== undefined && newTotal > maxStock) {
                                    setMessage('На складе недостаточно товара', 'error')
                                    return
                                }
                                
                                addItemToCart({
                                    amount: activeProduct.weighed ? 1 : amount,
                                    id: activeProduct.id,
                                    image: activeProduct.image,
                                    name: activeProduct.name,
                                    price: activeProduct.price,
                                    isWeighted: activeProduct.weighed,
                                    weight: weightAmount,
                                    stock: maxStock
                                })
                                clearSelectedAmount(activeProduct.id)
                            } else {
                                navigation.navigate('cart')
                            }
                        }}
                        background={isOutOfStock ? "#CCCCCC" : (inCart ? "#EEEEEE" : "#4FBD01")}
                        height={56}
                    >
                        <Txt color={isOutOfStock ? "#666666" : (inCart ? "#4D4D4D" : "#fff")} weight='RobotoCondensed-Bold' size={18}>
                            {isOutOfStock ? "Нет в наличии" : (inCart ? "В корзине" : "В корзину")}
                        </Txt>
                    </Button>
                </View>
            </Row>
        </View>
    )
}

export default Controlls

const styles = StyleSheet.create({
    Box: {
        paddingHorizontal: 16,
        marginVertical: 16,
        gap: 32
    },
    FlexBox: {
        width: "100%",
        flex: 1,
    },
    Price: {
        gap: 4,
        alignItems: "flex-end"
    },
    WeightBox: {
        alignItems: "flex-end"
    }
})
