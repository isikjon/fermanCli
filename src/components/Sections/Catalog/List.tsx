import { Dimensions, FlatList, StyleSheet, View, TouchableWithoutFeedback, InteractionManager } from 'react-native';
import React, { useEffect, useCallback, useRef } from 'react';
import Txt from '../../../ui/Text';
import useCatalogStore from '../../../store/catalog';
import ProductCard from '../../../ui/ProductCard';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import Pagination from '../../../components/Pagination';
import LoadingSpinner from '../../../ui/LoadingSpinner';
import ProductCardSkeleton from '../../../ui/ProductCardSkeleton';
import { performanceMonitor } from '../../../utils/performanceMonitor';
import { requestManager } from '../../../utils/requestCancellation';

type RootStackParamList = {
  List: { id: string };
};

const List = () => {
  const {
    category,
    catalogList,
    productList,
    getProducts,
    getProductsCount,
    isLoading,
    isPagination,
    pages,
    activePage,
    changePage,
    productsCount,
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
  const isMounted = useRef(true)
  const abortController = useRef<AbortController | null>(null)
  const titleRef = useRef<View>(null)

  const getItemLayout = useCallback(
    (_, index: number) => ({
      length: 200 + 24,
      offset: (200 + 24) * Math.floor(index / NUM_COLUMNS),
      index,
    }),
    []
  );

  useFocusEffect(
    useCallback(() => {
      performanceMonitor.startMonitoring()
      return () => {
        performanceMonitor.stopMonitoring()
      }
    }, [])
  )

  useEffect(() => {
    isMounted.current = true
    const requestKey = `products_${id}_${category}_${activePage}`
    const controller = requestManager.createCancellableRequest(requestKey)
    abortController.current = controller

    const loadProducts = () => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          if (!isMounted.current || controller.signal.aborted) return
          
          performanceMonitor.logInteraction('Load Products', 'List')
          
          const countPromise = getProductsCount(id)
          const productsPromise = getProducts(id)
          
          await Promise.race([
            countPromise,
            new Promise((_, reject) => {
              controller.signal.addEventListener('abort', () => reject(new Error('Aborted')))
            })
          ])

          if (!isMounted.current || controller.signal.aborted) return

          await Promise.race([
            productsPromise,
            new Promise((_, reject) => {
              controller.signal.addEventListener('abort', () => reject(new Error('Aborted')))
            })
          ])
        } catch (error: any) {
          if (error?.message !== 'Aborted' && isMounted.current) {
            console.log('Load products error:', error)
          }
        }
      })
    }
    
    loadProducts()

    return () => {
      isMounted.current = false
      requestManager.cancel(requestKey)
    }
  }, [id, category, activePage]);

  return (
    <View style={styles.Container}>
      {category !== '' && (
        <View ref={titleRef} collapsable={false}>
          <Txt size={24} weight="Jingleberry">
            {activeCategory?.name}
          </Txt>
        </View>
      )}

      {!isLoading ? (
        <>
          {productList.length > 0 || productsCount > 0 ? (
            <>
              <TouchableWithoutFeedback>
                <FlatList
                  data={productList}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.Row}
                  renderItem={({ item }) => <ProductCard item={item} width={itemWidth} />}
                  contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: '5%',
                  }}
                  getItemLayout={getItemLayout}
                  initialNumToRender={6}
                  maxToRenderPerBatch={4}
                  windowSize={5}
                  scrollEnabled={true}
                  bounces={true}
                  removeClippedSubviews={true}
                  updateCellsBatchingPeriod={50}
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
        <View style={{ paddingTop: 20 }}>
          <LoadingSpinner message="Загружаем товары..." />
          <View style={styles.SkeletonGrid}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        </View>
      )}
    </View>
  );
};

export default List;

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  Row: {
    gap: 24,
    marginBottom: 24,
  },
  PaginationContainer: {
    marginTop: 16,
    marginBottom: '5%',
    alignItems: 'center',
  },
  EmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  SkeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 20,
  },
});