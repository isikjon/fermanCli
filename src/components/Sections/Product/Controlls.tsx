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
    const { setItemInCart, removeItemFromCart, changeCartItem, cartList } = useCartStore()
    const { setMessage } = useNotificationStore()
    const navigation = useNavigation()
    const [inCart, setInCart] = useState(false)
    
    const cartItem = cartList.find(i => i.id === activeProduct?.id)
    const [amount, setAmount] = useState(1)
    const [weightAmount, setWeightAmount] = useState(0.1)

    const checkInCart = useCallback(() => {
        console.log('🔍 [Controlls] Checking if in cart:', {
            productId: activeProduct?.id,
            productName: activeProduct?.name?.substring(0, 30)
        });

        if (cartList.some(i => i.id === activeProduct?.id)) {
            const cartData = cartList.find(i => i.id === activeProduct?.id)
            if (cartData) {
                console.log('✅ [Controlls] Found in cart:', {
                    amount: cartData.amount,
                    weight: cartData.weight,
                    isWeighted: activeProduct?.weighed
                });

                if (activeProduct?.weighed && cartData.weight !== undefined) {
                    setWeightAmount(cartData.weight)
                } else {
                    setAmount(cartData.amount)
                }
            }
            setInCart(true)
        } else {
            console.log('❌ [Controlls] Not in cart');
            setInCart(false)
            if (activeProduct?.id) {
                const savedAmount = getSelectedAmount(activeProduct.id)
                if (savedAmount !== undefined) {
                    console.log('📝 [Controlls] Restoring saved amount:', savedAmount);
                    if (activeProduct.weighed) {
                        setWeightAmount(savedAmount)
                    } else {
                        setAmount(savedAmount)
                    }
                } else {
                    console.log('🔄 [Controlls] Resetting to default');
                    setAmount(1)
                    setWeightAmount(0.1)
                }
            }
        }
    }, [cartList, activeProduct, getSelectedAmount])

    useEffect(() => {
        checkInCart()
    }, [checkInCart])

    if (!activeProduct) return null

    const maxStock = activeProduct.stock
    const isOutOfStock = maxStock !== undefined && maxStock <= 0

    const totalPrice = formatPrice(activeProduct.price * (activeProduct.weighed ? weightAmount : 1))

    const buttonBackground = isOutOfStock ? "#CCCCCC" : (inCart ? "#EEEEEE" : "#4FBD01")
    const buttonText = isOutOfStock ? "Нет в наличии" : (inCart ? "В корзине" : "В корзину")
    const buttonTextColor = isOutOfStock ? "#666666" : (inCart ? "#4D4D4D" : "#fff")

    return (
        <View style={styles.Box}>
            <Row gap={12}>
                <View style={styles.FlexBox}>
                    <Txt weight='Jingleberry' size={20} lineHeight={24} numberOfLines={3}>{activeProduct.name}</Txt>
                </View>

                <View style={styles.Price}>
                    <Txt weight='Bold' size={20} style={{ minWidth: 80, textAlign: 'right' }}>
                        {totalPrice} руб.
                    </Txt>
                    <Txt size={14} color="#666">{activeProduct.weighed ? `${weightAmount.toFixed(1)} кг` : "за шт"}</Txt>
                </View>
            </Row>

            <Row>
                <Counter 
                    amount={activeProduct.weighed ? weightAmount : amount} 
                    onChange={(value) => {
                        console.log('🔄 [Controlls] Counter changed:', {
                            productId: activeProduct.id,
                            productName: activeProduct.name?.substring(0, 30),
                            oldValue: activeProduct.weighed ? weightAmount : amount,
                            newValue: value,
                            inCart: inCart,
                            isWeighed: activeProduct.weighed
                        });

                        if (activeProduct.weighed) {
                            setWeightAmount(value)
                        } else {
                            setAmount(value)
                        }

                        if (activeProduct.id) {
                            setSelectedAmount(activeProduct.id, value)

                            if (inCart && cartItem) {
                                console.log('🔄 [Controlls] Updating cart directly (item already in cart)');
                                if (activeProduct.weighed) {
                                    changeCartItem(activeProduct.id, { ...cartItem, weight: value })
                                } else {
                                    changeCartItem(activeProduct.id, { ...cartItem, amount: value })
                                }
                            }
                        }
                    }}
                    step={activeProduct.weighed ? 0.1 : 1}
                    min={activeProduct.weighed ? 0.1 : 1}
                    sign={activeProduct.weighed ? "кг" : ""}
                    max={maxStock}
                    isNotFull
                    disabled={isOutOfStock}
                />
                <View style={styles.FlexBox}>
                    <Button
                        onClick={() => {
                            if (activeProduct) {
                                console.log('➕ [Controlls] Button clicked:', {
                                    productId: activeProduct.id,
                                    productName: activeProduct.name?.substring(0, 30),
                                    amount: amount,
                                    weightAmount: weightAmount,
                                    inCart: inCart
                                });

                                if (inCart) {
                                    console.log('🗑️ [Controlls] Removing from cart');
                                    removeItemFromCart(activeProduct.id)
                                    setMessage('Товар удалён из корзины', 'success')
                                    return
                                }
                                
                                if (isOutOfStock) {
                                    console.log('❌ [Controlls] Blocked: Out of stock');
                                    setMessage('Товар отсутствует в наличии', 'error')
                                    return
                                }

                                const addingAmount = activeProduct.weighed ? weightAmount : amount
                                
                                if (maxStock !== undefined && addingAmount > maxStock) {
                                    console.log('❌ [Controlls] Blocked: Not enough stock', { addingAmount, maxStock });
                                    setMessage('На складе недостаточно товара', 'error')
                                    return
                                }
                                
                                console.log('✅ [Controlls] Adding to cart:', {
                                    amount: activeProduct.weighed ? 1 : amount,
                                    weight: weightAmount,
                                    isWeighted: activeProduct.weighed
                                });

                                setItemInCart({
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
                            }
                        }}
                        background={buttonBackground}
                        height={56}
                        disabled={isOutOfStock && !inCart}
                    >
                        <Txt color={buttonTextColor} weight='RobotoCondensed-Bold' size={18}>
                            {buttonText}
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
        gap: 24
    },
    FlexBox: {
        width: "100%",
        flex: 1,
        flexShrink: 1
    },
    Price: {
        gap: 4,
        alignItems: "flex-end",
        flexShrink: 0
    },
    WeightBox: {
        alignItems: "flex-end"
    }
})
