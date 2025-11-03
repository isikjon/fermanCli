import 'react-native-get-random-values';
import { CategoryDTO, ProductDTO } from "../../functions/dtos"
import useCatalogStore from "../../store/catalog"
import axios from "axios"
import { getCDNImageUrl } from "../../config/cdnMapping"

const AUTH = { Authorization: "Bearer c4db121af6ea8a42da677040a1f0685075ecc5b2" }
export const MOYSKLAD_TOKEN = "Bearer c4db121af6ea8a42da677040a1f0685075ecc5b2"

function hasImage(productId: string): boolean {
    const imageUrl = getCDNImageUrl(productId, 0);
    return imageUrl !== '';
}

function sortProductsByImageAvailability(rows: any[]): any[] {
    const withImages = rows.filter(row => hasImage(row.id));
    const withoutImages = rows.filter(row => !hasImage(row.id));
    return [...withImages, ...withoutImages];
}

export async function getProducts(offset: number, category: string) {
    try {
        const { changeIsPagination } = useCatalogStore.getState();
        const productFolder = `https://api.moysklad.ru/api/remap/1.2/entity/productfolder/${category}`;
        
        const fullUrl = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=productFolder=${productFolder}&limit=1000&expand=attributes`;

        console.log('📦 [getProducts] Loading ALL products, will sort client-side');

        changeIsPagination(false, 0);
        
        const response = await axios.get(fullUrl, { headers: AUTH });

        let allRows = response.data.rows.filter(Boolean);
        
        const inStockRows = allRows.filter(row => row.quantity && row.quantity > 0);
        const outOfStockRows = allRows.filter(row => !row.quantity || row.quantity <= 0);
        
        const inStockSorted = sortProductsByImageAvailability(inStockRows);
        const outOfStockSorted = sortProductsByImageAvailability(outOfStockRows);
        
        const sortedRows = [...inStockSorted, ...outOfStockSorted];
        const totalSize = sortedRows.length;

        const inStockWithImages = inStockSorted.filter(row => hasImage(row.id)).length;
        const outOfStockWithImages = outOfStockSorted.filter(row => hasImage(row.id)).length;

        console.log('📊 [getProducts] Total:', totalSize, 
            'InStock:', inStockSorted.length, '(with images:', inStockWithImages + ')',
            'OutOfStock:', outOfStockSorted.length, '(with images:', outOfStockWithImages + ')');

        if (totalSize > 20) {
            changeIsPagination(true, totalSize);
        }

        const paginatedRows = sortedRows.slice(offset, offset + 20);

        return ProductDTO(paginatedRows);
    } catch (error) {
        console.log("getProducts error:", error);
        return [];
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

export async function searchProduct(name: string) {
    const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=name~${name}&limit=100`;

    const response = await axios.get(url, { headers: AUTH });

    let allRows = response.data.rows.filter(Boolean);
    
    const inStockRows = allRows.filter(row => row.quantity && row.quantity > 0);
    const outOfStockRows = allRows.filter(row => !row.quantity || row.quantity <= 0);
    
    const inStockSorted = sortProductsByImageAvailability(inStockRows);
    const outOfStockSorted = sortProductsByImageAvailability(outOfStockRows);
    
    const sortedRows = [...inStockSorted, ...outOfStockSorted];
    
    console.log('🔍 [searchProduct] Query:', name, 'Total:', sortedRows.length, 'InStock:', inStockSorted.length, 'OutOfStock:', outOfStockSorted.length);

    return ProductDTO(sortedRows);
}

export async function getProduct(id: string) {
    try {
        console.log('📦 [getProduct] Loading product:', id);
        
        const fullUrl = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=id=${id}&expand=attributes`;
        
        console.log('🌐 [getProduct] Request URL:', fullUrl);

        const response = await axios.get(fullUrl, {
            headers: AUTH,
        });

        console.log('📡 [getProduct] Response:', {
            rowsCount: response.data.rows?.length || 0,
            firstRow: response.data.rows?.[0] ? {
                id: response.data.rows[0].id,
                name: response.data.rows[0].name?.substring(0, 50),
                stock: response.data.rows[0].stock,
                quantity: response.data.rows[0].quantity
            } : null
        });

        if (!response.data.rows || response.data.rows.length === 0) {
            console.log('⚠️ [getProduct] Product not found in assortment, trying direct product endpoint');
            const directResponse = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`, {
                headers: AUTH
            });
            const products = ProductDTO([directResponse.data]);
            return products[0];
        }

        const products = ProductDTO(response.data.rows.filter(Boolean));
        
        if (products.length === 0) {
            console.log('❌ [getProduct] Failed to process product');
            throw new Error('Product not found');
        }

        const product = products[0];
        
        console.log('✅ [getProduct] Product loaded:', {
            name: product.name?.substring(0, 50),
            id: product.id,
            stock: product.stock,
            price: product.price
        });

        return product;
    } catch (error) {
        console.log('❌ [getProduct] ERROR:', error);
        const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`, {
            headers: AUTH
        });
        const products = ProductDTO([response.data]);
        return products[0];
    }
}

export async function getProductFromAtributes(id: string) {
    try {
        console.log('🔍 [getProductFromAtributes] START - Attribute ID:', id);
        
        const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=https://api.moysklad.ru/api/remap/1.2/entity/product/metadata/attributes/${id}=true&expand=attributes&limit=1000`;

        console.log('📡 [getProductFromAtributes] Fetching from API...');
        
        const response = await axios.get(url, { headers: AUTH });

        console.log('📦 [getProductFromAtributes] API Response:', {
            rowsCount: response.data.rows?.length || 0
        });

        let allRows = response.data.rows.filter(Boolean);
        
        const inStockRows = allRows.filter(row => row.quantity && row.quantity > 0);
        const outOfStockRows = allRows.filter(row => !row.quantity || row.quantity <= 0);
        
        const inStockSorted = sortProductsByImageAvailability(inStockRows);
        const outOfStockSorted = sortProductsByImageAvailability(outOfStockRows);
        
        const sortedRows = [...inStockSorted, ...outOfStockSorted];
        
        console.log('📊 [getProductFromAtributes] Total:', sortedRows.length, 'InStock:', inStockSorted.length, 'OutOfStock:', outOfStockSorted.length);

        if (sortedRows.length === 0) {
            console.log('⚠️ [getProductFromAtributes] NO PRODUCTS FOUND FROM API!');
        }

        const products = ProductDTO(sortedRows);
        
        console.log('✅ [getProductFromAtributes] After ProductDTO:', products.length, 'products');

        const isGreenPrices = id === '762d57da-1191-11ee-0a80-043600051b3e';
        if (isGreenPrices) {
            console.log('🟢 [getProductFromAtributes] Green Prices detected, marking products');
            return products.map(p => ({ ...p, isGreenPrice: true }));
        }
        
        return products;
    } catch (error) {
        console.error('❌ [getProductFromAtributes] ERROR:', error);
        return [];
    }
}
