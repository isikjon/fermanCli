import React, { useEffect, useRef } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Header from '../components/Header';
import Sections from '../components/Sections';
import useCatalogStore from '../store/catalog';
import useGlobalStore from '../store';
import useBonusStore from '../store/bonus';

export default function home() {
    const { getCategories } = useCatalogStore();
    const { enableScroll, isAuth } = useGlobalStore();
    const { getBonuses } = useBonusStore();
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        getCategories();
        if (isAuth) {
            console.log('💰 [Home] Loading bonuses...');
            getBonuses();
        }
    }, [getCategories, getBonuses, isAuth]);

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
