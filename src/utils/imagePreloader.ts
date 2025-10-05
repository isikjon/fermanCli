import RNFS from 'react-native-fs';
import CryptoJS from 'crypto-js';
import { ImageOptimizer } from './imageOptimizer';

// Система предзагрузки изображений
class ImagePreloader {
    private preloadQueue: Set<string> = new Set();
    private preloadedImages: Map<string, string> = new Map();
    private isPreloading = false;

    // Предзагружаем изображения для следующих товаров
    async preloadImages(imageUrls: string[], maxConcurrent: number = 3): Promise<void> {
        if (this.isPreloading) return;
        
        this.isPreloading = true;
        console.log(`🔄 [PRELOAD] Starting preload for ${imageUrls.length} images`);

        // Оптимизируем URL изображений
        const optimizedUrls = imageUrls.map(url => 
            ImageOptimizer.shouldOptimize(url) 
                ? ImageOptimizer.getOptimizedImageUrl(url, 'productCard')
                : url
        );

        // Фильтруем уже загруженные изображения
        const urlsToPreload = optimizedUrls.filter(url => !this.preloadedImages.has(url));
        
        if (urlsToPreload.length === 0) {
            this.isPreloading = false;
            return;
        }

        // Загружаем изображения батчами
        const batches = this.createBatches(urlsToPreload, maxConcurrent);
        
        for (const batch of batches) {
            await Promise.allSettled(
                batch.map(url => this.preloadSingleImage(url))
            );
        }

        this.isPreloading = false;
        console.log(`✅ [PRELOAD] Completed preload for ${urlsToPreload.length} optimized images`);
    }

    // Создаем батчи для параллельной загрузки
    private createBatches<T>(array: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    // Предзагружаем одно изображение
    private async preloadSingleImage(url: string): Promise<void> {
        if (this.preloadQueue.has(url) || this.preloadedImages.has(url)) {
            return;
        }

        this.preloadQueue.add(url);

        try {
            // Проверяем что url не пустой
            if (!url || url.trim() === '') {
                console.log('⚠️ [PRELOAD] Empty URL provided');
                this.preloadQueue.delete(url);
                return;
            }

            // Проверяем что url не пустой
            if (!url || url.trim() === '') {
                console.log('⚠️ [PRELOAD] Empty URL provided');
                this.preloadQueue.delete(url);
                return;
            }

            const hash = CryptoJS.SHA256(url).toString();
            const localUri = `${RNFS.CachesDirectoryPath}/${hash}.jpg`;
            const fileUri = `file://${localUri}`;

            // Проверяем что localUri не пустой
            if (!localUri || localUri.trim() === '') {
                console.log('⚠️ [PRELOAD] Empty localUri generated');
                this.preloadQueue.delete(url);
                return;
            }

            // Проверяем кэш
            const exists = await RNFS.exists(localUri);
            if (exists) {
                this.preloadedImages.set(url, fileUri);
                this.preloadQueue.delete(url);
                return;
            }

            // Скачиваем изображение
            await RNFS.downloadFile({
                fromUrl: url,
                toFile: localUri,
                headers: { Authorization: "Bearer b30482f83aebb45eca5c488774a23893c9e0e04e" },
            });

            this.preloadedImages.set(url, fileUri);
            console.log(`📥 [PRELOAD] Preloaded image: ${url.substring(0, 50)}...`);
        } catch (error) {
            console.log(`❌ [PRELOAD] Failed to preload image: ${url.substring(0, 50)}...`, error);
        } finally {
            this.preloadQueue.delete(url);
        }
    }

    // Получаем предзагруженное изображение
    getPreloadedImage(url: string): string | null {
        return this.preloadedImages.get(url) || null;
    }

    // Очищаем кэш предзагруженных изображений
    clearCache(): void {
        this.preloadedImages.clear();
        this.preloadQueue.clear();
    }

    // Получаем статистику
    getStats(): { preloaded: number; queued: number } {
        return {
            preloaded: this.preloadedImages.size,
            queued: this.preloadQueue.size
        };
    }
}

// Экспортируем singleton
export const imagePreloader = new ImagePreloader();
