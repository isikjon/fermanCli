import React from 'react';
import { View, StyleSheet } from 'react-native';
import Txt from '../ui/Text';
import useCartStore from '../store/cart';
import useDeliveryStore from '../store/delivery';
import { getZoneForLocation, formatPrice } from '../functions';
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
            return { threshold249: 1500, thresholdFree: 3000, currentPrice: 0 };
        }

        const zone = deliveryDataObj.zones.find(z => z.zone.name === zoneName.description);
        if (!zone) {
            return { threshold249: 1500, thresholdFree: 3000, currentPrice: 299 };
        }

        const slot = zone.slots[0];
        if (!slot || !slot.order) {
            return { threshold249: 1500, thresholdFree: 3000, currentPrice: 299 };
        }

        let currentPrice = 299;
        let threshold249 = 0;
        let thresholdFree = 0;

        for (const priceRange of slot.order) {
            if (currentAmount >= priceRange.from && currentAmount <= priceRange.to) {
                currentPrice = priceRange.price;
            }
            if (priceRange.price === 249 && threshold249 === 0) {
                threshold249 = priceRange.from;
            }
            if (priceRange.price === 0 && thresholdFree === 0) {
                thresholdFree = priceRange.from;
            }
        }

        return { threshold249, thresholdFree, currentPrice };
    };

    const { threshold249, thresholdFree, currentPrice } = getDeliveryPricing();

    const getBannerText = () => {
        // 1. Проверка минимального заказа (приоритет)
        if (currentAmount < minOrderAmount) {
            const remaining = minOrderAmount - currentAmount;
            return `До минимального заказа добавьте ещё ${formatPrice(remaining)} руб.`;
        }

        // 2. Только для доставки (не для самовывоза)
        if (deliveryData?.type === 0 && activeAddress) {
            // 2a. Проверка порога 249 руб
            if (threshold249 > 0 && currentAmount < threshold249) {
                const remaining = threshold249 - currentAmount;
                return `Чтобы снизить стоимость доставки до 249 руб., добавьте ещё ${formatPrice(remaining)} руб.`;
            }

            // 2b. Проверка бесплатной доставки
            if (thresholdFree > 0 && currentAmount < thresholdFree) {
                const remaining = thresholdFree - currentAmount;
                return `До бесплатной доставки добавьте ещё ${formatPrice(remaining)} руб.`;
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
        threshold249,
        thresholdFree,
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
        <View style={styles.banner}>
            <Txt size={14} weight="Bold" color="#fff" style={styles.text}>
                {bannerText}
            </Txt>
        </View>
    );
};

const styles = StyleSheet.create({
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
