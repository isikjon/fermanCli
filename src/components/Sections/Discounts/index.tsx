import { FlatList, Image, StyleSheet, View } from 'react-native'
import React from 'react'
import { bannersList } from '../../../constants'
import Txt from '../../../ui/Text'

const Discounts = () => {
    return (
        <View style={styles.Container}>
            <FlatList
                data={bannersList}
                keyExtractor={(item) => item.title}
                numColumns={2}
                columnWrapperStyle={styles.Row}
                renderItem={({ item }) => (
                    <View style={styles.BannerItem}>
                        <View style={styles.Title}>
                            <Txt color="#fff" weight='Bold' lineHeight={20} size={16}>{item.title}</Txt>
                        </View>
                        <Image style={styles.Image} source={item.image} />
                    </View>
                )}
            />
        </View>
    )
}

export default Discounts

const styles = StyleSheet.create({
    Container: {
        paddingHorizontal: 16,
        paddingBottom: 50
    },
    BannerItem: {
        position: "relative",
        width: "100%",
        flex: 1,
        height: 200,
        borderRadius: 16,
        overflow: "hidden",
    },
    Image: {
        position: "absolute",
        width: "100%",
        height: "100%",
    },
    Title: {
        position: "absolute",
        top: 16,
        left: 16,
        flex: 1,
        zIndex: 1,
        width: 100,
    },
    Row: {
        gap: 16,
        marginBottom: 16
    },
})