import { Image, FlatList, StyleSheet, View } from 'react-native'
import React from 'react'
import { bannersList } from '../../../constants'

const BANNER_WIDTH = 170
const BANNER_RATIO = 0.67

const Banners = () => {
    return (
        <FlatList
            data={bannersList}
            horizontal
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.Banners}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
                <View style={styles.BannerItem}>
                    <Image style={styles.Image} source={item.image} />
                </View>
            )}
        />
    )
}

export default Banners

const styles = StyleSheet.create({
    Banners: {
        paddingHorizontal: 16
    },
    BannerItem: {
        position: "relative",
        width: BANNER_WIDTH,
        aspectRatio: BANNER_RATIO,
        borderRadius: 16,
        overflow: "hidden",
        marginRight: 16
    },
    Image: {
        width: "100%",
        height: "100%",
        resizeMode: 'cover',
    },
})
