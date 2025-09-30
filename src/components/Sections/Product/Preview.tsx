import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useCallback, useEffect, useState } from 'react'
import useCatalogStore from '../../store/catalog'
import Empty from '../../../assets/svg/Empty'
import Txt from '../../../ui/Text'
import Row from '../../Row'
import Button from '../../../ui/Button'
import useCartStore from '../../store/cart'
import { IFavorite } from '../../../types'
import useFavoriteStore from '../../store/favorite'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'

// Типы для параметров навигации
type RootStackParamList = {
    Product: { productId: string }
}

const Preview = () => {
    const { getProduct, activeProduct, activeProductImage } = useCatalogStore()
    const { inFavExist, addItemToFav, removeItemFromFav, getFavoriteList } = useFavoriteStore()

    const navigation = useNavigation()
    const route = useRoute<RouteProp<RootStackParamList, 'Product'>>()
    const { productId } = route.params
    console.log(activeProductImage)
    console.log(activeProduct?.image)
    const isExist = inFavExist(productId)
    const { getImage } = useCatalogStore()
    const [image, setImage] = useState<string | null>(null)
   const getImageUrl = useCallback(async () => {

        const imageMetadata = await getImage(activeProduct?.image)
        console.log("imageMetadata",imageMetadata)
        setImage(imageMetadata || null)
    }, [activeProduct?.image])

    function handleLike() {
        if (!activeProduct) return

        const payload: IFavorite = {
            id: activeProduct?.id,
            image: activeProduct?.image,
            name: activeProduct?.name,
            price: activeProduct?.price,
            isWeighted: activeProduct?.weighed,
            weight: 0.1
        }

        isExist ? removeItemFromFav(activeProduct?.id) : addItemToFav(payload)
    }

    useEffect(() => {
        getProduct(productId)
    
    }, [productId, getProduct])

    useEffect(() => {
        getFavoriteList()
        getImageUrl()
    }, [getFavoriteList,getImageUrl])

    return (
        <View style={styles.Preview}>
            <View style={styles.ImageBox}>
                {image ? (
                    <Image style={styles.Image} source={{ uri: image }} />
                ) : (
                    <View style={styles.Empty}><Empty /></View>
                )}
            </View>

            <Row gap={20}>
                <TouchableOpacity activeOpacity={0.5} onPress={handleLike}>
                    <View style={[styles.LikeButton, isExist && styles.LikeButtonActive]}>
                        <Txt color={isExist ? "#fff" : "#4FBD01"} weight='Bold' size={18}>
                            {isExist ? "❤️" : "🤍"}
                        </Txt>
                    </View>
                </TouchableOpacity>

                <View style={styles.Flex}>
                    <Button height={56} onClick={() => {}}>
                        <Txt color="#fff" weight='Bold' size={18}>В корзину</Txt>
                    </Button>
                </View>
            </Row>
        </View>
    )
}

export default Preview

const styles = StyleSheet.create({
    Preview: {
        gap: 20,
        paddingHorizontal: 16
    },
    ImageBox: {
        width: "100%",
        height: 300,
        borderRadius: 16,
        overflow: "hidden"
    },
    Image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover"
    },
    Empty: {
        width: "100%",
        height: "100%",
        borderWidth: 1,
        borderColor: "#4FBD01",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center"
    },
    LikeButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#4FBD01",
        alignItems: "center",
        justifyContent: "center"
    },
    LikeButtonActive: {
        backgroundColor: "#4FBD01"
    },
    Flex: {
        flex: 1
    }
})