import { CategoryDTO, ProductDTO } from "../../functions/dtos"
import useCatalogStore from "../../store/catalog"
import axios from "axios"
import { getZoneForLocation } from "../../functions";
import useDeliveryStore from "../../store/delivery";
import { deliveryDataObj } from "../../constants/delivery";
import { SafeRNFS } from '../../utils/safeRNFS';
import CryptoJS from 'crypto-js';
import ImageResizer from '@bam.tech/react-native-image-resizer';

const AUTH = { Authorization: "Bearer b30482f83aebb45eca5c488774a23893c9e0e04e" }
export const MOYSKLAD_TOKEN = "Bearer b30482f83aebb45eca5c488774a23893c9e0e04e"

export async function getProductsCount(category: string): Promise<number> {
    try {
        console.log('🔢 [getProductsCount] Counting products for category:', category);
        
        const { deliveryData, addresses } = useDeliveryStore.getState();
        const activeDelivery = addresses.find((_, index) => index === deliveryData?.id);
        const zone = activeDelivery && getZoneForLocation(activeDelivery?.lat, activeDelivery?.lng) || null;
        const storeId = deliveryDataObj.zones.find(i => i.zone.name === zone?.description);

        const url = "https://api.moysklad.ru/api/remap/1.2/report/stock/all";
        const store = storeId ? `https://api.moysklad.ru/api/remap/1.2/entity/store/${storeId.store.id}` : null;
        const productFolder = `https://api.moysklad.ru/api/remap/1.2/entity/productfolder/${category}`;

        const fullUrl = storeId
            ? `${url}?filter=store=${store};productFolder=${productFolder}&limit=0`
            : `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=productFolder=${productFolder}&limit=0`;

        console.log('🌐 [getProductsCount] Request URL:', fullUrl);

        const response = await axios.get(fullUrl, {
            headers: AUTH,
        });

        const count = response.data.meta.size || 0;
        console.log('✅ [getProductsCount] Result:', count);

        return count;
    } catch (error) {
        console.log("❌ [getProductsCount] error:", error);
        return 0;
    }
}

export async function getProducts(offset: number, category: string) {
    try {
        console.log('📦 [getProducts] Loading products:', { category, offset });
        
        const { changeIsPagination } = useCatalogStore.getState();
        const { deliveryData, addresses } = useDeliveryStore.getState();
        const activeDelivery = addresses.find((_, index) => index === deliveryData?.id);
        const zone = activeDelivery && getZoneForLocation(activeDelivery?.lat, activeDelivery?.lng) || null;
        const storeId = deliveryDataObj.zones.find(i => i.zone.name === zone?.description);

        const url = "https://api.moysklad.ru/api/remap/1.2/report/stock/all";
        const store = storeId ? `https://api.moysklad.ru/api/remap/1.2/entity/store/${storeId.store.id}` : null;
        const productFolder = `https://api.moysklad.ru/api/remap/1.2/entity/productfolder/${category}`;

        const fullUrl = storeId
            ? `${url}?filter=store=${store};productFolder=${productFolder}&limit=20&offset=${offset}&expand=attributes`
            : `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=productFolder=${productFolder}&limit=20&offset=${offset}&expand=attributes`;

        console.log('🌐 [getProducts] Request URL:', fullUrl);

        changeIsPagination(false, 0);
        const response = await axios.get(fullUrl, {
            headers: AUTH,
        });

        const rows = response.data.rows;
        const size = response.data.meta.size;

        console.log('✅ [getProducts] Response:', { rowsCount: rows?.length || 0, totalSize: size });

        if (size > 20) {
            changeIsPagination(true, size);
        }

        const products = ProductDTO(rows.filter(Boolean));
        console.log('📊 [getProducts] Processed products:', products.length);

        return products;
    } catch (error) {
        console.log("❌ [getProducts] error:", error);
        return [];
    }
}

export async function getCategories() {
    const response = await axios.get("https://api.moysklad.ru/api/remap/1.2/entity/productfolder?expand=path", {
        headers: AUTH
    })

    return CategoryDTO(response.data.rows)
}

