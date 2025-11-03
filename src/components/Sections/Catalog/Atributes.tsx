import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import Txt from '../../../ui/Text';
import useCatalogStore from '../../../store/catalog';
import ProductCard from '../../../ui/ProductCard';
import { categoriesList } from '../../../constants';
import { useRoute, RouteProp } from '@react-navigation/native';
import Pagination from '../../Pagination';
import LoadingSpinner from '../../../ui/LoadingSpinner';
import ProductCardSkeleton from '../../../ui/ProductCardSkeleton';

type RootStackParamList = {
  List: { id: string };
};

const List = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'List'>>();
  const { id } = route.params;
  const {
    productWithAtrList,
    getDataFromAtributes,
    isLoading,
    isPagination,
    pages,
    activePage
  } = useCatalogStore();

  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 32 - 24) / 2;

  useEffect(() => {
    if (!id) {
      console.log('⚠️ [Atributes] No ID provided');
      return;
    }
    console.log('🔄 [Atributes] Loading products for attribute:', id);
    getDataFromAtributes(id);
  }, [id, activePage]);

  useEffect(() => {
    console.log('📊 [Atributes] productWithAtrList updated:', {
      count: productWithAtrList?.length || 0,
      isArray: Array.isArray(productWithAtrList),
      firstProduct: productWithAtrList?.[0]?.name
    });
  }, [productWithAtrList]);

  return (
    <View style={styles.Container}>
      <FlatList
        data={productWithAtrList || []}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        numColumns={2}
        columnWrapperStyle={styles.Row}
        renderItem={({ item }) => <ProductCard item={item} />}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: isPagination ? 140 : 70,
          minHeight: Dimensions.get('window').height,
        }}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 20 }}>
              <LoadingSpinner message="Загружаем товары..." />
              <View style={styles.SkeletonGrid}>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </View>
            </View>
          ) : (
            <Txt>Нет товаров</Txt>
          )
        }
      />

      {isPagination && (
        <View style={styles.Container}>
          <Pagination
            onChange={(value) => {
              getDataFromAtributes(id);
            }}
            pages={pages}
            activePage={activePage}
          />
        </View>
      )}
    </View>
  );
};

export default List;

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  Row: {
    gap: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  Header: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  Loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '5%',
  },
  SkeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 20,
    paddingHorizontal: 16,
  },
});