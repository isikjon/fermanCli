import 'react-native-get-random-values';
import { CategoryDTO, ProductDTO } from "../../functions/dtos"
import useCatalogStore from "../../store/catalog"
import axios from "axios"
import { getCDNImageUrl } from "../../config/cdnMapping"
import { ProductType } from "../../types"
import { getDefaultStoreQueue } from "../../utils/storePriority"

const AUTH = { Authorization: "Bearer c4db121af6ea8a42da677040a1f0685075ecc5b2" }
export const MOYSKLAD_TOKEN = "Bearer c4db121af6ea8a42da677040a1f0685075ecc5b2"
const STOCK_REPORT_URL = "https://api.moysklad.ru/api/remap/1.2/report/stock/bystore"

function hasImage(productId: string): boolean {
    const imageUrl = getCDNImageUrl(productId, 0)
    return imageUrl !== ''
}

function sortProductsByImageAvailabilityList(items: ProductType[]): ProductType[] {
    const withImages = items.filter(item => hasImage(item.id))
    const withoutImages = items.filter(item => !hasImage(item.id))
    return [...withImages, ...withoutImages]
}

function extractIdFromHref(href?: string | null): string | null {
    if (!href) {
        return null
    }
    const parts = href.split('/')
    return parts.length ? parts[parts.length - 1] || null : null
}

function normalizeStockValue(value: any): number {
    if (typeof value === 'number') {
        return value
    }
    if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
}

function buildStockMap(rows: any[]): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {}

    rows.forEach(row => {
        const productId =
            extractIdFromHref(row?.assortment?.meta?.href) ||
            extractIdFromHref(row?.meta?.href)

        if (!productId) {
            return
        }

        const stockEntries =
            (Array.isArray(row?.stockByStore) && row.stockByStore) ||
            (Array.isArray(row?.storeStocks) && row.storeStocks) ||
            (Array.isArray(row?.stores) && row.stores) ||
            []

        const storeMap: Record<string, number> = {}

        stockEntries.forEach((entry: any) => {
            const storeId =
                extractIdFromHref(entry?.store?.meta?.href) ||
                extractIdFromHref(entry?.meta?.href) ||
                extractIdFromHref(entry?.storeHref)

            if (!storeId) {
                return
            }

            const value = normalizeStockValue(
                entry?.stock ??
                entry?.balance ??
                entry?.quantity ??
                entry?.available ??
                entry?.inTransit
            )

            storeMap[storeId] = value
        })

        if (!stockEntries.length) {
            const storeId = extractIdFromHref(row?.store?.meta?.href)
            if (storeId) {
                const value = normalizeStockValue(
                    row?.stock ??
                    row?.balance ??
                    row?.quantity ??
                    row?.available
                )
                storeMap[storeId] = value
            }
        }

        result[productId] = storeMap
    })

    return result
}

async function fetchStockMap(filters: string[]): Promise<Record<string, Record<string, number>>> {
    if (!filters.length) {
        return {}
    }

    try {
        const response = await axios.get(STOCK_REPORT_URL, {
            headers: AUTH,
            params: {
                limit: 1000,
                groupBy: 'assortment',
                filter: filters.join(';')
            }
        })

        const rows = Array.isArray(response.data?.rows) ? response.data.rows : []
        return buildStockMap(rows)
    } catch (error) {
        console.log('⚠️ [fetchStockMap] ERROR:', error)
        return {}
    }
}

function splitProductsByAvailability(products: ProductType[]) {
    const inStock = products.filter(item => item.stock !== undefined && item.stock > 0)
    const outOfStock = products.filter(item => !item.stock || item.stock <= 0)
    return { inStock, outOfStock }
}