export async function getImage(link: string, isClear?: boolean) {
    try {
        console.log('🖼️ [getImage] Getting image URL for:', link)
        
        if (!link || link.trim() === '') {
            console.log('⚠️ [getImage] Empty link provided')
            return null
        }

        const metadata = await axios.get(link, {
            headers: AUTH,
        })

        console.log('📡 [getImage] Metadata response:', JSON.stringify(metadata.data, null, 2))

        // Проверяем разные возможные структуры ответа
        if (metadata.data.rows && metadata.data.rows.length > 0) {
            const downloadHref = metadata.data.rows[0].meta.downloadHref
            console.log('✅ [getImage] Found download URL in rows:', downloadHref)
            return downloadHref
        }
        
        // Проверяем, если данные в другом формате
        if (metadata.data.meta && metadata.data.meta.downloadHref) {
            console.log('✅ [getImage] Found download URL in meta:', metadata.data.meta.downloadHref)
            return metadata.data.meta.downloadHref
        }
        
        // Проверяем, если это прямая ссылка на изображение
        if (metadata.data && typeof metadata.data === 'string' && metadata.data.includes('download')) {
            console.log('✅ [getImage] Found direct download URL:', metadata.data)
            return metadata.data
        }
        
        console.log('❌ [getImage] No valid image data found in response structure')
        return null
    } catch (error) {
        console.log('❌ [getImage] ERROR:', error)
        return null
    }
}

const activeDownloads = new Map<string, Promise<string | null>>();

export async function downloadImage(link: string) {
    try {
        console.log('⬇️ [downloadImage] Starting download for:', link)
        
        if (!link || link.trim() === '') {
            console.log('⚠️ [downloadImage] Empty link provided')
            return null;
        }

        if (activeDownloads.has(link)) {
            console.log('⏳ [downloadImage] Download already in progress, waiting...')
            return await activeDownloads.get(link);
        }

        const downloadPromise = performDownload(link);
        activeDownloads.set(link, downloadPromise);

        try {
            const result = await downloadPromise;
            console.log('✅ [downloadImage] Download completed:', result ? 'SUCCESS' : 'FAILED')
            return result;
        } finally {
            activeDownloads.delete(link);
        }
    } catch (error) {
        console.log('❌ [downloadImage] ERROR:', error);
        return null;
    }
}

async function performDownload(link: string): Promise<string | null> {
    let tempUri: string | null = null;
    
    try {
        console.log('🔄 [performDownload] Starting download process for:', link)
        
        const hash = CryptoJS.SHA256(link).toString();
        const cacheDir = SafeRNFS.CachesDirectoryPath;
        
        console.log('📁 [performDownload] Cache directory:', cacheDir)
        
        if (!cacheDir || cacheDir.trim() === '') {
            console.log('⚠️ [performDownload] Cache directory not available');
            return null;
        }

        const compressedUri = `${cacheDir}/${hash}_compressed.jpg`;
        const fileUri = `file://${compressedUri}`;

        console.log('🔍 [performDownload] Checking if file exists:', compressedUri)
        const fileExists = await SafeRNFS.exists(compressedUri);
        if (fileExists) {
            console.log('✅ [performDownload] File already exists, returning cached version')
            return fileUri;
        }

        tempUri = `${cacheDir}/${hash}_temp.jpg`;
        
        console.log('⬇️ [performDownload] Starting file download to:', tempUri)
        
        const downloadPromise = SafeRNFS.downloadFile({
            fromUrl: link,
            toFile: tempUri,
            headers: AUTH,
            readTimeout: 30000,
            connectionTimeout: 30000,
        });

        const downloadResult = await Promise.race([
            downloadPromise.promise,
            new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Download timeout')), 30000)
            )
        ]);

        console.log('📥 [performDownload] Download result:', downloadResult)

        // Проверяем статус загрузки
        if (downloadResult && downloadResult.statusCode === 200) {
            console.log('✅ [performDownload] Download successful')
        } else {
            console.log('❌ [performDownload] Download failed, status:', downloadResult?.statusCode)
            throw new Error(`Download failed with status: ${downloadResult?.statusCode || 'unknown'}`);
        }

        const tempFileExists = await SafeRNFS.exists(tempUri);
        if (!tempFileExists) {
            console.log('❌ [performDownload] Downloaded file not found at:', tempUri)
            throw new Error('Downloaded file not found');
        }
        
        console.log('✅ [performDownload] File downloaded successfully, starting resize...')

        const resizedImage = await ImageResizer.createResizedImage(
            tempUri,
            600,
            600,
            'JPEG',
            70,
            0,
            undefined,
            false,
            { mode: 'contain', onlyScaleDown: true }
        );

        console.log('🖼️ [performDownload] Image resize result:', resizedImage)

        if (!resizedImage || !resizedImage.uri) {
            console.log('❌ [performDownload] Image resize failed')
            throw new Error('Image resize failed');
        }

        const resizedPath = resizedImage.uri.replace('file://', '');
        
        console.log('📁 [performDownload] Moving resized image from:', resizedPath, 'to:', compressedUri)
        
        try {
            await SafeRNFS.moveFile(resizedPath, compressedUri);
            console.log('✅ [performDownload] Image processing completed successfully')
        } catch (moveError) {
            console.log('⚠️ [performDownload] Move failed, trying copy:', moveError);
            await SafeRNFS.copyFile(resizedPath, compressedUri);
            await SafeRNFS.unlink(resizedPath);
            console.log('✅ [performDownload] Image processing completed via copy')
        }

        return fileUri;
    } catch (error) {
        console.log('❌ [performDownload] ERROR:', error);
        return null;
    } finally {
        if (tempUri) {
            console.log('🧹 [performDownload] Cleaning up temp file:', tempUri)
            await SafeRNFS.unlink(tempUri);
        }
    }
}

