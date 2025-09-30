import { ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import Sections from '../../../components/Sections'
import useCatalogStore from '../../../store/catalog'
import Txt from '../../../ui/Text'
import { useRoute } from '@react-navigation/native'

const ProductScreen = () => {
    const route = useRoute<any>()
    const { id } = route.params

    const { isLoading, getProduct, activeProduct } = useCatalogStore()

    useEffect(() => {
        const load = async () => {
            console.log('ProductScreen: start loading product', id)
            await getProduct(id)
            console.log('ProductScreen: finished loading product', activeProduct)
        }
        load()
    }, [id])

    return (
        <View style={styles.Container}>
            <ScrollView>
                <Sections.Product.Preview />
                {!isLoading ? (
                    <>
                        <Sections.Product.Controlls />
                        <Sections.Product.Info />
                        <Sections.Product.Reviews />
                    </>
                ) : (
                    <View style={styles.Loader}>
                        <Txt>Загрузка...</Txt>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

export default ProductScreen

const styles = StyleSheet.create({
    Container: {
        paddingTop: StatusBar.currentHeight,
        flex: 1,
        backgroundColor: "#fff",
        paddingBottom:  70
    },
    Loader: {
        padding: 15
    }
})