export async function getProducts(offset: number, category: string, storeQueue?: string[]) {
    try {
        const { changeIsPagination } = useCatalogStore.getState()
        const productFolder = `https://api.moysklad.ru/api/remap/1.2/entity/productfolder/${category}`
        const assortmentUrl = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=productFolder=${productFolder}&limit=1000&expand=attributes`

        console.log('📦 [getProducts] Loading with store priority:', storeQueue)

        changeIsPagination(false, 0)

        const [assortmentResponse, stockMap] = await Promise.all([
            axios.get(assortmentUrl, { headers: AUTH }),
            fetchStockMap([`productFolder=${productFolder}`])
        ])

        const rows = assortmentResponse.data.rows?.filter(Boolean) || []
        const priority = storeQueue && storeQueue.length ? storeQueue : getDefaultStoreQueue()

        const products = ProductDTO(rows, { stockByStore: stockMap, storePriority: priority })
        const { inStock, outOfStock } = splitProductsByAvailability(products)

        const sorted = [
            ...sortProductsByImageAvailabilityList(inStock),
            ...sortProductsByImageAvailabilityList(outOfStock)
        ]

        const totalSize = sorted.length

        console.log('📊 [getProducts] Total:', totalSize, 'InStock:', inStock.length, 'OutOfStock:', outOfStock.length)

        if (totalSize > 20) {
            changeIsPagination(true, totalSize)
        }

        return sorted.slice(offset, offset + 20)
    } catch (error) {
        console.log("getProducts error:", error)
        return []
    }
}

export async function getCategories() {
    const response = await axios.get("https://api.moysklad.ru/api/remap/1.2/entity/productfolder?expand=path", {
        headers: AUTH
    })

    return CategoryDTO(response.data.rows)
}

export function getImage(productId: string, index: number = 0): string {
    return getCDNImageUrl(productId, index)
}

export async function searchProduct(name: string, storeQueue?: string[]) {
    const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=name~${name}&limit=100`

    const response = await axios.get(url, { headers: AUTH })

    const rows = response.data.rows?.filter(Boolean) || []
    const priority = storeQueue && storeQueue.length ? storeQueue : getDefaultStoreQueue()
    const stockFilters = rows
        .map((row: any) => extractIdFromHref(row?.meta?.href) || row?.id)
        .filter(Boolean)
        .map((id: string) => `assortment=https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`)

    const stockMap = await fetchStockMap(stockFilters)
    const products = ProductDTO(rows, { stockByStore: stockMap, storePriority: priority })
    const { inStock, outOfStock } = splitProductsByAvailability(products)

    console.log('🔍 [searchProduct] Query:', name, 'Total:', products.length, 'InStock:', inStock.length, 'OutOfStock:', outOfStock.length)

    return [
        ...sortProductsByImageAvailabilityList(inStock),
        ...sortProductsByImageAvailabilityList(outOfStock)
    ]
}

export async function getProduct(id: string, storeQueue?: string[]) {
    try {
        console.log('📦 [getProduct] Loading product:', id)

        const fullUrl = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=id=${id}&expand=attributes`
        const priority = storeQueue && storeQueue.length ? storeQueue : getDefaultStoreQueue()

        const [response, stockMap] = await Promise.all([
            axios.get(fullUrl, { headers: AUTH }),
            fetchStockMap([`assortment=https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`])
        ])

        const rows = response.data.rows?.filter(Boolean) || []

        if (!rows.length) {
            console.log('⚠️ [getProduct] Product not found in assortment, trying direct product endpoint')
            const directResponse = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`, {
                headers: AUTH
            })
            const directProducts = ProductDTO([directResponse.data], { stockByStore: stockMap, storePriority: priority })
            return directProducts[0]
        }

        const products = ProductDTO(rows, { stockByStore: stockMap, storePriority: priority })

        if (!products.length) {
            console.log('❌ [getProduct] Failed to process product')
            throw new Error('Product not found')
        }

        const product = products[0]

        console.log('✅ [getProduct] Product loaded:', {
            name: product.name?.substring(0, 50),
            id: product.id,
            stock: product.stock,
            price: product.price,
            storeId: product.storeId
        })

        return product
    } catch (error) {
        console.log('❌ [getProduct] ERROR:', error)
        const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`, {
            headers: AUTH
        })
        const fallback = ProductDTO([response.data], { stockByStore: {}, storePriority: storeQueue && storeQueue.length ? storeQueue : getDefaultStoreQueue() })
        return fallback[0]
    }
}

export async function getProductFromAtributes(id: string, storeQueue?: string[]) {
    try {
        console.log('🔍 [getProductFromAtributes] START - Attribute ID:', id)

        const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=https://api.moysklad.ru/api/remap/1.2/entity/product/metadata/attributes/${id}=true&expand=attributes&limit=1000`
        const priority = storeQueue && storeQueue.length ? storeQueue : getDefaultStoreQueue()

        const response = await axios.get(url, { headers: AUTH })

        const rows = response.data.rows?.filter(Boolean) || []
        const stockFilters = rows
            .map((row: any) => extractIdFromHref(row?.meta?.href) || row?.id)
            .filter(Boolean)
            .map((productId: string) => `assortment=https://api.moysklad.ru/api/remap/1.2/entity/product/${productId}`)

        const stockMap = await fetchStockMap(stockFilters)
        const products = ProductDTO(rows, { stockByStore: stockMap, storePriority: priority })
        const { inStock, outOfStock } = splitProductsByAvailability(products)

        console.log('📊 [getProductFromAtributes] Total:', products.length, 'InStock:', inStock.length, 'OutOfStock:', outOfStock.length)

        const sorted = [
            ...sortProductsByImageAvailabilityList(inStock),
            ...sortProductsByImageAvailabilityList(outOfStock)
        ]

        if (sorted.length === 0) {
            console.log('⚠️ [getProductFromAtributes] NO PRODUCTS FOUND FROM API!')
        }

        const isGreenPrices = id === '762d57da-1191-11ee-0a80-043600051b3e'
        if (isGreenPrices) {
            console.log('🟢 [getProductFromAtributes] Green Prices detected, marking products')
            return sorted.map(p => ({ ...p, isGreenPrice: true }))
        }

        return sorted
    } catch (error) {
        console.error('❌ [getProductFromAtributes] ERROR:', error)
        return []
    }
}
