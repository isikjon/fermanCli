import useCatalogStore from '../store/catalog';
import { ImageCacheManager } from './imageCacheManager';

// Утилита для работы с кэшем
export const cacheUtils = {
    // Очистка всего кэша
    clearAllCache: async () => {
        const { clearCache } = useCatalogStore.getState();
        clearCache();
        
        // Также очищаем кэш изображений
        await ImageCacheManager.clearImageCache();
        
        console.log('🗑️ [CACHE] Cleared all cache via cacheUtils');
    },

    // Очистка кэша для конкретной категории
    clearCategoryCache: (categoryId: string) => {
        const { clearProductsCache } = useCatalogStore.getState();
        clearProductsCache(categoryId);
    },

    // Получение статистики кэша
    getCacheStats: async () => {
        const { productsCache, attributesCache, searchCache } = useCatalogStore.getState();
        
        const productsCount = Object.keys(productsCache).length;
        const attributesCount = Object.keys(attributesCache).length;
        const searchCount = Object.keys(searchCache).length;
        
        // Получаем статистику кэша изображений
        const imageStats = await ImageCacheManager.getCacheStats();
        
        console.log(`📊 [CACHE] Stats: Products: ${productsCount}, Attributes: ${attributesCount}, Search: ${searchCount}, Images: ${imageStats.imageCount} (${imageStats.totalSizeMB}MB)`);
        
        return {
            products: productsCount,
            attributes: attributesCount,
            search: searchCount,
            images: imageStats.imageCount,
            imageSizeMB: imageStats.totalSizeMB,
            total: productsCount + attributesCount + searchCount
        };
    },

    // Очистка только кэша изображений
    clearImageCache: async () => {
        return await ImageCacheManager.clearImageCache();
    },

    // Получение статистики только кэша изображений
    getImageCacheStats: async () => {
        return await ImageCacheManager.getCacheStats();
    }
};

export default cacheUtils;
