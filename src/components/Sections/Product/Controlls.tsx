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

const Controlls = () => {
    const { activeProduct } = useCatalogStore()
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
            setAmount(1)
            setWeightAmount(0.1)
        }
    }, [cartList, activeProduct])

    useEffect(() => {
        checkInCart()
    }, [checkInCart])

    if (!activeProduct) return null

    const maxStock = activeProduct.stock

    const totalPrice = (activeProduct.price * (activeProduct.weighed ? weightAmount : 1)).toFixed()

    return (
        <View style={styles.Box}>
            <Row gap={12}>
                <View style={styles.FlexBox}>
                    <Txt weight='Jingleberry' size={22} lineHeight={26}>{activeProduct.name}</Txt>
                    {maxStock !== undefined && (
                        <Txt size={14} color="#999" style={{ marginTop: 4 }}>
                            Осталось: {maxStock} {activeProduct.weighed ? 'кг' : 'шт'}
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
                {!inCart && (
                    <Counter 
                        amount={activeProduct.weighed ? weightAmount : amount} 
                        onChange={activeProduct.weighed ? setWeightAmount : setAmount}
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
                            if (activeProduct && !inCart) {
                                const cartData = cartList.find(i => i.id === activeProduct.id)
                                const currentInCart = activeProduct.weighed 
                                    ? (cartData?.weight || 0)
                                    : (cartData?.amount || 0)
                                const addingAmount = activeProduct.weighed ? weightAmount : amount
                                const newTotal = currentInCart + addingAmount
                                
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
                            } else {
                                navigation.navigate('cart')
                            }
                        }}
                        background={inCart ? "#EEEEEE" : "#4FBD01"}
                        height={56}
                    >
                        <Txt color={inCart ? "#4D4D4D" : "#fff"} weight='Bold' size={18}>
                            {inCart ? "В корзине" : "В корзину"}
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
