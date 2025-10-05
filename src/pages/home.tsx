import React, { useEffect, useRef } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Header from '../components/Header';
import Sections from '../components/Sections';
import useCatalogStore from '../store/catalog';
import useGlobalStore from '../store';

export default function home() {
    const { getCategories } = useCatalogStore();
    const { enableScroll } = useGlobalStore();
    const scrollRef = useRef<ScrollView>(null); // реф на ScrollView

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    return (
        <View style={styles.Container}>
            {/* Прокручиваемый контент с Header внутри */}
            <ScrollView ref={scrollRef} scrollEnabled={enableScroll} contentContainerStyle={styles.ContentContainer}>
                <Header scrollRef={scrollRef} />
                <Sections.Home.Banners />
                <Sections.Home.Categories />
                <Sections.Home.Catalog />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    ContentContainer: {
        paddingBottom: 100, // больше места для нижней навигации
    },
});
