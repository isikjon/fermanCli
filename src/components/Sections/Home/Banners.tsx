import { Image, FlatList, StyleSheet, View } from 'react-native'
import React from 'react'
import Txt from '../../../ui/Text'
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
                    <View style={styles.Title}>
                        <Txt color="#fff" weight='Bold' lineHeight={20}>{item.title}</Txt>
                    </View>
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
        width: 120,
        height: 160,
        borderRadius: 16,
        overflow: "hidden",
        marginRight: 16
    },
    Image: {
        position: "absolute",
        width: "100%",
        height: "100%",
    },
    Title: {
        position: "absolute",
        top: 10,
        left: 10,
        flex: 1,
        zIndex: 1,
        width: 100,
    }
})
