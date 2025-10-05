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

        // Формируем URL с expand=attributes для получения всех данных сразу
        const fullUrl = storeId
            ? `${url}?filter=store=${store};productFolder=${productFolder}&limit=20&offset=${offset}&expand=attributes`
            : `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=productFolder=${productFolder}&limit=20&offset=${offset}&expand=attributes`;

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

        // Поскольку attributes уже включены в запрос, дополнительный Promise.all не нужен
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
        
        await RNFS.downloadFile({
            fromUrl: link,
            toFile: tempUri,
            headers: AUTH,
        }).promise;

        const resizedImage = await ImageResizer.createResizedImage(
            tempUri,
            1200,
            1200,
            'JPEG',
            85,
            0,
            undefined,
            false,
            { mode: 'contain', onlyScaleDown: true }
        );

        await RNFS.moveFile(resizedImage.uri.replace('file://', ''), compressedUri);
        
        await RNFS.unlink(tempUri).catch(() => {});

        return fileUri;
    } catch (error) {
        console.log('downloadImage error:', error);
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
    const response = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/product/${id}`, {
        headers: AUTH
    })

    return ProductDTO([response.data])[0]
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
