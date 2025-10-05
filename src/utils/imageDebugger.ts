interface ImageDebugInfo {
    productId: string;
    productName: string;
    originalImageUrl: string | null;
    hasImage: boolean;
    imageType: 'images' | 'image' | 'photo' | 'picture' | 'none';
    price: number;
    priceSource: 'salePrices' | 'price' | 'sum' | 'none';
}

export class ImageDebugger {
    private static debugLog: ImageDebugInfo[] = [];

    static logProduct(product: any, index: number = 0) {
        if (index < 5) { // Логируем только первые 5 товаров
            const debugInfo: ImageDebugInfo = {
                productId: product?.id || 'unknown',
                productName: product?.name || 'unknown',
                originalImageUrl: null,
                hasImage: false,
                imageType: 'none',
                price: 0,
                priceSource: 'none'
            };

            // Определяем тип изображения
            if (product?.images?.meta?.href) {
                debugInfo.originalImageUrl = product.images.meta.href;
                debugInfo.hasImage = true;
                debugInfo.imageType = 'images';
            } else if (product?.image?.meta?.href) {
                debugInfo.originalImageUrl = product.image.meta.href;
                debugInfo.hasImage = true;
                debugInfo.imageType = 'image';
            } else if (product?.photo?.meta?.href) {
                debugInfo.originalImageUrl = product.photo.meta.href;
                debugInfo.hasImage = true;
                debugInfo.imageType = 'photo';
            } else if (product?.picture?.meta?.href) {
                debugInfo.originalImageUrl = product.picture.meta.href;
                debugInfo.hasImage = true;
                debugInfo.imageType = 'picture';
            }

            // Определяем источник цены
            if (product?.salePrices && Array.isArray(product.salePrices) && product.salePrices.length > 0) {
                debugInfo.price = product.salePrices[0].value / 100;
                debugInfo.priceSource = 'salePrices';
            } else if (product?.price) {
                debugInfo.price = product.price / 100;
                debugInfo.priceSource = 'price';
            } else if (product?.sum) {
                debugInfo.price = product.sum / 100;
                debugInfo.priceSource = 'sum';
            }

            this.debugLog.push(debugInfo);

            console.log(`🔍 [ImageDebugger] Product ${index + 1}:`, {
                name: debugInfo.productName,
                hasImage: debugInfo.hasImage,
                imageType: debugInfo.imageType,
                price: debugInfo.price,
                priceSource: debugInfo.priceSource,
                imageUrl: debugInfo.originalImageUrl ? debugInfo.originalImageUrl.substring(0, 50) + '...' : 'No image'
            });
        }
    }

    static getStats() {
        const total = this.debugLog.length;
        const withImages = this.debugLog.filter(item => item.hasImage).length;
        const withoutImages = total - withImages;
        
        const imageTypes = this.debugLog.reduce((acc, item) => {
            acc[item.imageType] = (acc[item.imageType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const priceSources = this.debugLog.reduce((acc, item) => {
            acc[item.priceSource] = (acc[item.priceSource] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('📊 [ImageDebugger] Stats:', {
            total,
            withImages,
            withoutImages,
            imageTypes,
            priceSources
        });

        return {
            total,
            withImages,
            withoutImages,
            imageTypes,
            priceSources
        };
    }

    static clear() {
        this.debugLog = [];
    }

    static getProductsWithoutImages() {
        return this.debugLog.filter(item => !item.hasImage);
    }
}
