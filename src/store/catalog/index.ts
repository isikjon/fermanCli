import api from '../../api'
import { CachedState, State } from './types'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { imagePreloader } from '../../utils/imageBatchPreloader'

const imageUrlCache: Record<string, string> = {}

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
            selectedAmounts: {},

            categoriesCache: null,
            productsCache: {},
            searchCache: {},

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
                set({ productsCache: {} })
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

            getProducts: async (catalogId) => {
                console.log('getProducts called with catalogId:', catalogId)
                const { activePage, category, productsCache, preloadImages } = get()
                const key = `${category || catalogId}_${activePage}`
                console.log('Cache key:', key, 'Category:', category, 'CatalogId:', catalogId)
                set({ isLoading: true })

                if (productsCache[key]) {
                    console.log('Using cached products for key:', key)
                    set({ productList: productsCache[key] })
                    set({ isLoading: false })
                    return
                }

                console.log('Fetching products from API...')
                const response = await api.products.getProducts((activePage - 1) * 20, category || catalogId)
                console.log('API response:', response.length, 'products')
                set((state) => ({
                    productList: response,
                    productsCache: { ...state.productsCache, [key]: response },
                    isLoading: false,
                }))

                const imageLinks = response.map(p => p.image).filter(Boolean)
                if (imageLinks.length > 0) {
                    setTimeout(() => {
                        preloadImages(imageLinks)
                    }, 100)
                }
            },

            getImage: async (link: string, isClear?: boolean) => {
                if (!link || link.trim() === '') return null

                if (imageUrlCache[link]) {
                    return imageUrlCache[link]
                }

                const imageMetadata = await api.products.getImage(link, isClear)
                
                if (imageMetadata && !isClear) {
                    imageUrlCache[link] = imageMetadata
                }

                const clearImage = isClear && await api.products.downloadImage(imageMetadata)

                return isClear ? clearImage : imageMetadata
            },

            preloadImages: async (links: string[]) => {
                const validLinks = links.filter(link => link && link.trim() !== '' && !imageUrlCache[link])
                if (validLinks.length === 0) return

                console.log('🖼️ [preloadImages] Starting batch preload for', validLinks.length, 'images')

                await imagePreloader.preload(validLinks, async (link) => {
                    const imageUrl = await api.products.getImage(link, false)
                    if (imageUrl) {
                        imageUrlCache[link] = imageUrl
                    }
                })

                console.log('✅ [preloadImages] Batch preload completed')
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
                if (imageLinks.length > 0) {
                    setTimeout(() => {
                        preloadImages(imageLinks)
                    }, 100)
                }
            },

            getProduct: async (id: string) => {
                try {
                    const { getImage } = get()
                    set({ isLoading: true, activeProductImage: null, activeProduct: null })

                    const response = await api.products.getProduct(id)

                    set({
                        isLoading: false,
                        activeProduct: response
                    })

                    const imageMetadata = await getImage(response.image, true)
                    set({ activeProductImage: imageMetadata || null })
                } catch (error) {
                    console.log(error)
                }
            },

            getDataFromAtributes: async (id: string) => {
                try {
                    const { preloadImages } = get()
                    set({ isLoading: true })
                    const response = await api.products.getProductFromAtributes(id)
                    set({ isLoading: false, productWithAtrList: response })

                    const imageLinks = response.map(p => p.image).filter(Boolean)
                    if (imageLinks.length > 0) {
                        setTimeout(() => {
                            preloadImages(imageLinks)
                        }, 100)
                    }
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
            })
        }
    )
)

export default useCatalogStore