import { Dimensions, FlatList, StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import React, { useEffect, useCallback } from 'react';
import Txt from '../../../ui/Text';
import useCatalogStore from '../../../store/catalog';
import ProductCard from '../../../ui/ProductCard';
import { useRoute, RouteProp } from '@react-navigation/native';
import Pagination from '../../../components/Pagination';

// Определяем типы для параметров роутера
type RootStackParamList = {
  List: { id: string };
};

const List = () => {
  const {
    category,
    catalogList,
    productList,
    getProducts,
    isLoading,
    isPagination,
    pages,
    activePage,
    changePage,
  } = useCatalogStore();
  const route = useRoute<RouteProp<RootStackParamList, 'List'>>();
  const { id } = route.params;

  const activeCatalogItem = catalogList.find((i) => i.id === id);
  const activeCategory = activeCatalogItem?.subCategory?.find((i) => i.id === category);

  // Calculate item width for ProductCard
  const screenWidth = Dimensions.get('window').width;
  const ITEM_HORIZONTAL_PADDING = 16 * 2;
  const GAP = 24;
  const NUM_COLUMNS = 2;
  const itemWidth = (screenWidth - ITEM_HORIZONTAL_PADDING - GAP) / NUM_COLUMNS;

  // Define getItemLayout (adjust height based on ProductCard)
  const getItemLayout = useCallback(
    (_, index: number) => ({
      length: 200 + 24, // Adjust 200 to match ProductCard height + marginBottom
      offset: (200 + 24) * Math.floor(index / NUM_COLUMNS),
      index,
    }),
    []
  );

  useEffect(() => {
    getProducts(id);
  }, [getProducts, id, category, activePage]);

  return (
    <View style={styles.Container}>
      {category !== '' && (
        <Txt size={24} weight="Jingleberry">
          {activeCategory?.name}
        </Txt>
      )}

      {!isLoading ? (
        <>
          {productList.length > 0 ? (
            <>
              <TouchableWithoutFeedback onPress={() => console.log('Touched FlatList area')}>
                <FlatList
                  data={productList}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.Row}
                  renderItem={({ item }) => <ProductCard item={item} width={itemWidth} />}
                  contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 140, // Ensure enough space for Pagination
                    minHeight: Dimensions.get('window').height, // Ensure scrollable area covers screen
                  }}
                  getItemLayout={getItemLayout}
                  scrollEnabled={true} // Explicitly enable scrolling
                  bounces={true} // Add bounce effect for feedback
                  removeClippedSubviews={false} // Prevent clipping issues
                />
              </TouchableWithoutFeedback>
              {isPagination && (
                <View style={styles.PaginationContainer}>
                  <Pagination
                    onChange={(value) => changePage(value)}
                    pages={pages}
                    activePage={activePage}
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.EmptyContainer}>
              <Txt size={18} weight="Bold" color="#999">
                В этой категории пока нет товаров
              </Txt>
              <Txt size={14} color="#666" style={{ marginTop: 8, textAlign: 'center' }}>
                Попробуйте выбрать другую категорию или вернитесь позже
              </Txt>
            </View>
          )}
        </>
      ) : (
        <Txt>Загрузка...</Txt>
      )}
    </View>
  );
};

export default List;

const styles = StyleSheet.create({
  Container: {
    flex: 1, // Ensure container fills the screen
    paddingHorizontal: 16,
    backgroundColor: '#fff', // Optional: Set background to ensure visibility
  },
  Row: {
    gap: 24,
    marginBottom: 24,
  },
  PaginationContainer: {
    marginTop: 16,
    marginBottom: 32, // чтобы был отступ от края экрана
    alignItems: 'center',
  },
  EmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});