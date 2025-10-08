import api from '../../api'
import { CachedState, State } from './types'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { imageBatchLoader } from '../../utils/imageBatchLoader'
import { imageDownloadQueue } from '../../utils/imageDownloadQueue'

const MAX_IMAGE_CACHE_SIZE = 50;
const imageCacheAccessOrder: string[] = [];
let isQueueInitialized = false;

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
            changeCategory: (value: string) => set({ category: value }),
            
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

                if (productsCountCache[key] !== undefined) {
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
                set({ isLoading: true })

                if (productsCache[key]) {
                    set({ productList: productsCache[key], isLoading: false })
                    return
                }

                try {
                    const response = await api.products.getProducts((activePage - 1) * 20, category || catalogId)
                    
                    set((state) => ({
                        productList: response,
                        productsCache: { ...state.productsCache, [key]: response },
                        isLoading: false,
                    }))

                    const imageLinks = response.map(p => p.image).filter(Boolean)
                    setTimeout(() => {
                        preloadImages(imageLinks)
                    }, 100)
                } catch (error) {
                    console.log('getProducts error:', error)
                    set({ isLoading: false })
                }
            },

            getImage: async (link: string, isClear?: boolean) => {
                if (!isQueueInitialized) {
                    imageDownloadQueue.setDownloadFunction(api.products.downloadImage);
                    isQueueInitialized = true;
                }
                
                const { imageCache, imageMetadataCache } = get()
                
                if (imageCache[link]) {
                    const index = imageCacheAccessOrder.indexOf(link);
                    if (index > -1) {
                        imageCacheAccessOrder.splice(index, 1);
                    }
                    imageCacheAccessOrder.push(link);
                    return imageCache[link]
                }
                
                let imageMetadata = imageMetadataCache[link]
                
                if (!imageMetadata) {
                    imageMetadata = await api.products.getImage(link, isClear)
                    
                    if (imageMetadata) {
                        set((state) => ({
                            imageMetadataCache: { ...state.imageMetadataCache, [link]: imageMetadata }
                        }))
                    }
                }
                
                if (!imageMetadata) {
                    return null
                }
                
                const localImage = await imageDownloadQueue.add(imageMetadata, 'normal')
                
                if (localImage) {
                    const newCache = { ...get().imageCache, [link]: localImage };
                    
                    imageCacheAccessOrder.push(link);
                    
                    if (imageCacheAccessOrder.length > MAX_IMAGE_CACHE_SIZE) {
                        const oldestKey = imageCacheAccessOrder.shift();
                        if (oldestKey) {
                            delete newCache[oldestKey];
                        }
                    }
                    
                    set({ imageCache: newCache })
                }
                
                return localImage
            },

            preloadImages: async (links: string[]) => {
                const { imageCache, imageMetadataCache } = get()
                const linksToLoad = links.filter(link => link && !imageCache[link]).slice(0, 3)
                
                if (linksToLoad.length === 0) return

                const loadInBackground = async () => {
                    for (const link of linksToLoad) {
                        try {
                            if (!imageMetadataCache[link]) {
                                const metadata = await Promise.race([
                                    imageBatchLoader.getImageMetadata(link),
                                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
                                ])
                                
                                if (metadata) {
                                    set((state) => ({
                                        imageMetadataCache: { ...state.imageMetadataCache, [link]: metadata }
                                    }))

                                    const localImage = await imageDownloadQueue.add(metadata, 'low')

                                    if (localImage) {
                                        const newCache = { ...get().imageCache, [link]: localImage };
                                        
                                        imageCacheAccessOrder.push(link);
                                        
                                        if (imageCacheAccessOrder.length > MAX_IMAGE_CACHE_SIZE) {
                                            const oldestKey = imageCacheAccessOrder.shift();
                                            if (oldestKey) {
                                                delete newCache[oldestKey];
                                            }
                                        }
                                        
                                        set({ imageCache: newCache })
                                    }
                                }
                            }
                            
                            await new Promise(resolve => setTimeout(resolve, 200))
                        } catch {}
                    }
                }

                setTimeout(() => {
                    loadInBackground().catch(() => {})
                }, 500)
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