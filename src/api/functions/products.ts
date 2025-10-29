import 'react-native-get-random-values';
import { CategoryDTO, ProductDTO } from "../../functions/dtos"
import useCatalogStore from "../../store/catalog"
import axios from "axios"
import { getZoneForLocation } from "../../functions";
import useDeliveryStore from "../../store/delivery";
import { deliveryDataObj } from "../../constants/delivery";

const AUTH = { Authorization: "Bearer c4db121af6ea8a42da677040a1f0685075ecc5b2" }
export const MOYSKLAD_TOKEN = "Bearer c4db121af6ea8a42da677040a1f0685075ecc5b2"

export async function getProducts(offset: number, category: string) {
    try {
        const { changeIsPagination } = useCatalogStore.getState();
        const productFolder = `https://api.moysklad.ru/api/remap/1.2/entity/productfolder/${category}`;
        const fullUrl = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=productFolder=${productFolder}&limit=20&offset=${offset}&expand=attributes`;

        console.log(fullUrl);

        changeIsPagination(false, 0);
        const response = await axios.get(fullUrl, {
            headers: AUTH,
        });

        const rows = response.data.rows;
        const size = response.data.meta.size;

        if (size > 20) {
            changeIsPagination(true, size);
        }

        return ProductDTO(rows.filter(Boolean));
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

/**
 * Получить CDN URL изображения по ID товара
 * Теперь просто возвращает прямой CDN URL вместо загрузки из МойСклад
 */
import { getCDNImageUrl } from "../../config/cdnMapping"

export function getImage(productId: string, index: number = 0): string {
    return getCDNImageUrl(productId, index)
}

export async function searchProduct(name: string) {
    const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=name~${name}&limit=20`, {
        headers: AUTH
    })

    return ProductDTO(response.data.rows)
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
        console.log('getProductFromAtributes:id=', id);
        const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=https://api.moysklad.ru/api/remap/1.2/entity/product/metadata/attributes/${id}=true&limit=20&expand=attributes`;

        const response = await axios.get(url, { headers: AUTH });
        return ProductDTO(response.data.rows.filter(Boolean));
    } catch (error) {
        console.error('getProductFromAtributes:error:', error);
        return [];
    }
}
