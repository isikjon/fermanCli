import { Dimensions, StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import FastImage from 'react-native-fast-image'
import RoundButton from '../../../ui/RoundButton'
import Icons from '../../../ui/Icons'
import Empty from '../../../assets/svg/Empty'
import useCatalogStore from '../../../store/catalog'
import useFavoriteStore from '../../../store/favorite'
import { IFavorite } from '../../../types'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { MOYSKLAD_TOKEN } from '../../../api/functions/products'

const Preview = () => {
    const { activeProduct, activeProductImage, getImage } = useCatalogStore()
    const { addItemToFav, removeItemFromFav, getFavoriteList, favoriteList } = useFavoriteStore()

    const navigation = useNavigation()
    const route = useRoute<any>()
    const productId = route.params?.id
    const [image, setImage] = useState<string | null>(null)
    const isMounted = useRef(true)
    
    const isExist = useMemo(() => {
        const exists = favoriteList.some(item => item.id === productId)
        console.log('Проверка избранного для товара:', productId, 'Результат:', exists, 'Список:', favoriteList.length)
        return exists
    }, [favoriteList, productId])

    const getImageUrl = useCallback(async () => {
        if (!activeProduct?.image) return
        const imageMetadata = await getImage(activeProduct.image, false)
        if (isMounted.current) {
            setImage(imageMetadata || null)
        }
    }, [activeProduct?.image, getImage])

    const handleLike = useCallback(() => {
        if (!activeProduct) return

        const payload: IFavorite = {
            id: activeProduct.id,
            image: activeProduct.image,
            name: activeProduct.name,
            price: activeProduct.price,
            isWeighted: activeProduct.weighed,
            weight: 0.1,
            stock: activeProduct.stock
        }

        if (isExist) {
            console.log('Удаляем из избранного:', activeProduct.id)
            removeItemFromFav(activeProduct.id)
        } else {
            console.log('Добавляем в избранное:', activeProduct.id)
            addItemToFav(payload)
        }
    }, [activeProduct, isExist, removeItemFromFav, addItemToFav])

    useFocusEffect(
        useCallback(() => {
            getFavoriteList()
        }, [getFavoriteList])
    )

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    useEffect(() => {
        if (activeProduct?.image) {
            getImageUrl()
        }
    }, [activeProduct?.image, getImageUrl])

    return (
        <View style={styles.Preview}>
{activeProduct && image ? (
    <FastImage
        style={styles.Image}
        source={{
            uri: image,
            headers: { Authorization: MOYSKLAD_TOKEN },
            priority: FastImage.priority.high,
        }}
        resizeMode={FastImage.resizeMode.cover}
    />
) : (
    <View style={styles.Empty}>
        <Empty width={200} height={200} />
    </View>
)}

            <View style={styles.Top} pointerEvents="box-none">
                <RoundButton onClick={() => navigation.goBack()}>
                    <Icons.Back />
                </RoundButton>

                <View style={styles.Share}>
                    <RoundButton onClick={() => ({})}>
                        <Icons.Share />
                    </RoundButton>
                    <RoundButton onClick={handleLike}>
                        <Icons.Heard isBold={isExist} color={isExist ? "#EF2D45" : "#4D4D4D"} />
                    </RoundButton>
                </View>
            </View>
        </View>
    )
}

export default Preview

const styles = StyleSheet.create({
    Preview: {
        width: "100%",
        height: Dimensions.get("screen").width - 32,
        paddingHorizontal: 16,
        marginTop: 8,
        position: "relative"
    },
    Image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        borderRadius: 16
    },
    Top: {
        position: "absolute",
        top: 24,
        left: 32,
        justifyContent: "space-between",
        flexDirection: "row",
        width: Dimensions.get("screen").width - 64,
    },
    Share: {
        gap: 16
    },
    Bottom: {
        position: "absolute",
        bottom: 24,
        left: 32,
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "flex-end",
        width: Dimensions.get("screen").width - 64,
    },
    Empty: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEEEEE",
        borderRadius: 16
    }
})
