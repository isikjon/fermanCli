import { Dimensions, Image, StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import RoundButton from '../../../ui/RoundButton'
import Icons from '../../../ui/Icons'
import Empty from '../../../assets/svg/Empty'
import useCatalogStore from '../../../store/catalog'
import useFavoriteStore from '../../../store/favorite'
import { IFavorite } from '../../../types'
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

        const imageMetadata = await getImage(activeProduct?.image, false)
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
            weight: 0.1,
            stock: activeProduct?.stock
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
{activeProduct ? (
    <Image
        style={styles.Image}
        source={{
            uri: image ?? activeProduct.image // показываем либо кэшированную, либо оригинал
        }}
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
                        <Icons.Heard isBold={isExist} />
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
