import { Animated, StatusBar, StyleSheet, View, FlatList, ListRenderItem } from 'react-native'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import Header from '../../components/Header'
import Sections from '../../components/Sections'
import Back from '../../ui/Back'
import useGlobalStore from '../../store'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'

// типизация параметров навигации
type RootStackParamList = {
    catalogDetails: { id: string }
}

type ListItem = {
    key: string
    type: 'header' | 'banners' | 'back' | 'categories' | 'list'
}

const CatalogDetails = () => {
    const [showFixed, setShowFixed] = useState<boolean>(false)
    const categoriesRef = useRef<View | null>(null)
    const fadeAnim = useRef(new Animated.Value(0)).current
    const { enableScroll } = useGlobalStore()

    const route = useRoute<RouteProp<RootStackParamList, 'catalogDetails'>>()
    const { id } = route.params
    console.log('catalogDetails id:', id)

    const navigation = useNavigation()

    const handleScroll = useCallback(() => {
        categoriesRef.current?.measure((_fx, _fy, _w, height, _px, py) => {
            const threshold = (StatusBar.currentHeight ?? 0) + 10
            const bottomEdge = py + height

            if (bottomEdge <= threshold && !showFixed) {
                setShowFixed(true)
            } else if (bottomEdge > threshold && showFixed) {
                setShowFixed(false)
            }
        })
    }, [showFixed])

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: showFixed ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start()
    }, [showFixed])

    const data: ListItem[] = [
        { key: 'header', type: 'header' },
        { key: 'banners', type: 'banners' },
        { key: 'back', type: 'back' },
        { key: 'categories', type: 'categories' },
        { key: 'list', type: 'list' },
    ]

    const renderItem: ListRenderItem<ListItem> = ({ item }) => {
        switch (item.type) {
            case 'header':
                return <Header />
            case 'banners':
                return <Sections.Catalog.Banners />
            case 'back':
                return (
                    <View style={styles.BackBox}>
                        <Back onClick={() => navigation.goBack()} />
                    </View>
                )
            case 'categories':
                return (
                    <View
                        ref={categoriesRef}
                        style={showFixed ? { opacity: 0 } : { opacity: 1 }}
                        pointerEvents={showFixed ? 'none' : 'auto'}
                    >
                        <Sections.Catalog.Categories />
                    </View>
                )
            case 'list':
                return <Sections.Catalog.List />
            default:
                return null
        }
    }

    return (
        <View style={styles.Container}>
            <Animated.View
                pointerEvents={showFixed ? 'auto' : 'none'}
                style={[
                    styles.FixedCategories,
                    {
                        opacity: fadeAnim,
                        transform: [
                            {
                                translateY: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-10, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Sections.Catalog.FixedCategories />
            </Animated.View>

            <FlatList
                data={data}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                scrollEnabled={enableScroll}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.FlatListContent}
            />
        </View>
    )
}

export default CatalogDetails

const styles = StyleSheet.create({
    Container: {
        paddingTop: StatusBar.currentHeight,
        flex: 1,
        backgroundColor: '#fff',
    },
    BackBox: {
        paddingTop: 25,
        marginBottom: -20,
        paddingHorizontal: 15,
    },
    FixedCategories: {
        position: 'absolute',
        top: StatusBar.currentHeight ?? 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 10,
        zIndex: 1000,
    },
    FlatListContent: {
        paddingBottom: 100,
    },
})
