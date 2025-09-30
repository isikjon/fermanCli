import api from '../../api'
import { CachedState, State } from './types'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

            changeSearch: (value) => set({ search: value }),
            changePage: (page: number) => set({ activePage: page }),
            changeIsPagination: (value: boolean, size: number) => set({ isPagination: value, pages: Math.ceil(size / 20) }),
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
                console.log('getProducts called with catalogId:', catalogId)
                const { activePage, category, productsCache } = get()
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
            },

            getImage: async (link: string, isClear?: boolean) => {
                const imageMetadata = await api.products.getImage(link, isClear)
                const clearImage = isClear && await api.products.downloadImage(imageMetadata)

                return isClear ? clearImage : imageMetadata
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

                    const imageMetadata = await getImage(response.image, true)
                    set({ activeProductImage: imageMetadata || null })
                } catch (error) {
                    console.log(error)
                }
            },

            getDataFromAtributes: async (id: string) => {
                try {
                    set({ isLoading: true })
                    const response = await api.products.getProductFromAtributes(id)
                    set({ isLoading: false, productWithAtrList: response })
                } catch (error) {
                    console.log(error)
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