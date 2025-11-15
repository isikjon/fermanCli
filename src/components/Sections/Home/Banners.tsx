import { Image, FlatList, StyleSheet, View } from 'react-native'
import React from 'react'
import { bannersList } from '../../../constants'

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
        width: 150,
        height: 160,
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
