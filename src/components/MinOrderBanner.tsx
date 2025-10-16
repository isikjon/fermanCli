import React from 'react';
import { View, StyleSheet } from 'react-native';
import Txt from '../ui/Text';
import useCartStore from '../store/cart';
import useDeliveryStore from '../store/delivery';
import { getZoneForLocation, formatPrice, calculateDeliveryPrice } from '../functions';
import { deliveryDataObj } from '../constants/delivery';

interface Props {
    currentRoute: string;
}

const MinOrderBanner: React.FC<Props> = ({ currentRoute }) => {
    const { calculateAmount, cartList } = useCartStore();
    const { deliveryData, addresses } = useDeliveryStore();
    const currentAmount = calculateAmount();
    const minOrderAmount = 600;

    const activeAddress = deliveryData?.type === 0 && addresses.find((_, index) => index === deliveryData.id);
    const zoneName = activeAddress && getZoneForLocation(activeAddress.lat, activeAddress.lng);
    
    const getDeliveryPricing = () => {
        if (!zoneName || deliveryData?.type !== 0) {
            return { threshold349: 1500, thresholdFree: 3000, currentPrice: 0 };
        }

        const zone = deliveryDataObj.zones.find(z => z.zone.name === zoneName.description);
        if (!zone) {
            return { threshold349: 1500, thresholdFree: 3000, currentPrice: 399 };
        }

        const slot = zone.slots[0];
        if (!slot || !slot.order) {
            return { threshold349: 1500, thresholdFree: 3000, currentPrice: 399 };
        }

        let threshold349 = 0;
        let thresholdFree = 0;

        for (const priceRange of slot.order) {
            if (priceRange.price === 349 && threshold349 === 0) {
                threshold349 = priceRange.from;
            }
            if (priceRange.price === 0 && thresholdFree === 0) {
                thresholdFree = priceRange.from;
            }
        }

        let currentPrice = 0;
        try {
            currentPrice = calculateDeliveryPrice(currentAmount, zoneName.description);
        } catch (error) {
            console.log('❌ [MinOrderBanner] Error calculating delivery price:', error);
            currentPrice = 399;
        }

        return { threshold349, thresholdFree, currentPrice };
    };

    const { threshold349, thresholdFree, currentPrice } = getDeliveryPricing();

    const getBannerText = () => {
        // 1. Проверка минимального заказа (приоритет)
        if (currentAmount < minOrderAmount) {
            const remaining = minOrderAmount - currentAmount;
            return `До минимального заказа добавьте ещё ${formatPrice(remaining)} руб.`;
        }

        // 2. Только для доставки (не для самовывоза)
        if (deliveryData?.type === 0 && activeAddress) {
            // 2a. Проверка порога 349 руб
            if (threshold349 > 0 && currentAmount < threshold349) {
                const remaining = threshold349 - currentAmount;
                return `Доставка ${currentPrice} руб., до снижения стоимости добавьте ещё ${formatPrice(remaining)} руб.`;
            }

            // 2b. Проверка бесплатной доставки
            if (thresholdFree > 0 && currentAmount < thresholdFree) {
                const remaining = thresholdFree - currentAmount;
                return `Доставка ${currentPrice} руб., до бесплатной доставки добавьте ещё ${formatPrice(remaining)} руб.`;
            }

            // 2c. Бесплатная доставка достигнута
            if (currentAmount >= thresholdFree && thresholdFree > 0) {
                return `🎉 Бесплатная доставка! Заказ: ${formatPrice(currentAmount)} руб.`;
            }
        }

        // 3. Просто показываем сумму заказа
        return `Заказ: ${formatPrice(currentAmount)} руб.`;
    };

    const bannerText = getBannerText();

    console.log('🎯 MinOrderBanner rendering:', {
        currentRoute,
        currentAmount,
        minOrderAmount,
        threshold349,
        thresholdFree,
        currentPrice,
        bannerText,
        hasAddress: !!activeAddress
    });

    // Показываем баннер только когда есть товары в корзине
    if (cartList.length === 0) {
        return null;
    }

    // Скрываем на экранах где не нужен
    if (currentRoute === 'checkout' || currentRoute === 'orderSuccess' || currentRoute === 'welcome') {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.banner}>
                <Txt size={14} weight="RobotoCondensed-Bold" color="#fff" style={styles.text}>
                    {bannerText}
                </Txt>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    banner: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginBottom: 0,
    },
    text: {
        textAlign: 'left',
        lineHeight: 18,
    },
});

export default MinOrderBanner;
