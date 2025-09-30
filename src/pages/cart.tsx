import { ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import Sections from '../components/Sections'
import useCartStore from '../store/cart'

const cart = () => {
    const { getCartList } = useCartStore()

    useEffect(() => {
        getCartList()
    }, [getCartList])

    return (
        <View style={styles.Container}>
            <ScrollView>
                <View>
                    <Sections.Cart.Header />
                    <Sections.Cart.List />
                    <Sections.Cart.Total />
                </View>
            </ScrollView>
        </View>
    )
}

export default cart

const styles = StyleSheet.create({
    Container: {
        paddingTop: StatusBar.currentHeight,
        flex: 1,
        backgroundColor: "#fff",
        paddingBottom: 70
    }
})