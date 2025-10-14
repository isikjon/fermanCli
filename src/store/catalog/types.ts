import ICategory from "../types"
import ProductType from "../types"

export interface State {
    category: string,
    catalogList: ICategory[]
    productList: ProductType[]
    isLoading: boolean,
    isPagination: boolean,
    pages: number
    activePage: number
    search: string
    searchList: { name: string, id: string }[]

    changeSearch: (value: string) => void
    changePage: (page: number) => void
    changeIsPagination: (value: boolean, size: number) => void
    changeCategory: (value: string) => void
    getCategories: () => Promise<void>
    getProducts: (catalogId: string) => Promise<void>
    getImage: (link: string, isClear?: boolean) => Promise<any>
    searchProduct: () => Promise<void>
    searchProductByName: (name: string) => Promise<void>
}

export interface PreloadImagesFunction {
    (links: string[]): Promise<void>
}

export interface CachedState {
    category: string
    catalogList: ICategory[]
    productList: ProductType[]
    searchList: { name: string, id: string }[]
    search: string
    isLoading: boolean
    isPagination: boolean
    pages: number
    activePage: number
    activeProduct: ProductType | null
    activeProductImage: string | null
    productWithAtrList: ProductType[]
    productsCount: number
    selectedAmounts: Record<string, number>

    categoriesCache: any[] | null
    productsCache: Record<string, any>
    searchCache: Record<string, any>
    imageMetadataCache: Record<string, string>
    imageCache: Record<string, string>
    productsCountCache: Record<string, number>

    changeSearch: (value: string) => void
    changePage: (page: number) => void
    changeIsPagination: (value: boolean, size: number) => void
    setCategory: (categoryId: string) => void
    changeCategory: (value: string) => void
    clearProductsCache: () => void
    setSelectedAmount: (productId: string, amount: number) => void
    getSelectedAmount: (productId: string) => number | undefined
    clearSelectedAmount: (productId: string) => void
    getCategories: () => Promise<void>
    getProductsCount: (catalogId: string) => Promise<number>
    getProducts: (catalogId: string) => Promise<void>
    getImage: (link: string, isClear?: boolean) => Promise<any>
    preloadImages: (links: string[]) => Promise<void>
    searchProduct: () => Promise<void>
    searchProductByName: (name: string) => Promise<void>
    getProduct: (id: string) => Promise<void>
    getDataFromAtributes: (id: string) => Promise<void>
}