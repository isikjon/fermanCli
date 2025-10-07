import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useEffect, useState } from 'react'
import useCatalogStore from '../store/catalog'
import Empty from '../assets/svg/Empty'
import Txt from './Text'
import Row from '../components/Row'
import Button from './Button'
import useCartStore from '../store/cart'
import { IFavorite } from '../types'
import useFavoriteStore from '../store/favorite'
import { useNavigation } from '@react-navigation/native'
import { formatPrice } from '../functions'

interface Props {
    item: IFavorite
}

const FavoriteCard: FC<Props> = ({ item }) => {
    const navigation = useNavigation()
    const [image, setImage] = useState<string | null>(null)
    const { getImage } = useCatalogStore()
    const { cartList, addItemToCart } = useCartStore()
    const [inCart, setInCart] = useState(false)
    const { removeItemFromFav } = useFavoriteStore()
    const price = formatPrice(item.isWeighted ? item.price * (item.weight || 0.1) : item.price)

    const getImageUrl = useCallback(async () => {
        const imageMetadata = await getImage(item.image)
        setImage(imageMetadata || null)
    }, [item])

    const checkInCart = useCallback(() => {
        setInCart(cartList.some(i => i.id === item.id))
    }, [cartList, item])

    useEffect(() => {
        getImageUrl()
        checkInCart()
    }, [getImageUrl, checkInCart])

    return (
        <View style={styles.FavoriteCard}>
            <TouchableOpacity
                activeOpacity={0.5}
                onPress={() => navigation.navigate('product' as never, { id: item.id } as never)}
            >
                <Row gap={24}>
                    {image ? (
                        <Image style={styles.Image} source={{ uri: image }} />
                    ) : (
                        <View style={styles.Empty}><Empty width={40} height={40} /></View>
                    )}

                    <View style={styles.Title}>
                        <Txt weight='Bold' size={16} lines={3}>{item.name}</Txt>
                        <Txt>{price} руб. / {item.isWeighted ? `${item.weight || 0.1} кг` : "шт"}</Txt>
                    </View>
                </Row>
            </TouchableOpacity>

            <Row gap={10}>
                <View style={styles.Flex}>
                    <Button background="#EEEEEE" onClick={() => removeItemFromFav(item.id)}>
                        <Txt color="#4D4D4D" weight='Bold' size={16}>Удалить</Txt>
                    </Button>
                </View>

                {!inCart && (
                    <View style={styles.Flex}>
                        <Button onClick={() => addItemToCart({ amount: 1, ...item })}>
                            <Txt color="#fff" weight='Bold' size={16}>В корзину</Txt>
                        </Button>
                    </View>
                )}
            </Row>
        </View>
    )
}

export default FavoriteCard

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
