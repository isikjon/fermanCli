import { StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import Txt from '../../../ui/Text'
import Counter from '../../../ui/Counter'
import Button from '../../../ui/Button'
import Row from '../../../components/Row'
import useCatalogStore from '../../../store/catalog'
import useCartStore from '../../../store/cart'
import { useNavigation } from '@react-navigation/native'

const Controlls = () => {
    const { activeProduct } = useCatalogStore()
    const [amount, setAmount] = useState(1)
    const [weightAmount, setWeightAmount] = useState(0.1)
    const [inCart, setInCart] = useState(false)
    const { addItemToCart, cartList } = useCartStore()
    const navigation = useNavigation()

    const checkInCart = useCallback(() => {
        if (cartList.some(i => i.id === activeProduct?.id)) {
            const cartData = cartList.find(i => i.id === activeProduct?.id)
            cartData && setAmount(cartData.amount)
            setInCart(true)
        } else {
            setInCart(false)
        }
    }, [cartList, activeProduct])

    useEffect(() => {
        checkInCart()
    }, [checkInCart])

    if (!activeProduct) return null

    // Попытка определить остаток из возможных полей продукта
    const rawStock = (activeProduct as any)?.stock ?? (activeProduct as any)?.left ?? (activeProduct as any)?.balance ?? (activeProduct as any)?.available
    const maxStock = typeof rawStock === 'number' ? rawStock : undefined

    return (
        <View style={styles.Box}>
            <Row gap={20}>
                <View style={styles.FlexBox}>
                    <Txt weight='Jingleberry' size={26} lineHeight={30}>{activeProduct.name}</Txt>
                </View>

                <View style={styles.Price}>
                    <Txt weight='Bold' size={activeProduct.weighed ? 20 : 24}>
                        {(activeProduct.price * (activeProduct.weighed ? weightAmount : 1)).toFixed()} руб.
                    </Txt>
                    <Txt size={16}>{activeProduct.weighed ? "за кг" : "шт"}</Txt>
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
                                addItemToCart({
                                    amount,
                                    id: activeProduct.id,
                                    image: activeProduct.image,
                                    name: activeProduct.name,
                                    price: activeProduct.price,
                                    isWeighted: activeProduct.weighed,
                                    weight: weightAmount
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
