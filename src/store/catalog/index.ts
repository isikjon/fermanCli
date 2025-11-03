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
                set({ category: value, activePage: 1, productsCache: {} })
            },

            clearProductsCache: () => {
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
                const { activePage, category, productsCache, isLoading: currentlyLoading } = get()
                
                if (currentlyLoading) {
                    return
                }
                
                const key = `${category || catalogId}_${activePage}`
                set({ isLoading: true })

                if (productsCache[key]) {
                    set({ productList: productsCache[key] })
                    set({ isLoading: false })
                    return
                }

                const response = await api.products.getProducts((activePage - 1) * 20, category || catalogId)
                set((state) => ({
                    productList: response,
                    productsCache: { ...state.productsCache, [key]: response },
                    isLoading: false,
                }))
            },

            getImage: (productId: string, index?: number) => {
                // Теперь просто возвращаем CDN URL
                return api.products.getImage(productId, index || 0)
            },

            preloadImages: async (productIds: string[]) => {
            },


            // Поиск по текущему значению из стора (оставлено для обратной совместимости)
            searchProduct: async () => {
                const { search } = get()
                await get().searchProductByName(search)
            },

            // Поиск по явно переданному имени — чтобы избежать гонок при changeSearch()
            searchProductByName: async (name: string) => {
                const { searchCache } = get()
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

                    // Получаем CDN URL изображения
                    const imageUrl = getImage(response.image, 0)
                    set({ activeProductImage: imageUrl || null })
                } catch (error) {
                    console.log(error)
                }
            },

            getDataFromAtributes: async (id: string) => {
                try {
                    const { isLoading: currentlyLoading } = get()
                    if (currentlyLoading) {
                        console.log('⏳ [getDataFromAtributes] Already loading, skipping...')
                        return
                    }
                    
                    console.log('🔄 [getDataFromAtributes] START - Attribute ID:', id)
                    
                    const startTime = Date.now()
                    set({ isLoading: true })
                    
                    const response = await api.products.getProductFromAtributes(id)
                    
                    console.log('📥 [getDataFromAtributes] Response from API:', {
                        productsCount: response?.length || 0,
                        isArray: Array.isArray(response)
                    })
                    
                    const elapsed = Date.now() - startTime
                    const minLoadTime = 500
                    if (elapsed < minLoadTime) {
                        await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsed))
                    }
                    
                    console.log('💾 [getDataFromAtributes] Setting productWithAtrList with', response?.length || 0, 'products')
                    set({ isLoading: false, productWithAtrList: response })
                    
                    console.log('✅ [getDataFromAtributes] COMPLETE')
                } catch (error) {
                    console.error('❌ [getDataFromAtributes] ERROR:', error)
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