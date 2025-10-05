import { Dimensions } from 'react-native';

// Утилита для оптимизации изображений
export class ImageOptimizer {
    private static screenWidth = Dimensions.get('window').width;
    private static screenHeight = Dimensions.get('window').height;
    
    // Оптимальные размеры для разных типов изображений
    private static readonly OPTIMIZED_SIZES = {
        // Для ProductCard (2 колонки)
        productCard: {
            width: Math.ceil((this.screenWidth - 32 - 24) / 2), // Ширина экрана минус отступы и gap
            height: 200,
            quality: 0.8
        },
        // Для больших изображений
        large: {
            width: this.screenWidth,
            height: this.screenHeight * 0.4,
            quality: 0.9
        },
        // Для миниатюр
        thumbnail: {
            width: 100,
            height: 100,
            quality: 0.7
        }
    };

    // Генерируем оптимизированный URL для изображения
    static getOptimizedImageUrl(originalUrl: string, type: 'productCard' | 'large' | 'thumbnail' = 'productCard'): string {
        if (!originalUrl || !originalUrl.includes('api.moysklad.ru')) {
            return originalUrl;
        }

        const config = this.OPTIMIZED_SIZES[type];
        
        // Добавляем параметры для сжатия изображения
        const url = new URL(originalUrl);
        url.searchParams.set('width', config.width.toString());
        url.searchParams.set('height', config.height.toString());
        url.searchParams.set('quality', config.quality.toString());
        url.searchParams.set('format', 'webp'); // Используем WebP для лучшего сжатия
        
        return url.toString();
    }

    // Получаем размеры для ProductCard
    static getProductCardSize(): { width: number; height: number } {
        return {
            width: this.OPTIMIZED_SIZES.productCard.width,
            height: this.OPTIMIZED_SIZES.productCard.height
        };
    }

    // Проверяем нужно ли оптимизировать изображение
    static shouldOptimize(url: string): boolean {
        return url && url.includes('api.moysklad.ru') && !url.includes('width=');
    }

    // Получаем статистику оптимизации
    static getOptimizationStats(): { screenWidth: number; screenHeight: number; productCardSize: any } {
        return {
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            productCardSize: this.OPTIMIZED_SIZES.productCard
        };
    }
}

// Экспортируем для использования
export default ImageOptimizer;
