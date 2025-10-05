import api from '../../api'
import { CachedState, State } from './types'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { imageBatchLoader } from '../../utils/imageBatchLoader'

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

            // Кэш
            categoriesCache: null,
            productsCache: {},
            searchCache: {},
            imageMetadataCache: {},
            imageCache: {},

            changeSearch: (value) => set({ search: value }),
            changePage: (page: number) => set({ activePage: page }),
            changeIsPagination: (value: boolean, size: number) => set({ isPagination: value, pages: Math.ceil(size / 20) }),
            setCategory: (categoryId: string) => set({ category: categoryId }),
            changeCategory: (value: string) => set({ category: value }),

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

            getProducts: async (catalogId) => {
                const startTime = performance.now()
                console.log('⏱️ [getProducts] START', catalogId)
                
                const { activePage, category, productsCache, preloadImages } = get()
                const key = `${category || catalogId}_${activePage}`
                set({ isLoading: true })

                if (productsCache[key]) {
                    console.log('✅ [getProducts] FROM CACHE', (performance.now() - startTime).toFixed(2), 'ms')
                    set({ productList: productsCache[key] })
                    set({ isLoading: false })
                    return
                }

                const apiStartTime = performance.now()
                const response = await api.products.getProducts((activePage - 1) * 20, category || catalogId)
                console.log('🌐 [getProducts] API RESPONSE', (performance.now() - apiStartTime).toFixed(2), 'ms')
                
                set((state) => ({
                    productList: response,
                    productsCache: { ...state.productsCache, [key]: response },
                    isLoading: false,
                }))

                const imageLinks = response.map(p => p.image).filter(Boolean)
                preloadImages(imageLinks)
                
                console.log('✅ [getProducts] TOTAL TIME', (performance.now() - startTime).toFixed(2), 'ms')
            },

            getImage: async (link: string, isClear?: boolean) => {
                const startTime = performance.now()
                console.log('📷 [getImage] START', link?.substring(0, 50))
                
                const { imageCache, imageMetadataCache } = get()
                
                if (imageCache[link]) {
                    console.log('⚡ [getImage] FROM IMAGE CACHE', (performance.now() - startTime).toFixed(2), 'ms')
                    return imageCache[link]
                }
                
                const metadataStartTime = performance.now()
                let imageMetadata = imageMetadataCache[link]
                
                if (!imageMetadata) {
                    imageMetadata = await api.products.getImage(link, isClear)
                    console.log('📷 [getImage] METADATA', (performance.now() - metadataStartTime).toFixed(2), 'ms')
                    
                    if (imageMetadata) {
                        set((state) => ({
                            imageMetadataCache: { ...state.imageMetadataCache, [link]: imageMetadata }
                        }))
                    }
                } else {
                    console.log('⚡ [getImage] FROM METADATA CACHE', (performance.now() - metadataStartTime).toFixed(2), 'ms')
                }
                
                if (!imageMetadata) {
                    console.log('⚠️ [getImage] NO METADATA', (performance.now() - startTime).toFixed(2), 'ms')
                    return null
                }
                
                const downloadStartTime = performance.now()
                const localImage = await api.products.downloadImage(imageMetadata)
                console.log('💾 [getImage] DOWNLOAD', (performance.now() - downloadStartTime).toFixed(2), 'ms')
                
                if (localImage) {
                    set((state) => ({
                        imageCache: { ...state.imageCache, [link]: localImage }
                    }))
                }
                
                console.log('✅ [getImage] TOTAL', (performance.now() - startTime).toFixed(2), 'ms')
                return localImage
            },

            preloadImages: async (links: string[]) => {
                const { imageCache, imageMetadataCache } = get()
                const linksToLoad = links.filter(link => link && !imageCache[link]).slice(0, 6)
                
                if (linksToLoad.length === 0) return

                console.log('🚀 [preloadImages] START', linksToLoad.length, 'images')
                const startTime = performance.now()

                const metadataPromises = linksToLoad.map(async (link) => {
                    if (!imageMetadataCache[link]) {
                        const metadata = await imageBatchLoader.getImageMetadata(link)
                        if (metadata) {
                            set((state) => ({
                                imageMetadataCache: { ...state.imageMetadataCache, [link]: metadata }
                            }))
                        }
                        return { link, metadata }
                    }
                    return { link, metadata: imageMetadataCache[link] }
                })

                const results = await Promise.all(metadataPromises)
                console.log('⚡ [preloadImages] METADATA DONE', (performance.now() - startTime).toFixed(2), 'ms')
                
                const downloadPromises = results
                    .filter(r => r.metadata)
                    .map(async ({ link, metadata }) => {
                        const localImage = await api.products.downloadImage(metadata!)
                        if (localImage) {
                            set((state) => ({
                                imageCache: { ...state.imageCache, [link]: localImage }
                            }))
                        }
                    })

                await Promise.all(downloadPromises)
                console.log('✅ [preloadImages] DOWNLOAD DONE', (performance.now() - startTime).toFixed(2), 'ms')
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
                const startTime = performance.now()
                console.log('🛍️ [getProduct] START', id)
                
                try {
                    const { getImage } = get()
                    set({ isLoading: true, activeProductImage: null, activeProduct: null })

                    const [response] = await Promise.all([
                        api.products.getProduct(id),
                    ])
                    console.log('🌐 [getProduct] API', (performance.now() - startTime).toFixed(2), 'ms')

                    set({
                        isLoading: false,
                        activeProduct: response
                    })

                    if (response.image) {
                        getImage(response.image, true).then(imageMetadata => {
                            set({ activeProductImage: imageMetadata || null })
                            console.log('📷 [getProduct] IMAGE LOADED', (performance.now() - startTime).toFixed(2), 'ms')
                        })
                    }
                    
                    console.log('✅ [getProduct] TOTAL', (performance.now() - startTime).toFixed(2), 'ms')
                } catch (error) {
                    console.log('❌ [getProduct] ERROR', error, (performance.now() - startTime).toFixed(2), 'ms')
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
            })
        }
    )
)

export default useCatalogStore