import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Sections from '../components/Sections'

const checkout = () => {
    return (
        <View style={styles.Container}>
            <ScrollView>
                <View>
                    <Sections.Checkout.Header />
                    <Sections.Checkout.Form />
                </View>
            </ScrollView>
        </View>
    )
}

export default checkout

const styles = StyleSheet.create({
    Container: {
        paddingTop: StatusBar.currentHeight,
        flex: 1,
        backgroundColor: "#fff",
        paddingBottom: 70
    }
})