export async function searchProduct(name: string) {
    const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=name~${name}&limit=20`, {
        headers: AUTH
    })

    return ProductDTO(response.data.rows)
}

export async function getProduct(id: string) {
    try {
        const { deliveryData, addresses } = useDeliveryStore.getState();
        const activeDelivery = addresses.find((_, index) => index === deliveryData?.id);
        const zone = activeDelivery && getZoneForLocation(activeDelivery?.lat, activeDelivery?.lng) || null;
        const storeId = deliveryDataObj.zones.find(i => i.zone.name === zone?.description);

        // Запрашиваем остатки со склада
        const stockUrl = "https://api.moysklad.ru/api/remap/1.2/report/stock/all";
        const productUrl = `https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`;
        const store = storeId ? `https://api.moysklad.ru/api/remap/1.2/entity/store/${storeId.store.id}` : null;

        // Получаем основные данные товара
        const productResponse = await axios.get(productUrl, {
            headers: AUTH
        });

        let stock = undefined;

        // Получаем остатки со склада
        if (store) {
            const stockFilter = `${stockUrl}?filter=store=${store};productid=${id}`;
            console.log('🔍 Fetching stock from:', stockFilter);
            try {
                const stockResponse = await axios.get(stockFilter, {
                    headers: AUTH
                });
                console.log('📊 Stock API response:', {
                    rowsCount: stockResponse.data.rows?.length || 0,
                    firstRow: stockResponse.data.rows?.[0] || null,
                    meta: stockResponse.data.meta
                });
                if (stockResponse.data.rows && stockResponse.data.rows.length > 0) {
                    stock = stockResponse.data.rows[0].stock;
                }
            } catch (error) {
                console.log('getProduct: stock fetch error:', error);
            }
        } else {
            console.log('⚠️ No store selected, cannot fetch stock');
        }

        // Если не получили остатки через API, пробуем получить из самого товара
        if (stock === undefined && productResponse.data.quantity !== undefined) {
            stock = productResponse.data.quantity;
            console.log('📦 Using quantity from product data:', stock);
        }

        // Добавляем остатки к данным товара
        const productData = {
            ...productResponse.data,
            stock: stock,
            quantity: stock,
            stockStore: stock
        };

        const product = ProductDTO([productData])[0];
        
        // Логируем информацию о товаре и остатках
        console.log('📦 Product loaded:', {
            name: product.name?.substring(0, 50),
            id: product.id,
            stock: product.stock,
            price: product.price,
            store: storeId?.store.name || 'no store'
        });

        return product;
    } catch (error) {
        console.log("getProduct error:", error);
        // Fallback - пытаемся получить хотя бы базовые данные
        const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`, {
            headers: AUTH
        });
        return ProductDTO([response.data])[0];
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
