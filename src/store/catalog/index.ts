import api from '../../api'
import { CachedState, State } from './types'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ImageDownloadQueue } from '../../utils/imageDownloadQueue'

const imageDownloadQueue = new ImageDownloadQueue()
const MAX_IMAGE_CACHE_SIZE = 50
const imageCacheAccessOrder: string[] = []

let isDownloadFunctionSet = false
const ensureDownloadFunction = () => {
    if (!isDownloadFunctionSet && api?.products?.downloadImage) {
        imageDownloadQueue.setDownloadFunction(api.products.downloadImage)
        isDownloadFunctionSet = true
    }
}

const useCatalogStore = create<CachedState>()(
    persist(
        (set, get) => ({
            category: "",
            catalogList: [],
            productList: [],
            searchList: [],
            search: "",
            isLoading: false,
            isPagination: false,
            pages: 0,
            activePage: 1,
            activeProduct: null,
            activeProductImage: null,
            productWithAtrList: [],
            productsCount: 0,
            selectedAmounts: {},

            categoriesCache: null,
            productsCache: {},
            searchCache: {},
            imageMetadataCache: {},
            imageCache: {},
            productsCountCache: {},

            changeSearch: (value) => set({ search: value }),
            changePage: (page: number) => set({ activePage: page }),
            changeIsPagination: (value: boolean, size: number) => set({ isPagination: value, pages: Math.ceil(size / 20) }),
            setCategory: (categoryId: string) => set({ category: categoryId }),
            changeCategory: (value: string) => {
                console.log('🔄 [Store changeCategory] New category:', value)
                set({ category: value, activePage: 1 })
            },
            
            clearProductsCache: () => {
                console.log('🗑️ [Store] Clearing products cache')
                set({ productsCache: {}, productsCountCache: {} })
            },
            
            setSelectedAmount: (productId: string, amount: number) => {
                set((state) => ({
                    selectedAmounts: { ...state.selectedAmounts, [productId]: amount }
                }))
            },
            getSelectedAmount: (productId: string) => {
                return get().selectedAmounts[productId]
            },
            clearSelectedAmount: (productId: string) => {
                const { selectedAmounts } = get()
                const newAmounts = { ...selectedAmounts }
                delete newAmounts[productId]
                set({ selectedAmounts: newAmounts })
            },

            getCategories: async () => {
                const { categoriesCache } = get()
                set({ isLoading: true })

                if (categoriesCache) {
                    set({ catalogList: categoriesCache })
                    set({ isLoading: false })
                }

                const response = await api.products.getCategories()
                set({ catalogList: response, categoriesCache: response, isLoading: false })
            },

            getProductsCount: async (catalogId: string): Promise<number> => {
                const { category, productsCountCache } = get()
                const key = category || catalogId

                console.log('📊 [Store getProductsCount] catalogId:', catalogId, 'category:', category, 'key:', key)

                if (productsCountCache[key] !== undefined) {
                    console.log('✅ [Store getProductsCount] Using cached count:', productsCountCache[key])
                    return productsCountCache[key]
                }

                const count = await api.products.getProductsCount(key)
                set((state) => ({
                    productsCount: count,
                    productsCountCache: { ...state.productsCountCache, [key]: count }
                }))
                
                return count
            },

            getProducts: async (catalogId) => {
                const { activePage, category, productsCache, preloadImages } = get()
                const key = `${category || catalogId}_${activePage}`
                
                console.log('📦 [Store getProducts] catalogId:', catalogId, 'category:', category, 'activePage:', activePage, 'key:', key)
                
                set({ isLoading: true })

                if (productsCache[key] && productsCache[key].length > 0) {
                    console.log('✅ [Store getProducts] Using cached products:', productsCache[key].length)
                    set({ productList: productsCache[key], isLoading: false })
                    return
                }

                if (productsCache[key] && productsCache[key].length === 0) {
                    console.log('⚠️ [Store getProducts] Found empty cache, will reload from API')
                }

                try {
                const response = await api.products.getProducts((activePage - 1) * 20, category || catalogId)
                    
                console.log('📦 [Store getProducts] API returned:', response.length, 'products')
                
                set((state) => ({
                    productList: response,
                    productsCache: response.length > 0 ? { ...state.productsCache, [key]: response } : state.productsCache,
                    isLoading: false,
                }))

                    const imageLinks = response.map(p => p.image).filter(Boolean)
                    setTimeout(() => {
                        preloadImages(imageLinks)
                    }, 100)
                } catch (error) {
                    console.log('❌ [Store getProducts] error:', error)
                    set({ isLoading: false })
                }
            },

            getImage: async (link: string, isClear?: boolean) => {
                console.log('🖼️ [Store] getImage called for:', link)
                
                const { imageMetadataCache } = get()
                
                // Проверяем кеш метаданных
                let imageMetadata = imageMetadataCache[link]
                
                if (!imageMetadata) {
                    console.log('📡 [Store] Fetching image metadata for:', link)
                    imageMetadata = await api.products.getImage(link, isClear)
                    
                    if (imageMetadata) {
                        console.log('✅ [Store] Image metadata received, caching:', link)
                        set((state) => ({
                            imageMetadataCache: { ...state.imageMetadataCache, [link]: imageMetadata }
                        }))
                    } else {
                        console.log('❌ [Store] No image metadata received for:', link)
                    }
                } else {
                    console.log('✅ [Store] Image metadata found in cache:', link)
                }
                
                // Возвращаем прямую ссылку на изображение для React Native Image
                return imageMetadata
            },

            preloadImages: async (links: string[]) => {
                // Упрощенная предзагрузка - только метаданные
                const { imageMetadataCache } = get()
                const linksToLoad = links.filter(link => link && !imageMetadataCache[link]).slice(0, 6)
                
                if (linksToLoad.length === 0) return
                
                console.log('🖼️ [preloadImages] Preloading image metadata:', linksToLoad.length)
                
                const metadataPromises = linksToLoad.map(async (link) => {
                    try {
                        const imageMetadata = await api.products.getImage(link)
                        if (imageMetadata) {
                            set((state) => ({
                                imageMetadataCache: { ...state.imageMetadataCache, [link]: imageMetadata }
                            }))
                        }
                    } catch (error) {
                        console.log('Preload metadata error:', error)
                    }
                })
                
                await Promise.all(metadataPromises)
            },

            // Поиск по текущему значению из стора (оставлено для обратной совместимости)
            searchProduct: async () => {
                const { search } = get()
                await get().searchProductByName(search)
            },

            // Поиск по явно переданному имени — чтобы избежать гонок при changeSearch()
            searchProductByName: async (name: string) => {
                const { searchCache, preloadImages } = get()
                if (name.length === 0) {
                    set({ searchList: [] })
                    return
                }

                if (searchCache[name]) {
                    set({ searchList: searchCache[name] })
                    return
                }

                const response = await api.products.searchProduct(name)
                set((state) => ({
                    searchList: response,
                    searchCache: { ...state.searchCache, [name]: response },
                }))

                const imageLinks = response.map(p => p.image).filter(Boolean)
                preloadImages(imageLinks)
            },

            getProduct: async (id: string) => {
                try {
                    const { imageCache, imageMetadataCache } = get()
                    set({ isLoading: true, activeProductImage: null, activeProduct: null })

                    const response = await api.products.getProduct(id)

                    set({
                        isLoading: false,
                        activeProduct: response
                    })

                    if (response.image) {
                        if (imageCache[response.image]) {
                            set({ activeProductImage: imageCache[response.image] })
                        } else {
                            setTimeout(async () => {
                                try {
                                    let imageMetadata = imageMetadataCache[response.image]
                                    
                                    if (!imageMetadata) {
                                        imageMetadata = await api.products.getImage(response.image, true)
                                        if (imageMetadata) {
                                            set((state) => ({
                                                imageMetadataCache: { ...state.imageMetadataCache, [response.image]: imageMetadata }
                                            }))
                                        }
                                    }
                                    
                                    if (imageMetadata) {
                                        ensureDownloadFunction()
                                        const localImage = await imageDownloadQueue.add(imageMetadata, 'high')
                                        if (localImage) {
                                            const newCache = { ...get().imageCache, [response.image]: localImage };
                                            
                                            imageCacheAccessOrder.push(response.image);
                                            
                                            if (imageCacheAccessOrder.length > MAX_IMAGE_CACHE_SIZE) {
                                                const oldestKey = imageCacheAccessOrder.shift();
                                                if (oldestKey) {
                                                    delete newCache[oldestKey];
                                                }
                                            }
                                            
                                            set({ 
                                                activeProductImage: localImage,
                                                imageCache: newCache 
                                            })
                                        }
                                    }
                                } catch {}
                            }, 50)
                        }
                    }
                } catch (error) {
                    console.log('getProduct error:', error)
                    set({ isLoading: false })
                }
            },

            getDataFromAtributes: async (id: string) => {
                try {
                    const { preloadImages } = get()
                    set({ isLoading: true })
                    const response = await api.products.getProductFromAtributes(id)
                    set({ isLoading: false, productWithAtrList: response })
                    
                    const imageLinks = response.map(p => p.image).filter(Boolean)
                    preloadImages(imageLinks)
                } catch (error) {
                    console.log(error)
                    set({ isLoading: false })
                }
            },
        }),
        {
            name: 'catalog-cache',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                categoriesCache: state.categoriesCache,
                productsCache: state.productsCache,
                searchCache: state.searchCache,
                imageMetadataCache: state.imageMetadataCache,
                imageCache: state.imageCache,
                productsCountCache: state.productsCountCache,
            })
        }
    )
)

export default useCatalogStore