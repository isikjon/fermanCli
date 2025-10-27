import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useMemo, memo } from 'react'
import Txt from './Text'
import Row from '../components/Row'
import Button from './Button'
import useCartStore from '../store/cart'
import { IFavorite } from '../types'
import useFavoriteStore from '../store/favorite'
import { useNavigation } from '@react-navigation/native'
import { formatPrice } from '../functions'
import OptimizedImage from './OptimizedImage'

interface Props {
    item: IFavorite
}

const FavoriteCard: FC<Props> = ({ item }) => {
    const navigation = useNavigation()
    const cartList = useCartStore(state => state.cartList)
    const addItemToCart = useCartStore(state => state.addItemToCart)
    const removeItemFromFav = useFavoriteStore(state => state.removeItemFromFav)
    
    // Проверяем наличие в корзине
    const inCart = useMemo(() => 
        cartList.some(i => i.id === item.id), 
        [cartList, item.id]
    )
    
    const price = useMemo(() => 
        formatPrice(item.isWeighted ? item.price * (item.weight || 0.1) : item.price),
        [item.isWeighted, item.price, item.weight]
    )
    
    const priceText = useMemo(() => 
        `${price} руб. / ${item.isWeighted ? `${item.weight || 0.1} кг` : "шт"}`,
        [price, item.isWeighted, item.weight]
    )
    
    const handleProductPress = useCallback(() => {
        navigation.navigate('product' as never, { id: item.id } as never)
    }, [item.id, navigation])
    
    const handleRemove = useCallback(() => {
        removeItemFromFav(item.id)
    }, [item.id, removeItemFromFav])
    
    const handleAddToCart = useCallback(() => {
        addItemToCart({ amount: 1, ...item })
    }, [item, addItemToCart])

    return (
        <View style={styles.FavoriteCard}>
            <TouchableOpacity
                activeOpacity={0.5}
                onPress={handleProductPress}
            >
                <Row gap={24}>
                    <OptimizedImage
                        productId={item.id}
                        index={0}
                        style={styles.Image}
                        resizeMode="cover"
                        emptyStyle={styles.Empty}
                    />

                    <View style={styles.Title}>
                        <Txt weight='RobotoCondensed-Bold' size={16} numberOfLines={3}>{item.name}</Txt>
                        <Txt>{priceText}</Txt>
                    </View>
                </Row>
            </TouchableOpacity>

            <Row gap={10}>
                <View style={styles.Flex}>
                    <Button background="#EEEEEE" onClick={handleRemove}>
                        <Txt color="#4D4D4D" weight='RobotoCondensed-Bold' size={16}>Удалить</Txt>
                    </Button>
                </View>

                {!inCart && (
                    <View style={styles.Flex}>
                        <Button onClick={handleAddToCart}>
                            <Txt color="#fff" weight='RobotoCondensed-Bold' size={16}>В корзину</Txt>
                        </Button>
                    </View>
                )}
            </Row>
        </View>
    )
}

FavoriteCard.displayName = 'FavoriteCard'

export default memo(FavoriteCard, (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id &&
           prevProps.item.price === nextProps.item.price &&
           prevProps.item.weight === nextProps.item.weight
})

const styles = StyleSheet.create({
    Image: {
        width: 75,
        height: 75,
        borderRadius: 12,
        resizeMode: "cover",
    },
    Empty: {
        width: 75,
        height: 75,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#15151580",
        alignItems: "center",
        justifyContent: "center"
    },
    Title: {
        flex: 1,
        width: "100%",
        gap: 4
    },
    Flex: {
        flex: 1
    },
    FavoriteCard: {
        gap: 12
    }
})
