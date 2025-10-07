import { CategoryDTO, ProductDTO } from "../../functions/dtos"
import useCatalogStore from "../../store/catalog"
import axios from "axios"
import { getZoneForLocation } from "../../functions";
import useDeliveryStore from "../../store/delivery";
import { deliveryDataObj } from "../../constants/delivery";
import RNFS from 'react-native-fs';
import CryptoJS from 'crypto-js';
import ImageResizer from '@bam.tech/react-native-image-resizer';

const AUTH = { Authorization: "Bearer b30482f83aebb45eca5c488774a23893c9e0e04e" }

export async function getProductsCount(category: string): Promise<number> {
    try {
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

        const response = await axios.get(fullUrl, {
            headers: AUTH,
        });

        return response.data.meta.size || 0;
    } catch (error) {
        console.log("getProductsCount error:", error);
        return 0;
    }
}

export async function getProducts(offset: number, category: string) {
    try {
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

export async function getImage(link: string, isClear?: boolean) {
    try {
        if (!link || link.trim() === '') {
            return null
        }

        const metadata = await axios.get(link, {
            headers: AUTH,
        })

        if (metadata.data.rows && metadata.data.rows.length > 0) {
            return metadata.data.rows[0].meta.downloadHref
        }
        
        return null
    } catch (error) {
        console.log('getImage error:', error)
        return null
    }
}

export async function downloadImage(link: string) {
    try {
        if (!link || link.trim() === '') {
            return null;
        }

        const hash = CryptoJS.SHA256(link).toString();
        const compressedUri = `${RNFS.CachesDirectoryPath}/${hash}_compressed.jpg`;
        const fileUri = `file://${compressedUri}`;

        const fileInfo = await RNFS.exists(compressedUri);
        if (fileInfo) {
            return fileUri;
        }

        const tempUri = `${RNFS.CachesDirectoryPath}/${hash}_temp.jpg`;
        
        const downloadResult = await Promise.race([
            RNFS.downloadFile({
                fromUrl: link,
                toFile: tempUri,
                headers: AUTH,
                readTimeout: 10000,
                connectionTimeout: 10000,
            }).promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Download timeout')), 10000)
            )
        ]);

        if (!downloadResult || downloadResult.statusCode !== 200) {
            throw new Error('Download failed');
        }

        const fileExists = await RNFS.exists(tempUri);
        if (!fileExists) {
            throw new Error('Downloaded file not found');
        }

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

        await RNFS.moveFile(resizedImage.uri.replace('file://', ''), compressedUri);
        await RNFS.unlink(tempUri).catch(() => {});

        return fileUri;
    } catch (error) {
        return null;
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
