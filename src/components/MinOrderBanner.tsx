import React from 'react';
import { View, StyleSheet } from 'react-native';
import Txt from '../ui/Text';
import useCartStore from '../store/cart';
import useDeliveryStore from '../store/delivery';
import { getZoneForLocation } from '../functions';
import { deliveryDataObj } from '../constants/delivery';

interface Props {
    currentRoute: string;
}

const MinOrderBanner: React.FC<Props> = ({ currentRoute }) => {
    const { calculateAmount, cartList } = useCartStore();
    const { deliveryData, addresses } = useDeliveryStore();
    const currentAmount = calculateAmount();
    const minOrderAmount = 600;

    if (currentRoute === 'checkout' || currentRoute === 'cart' || currentRoute === 'contacts') {
        return null;
    }

    if (cartList.length === 0) {
        return null;
    }

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
        if (currentAmount < minOrderAmount) {
            const remaining = minOrderAmount - currentAmount;
            return `Минимальный заказ от ${minOrderAmount} руб. Добавьте товаров на ${remaining.toFixed()} руб.`;
        }

        if (currentAmount < threshold249 && threshold249 > 0 && deliveryData?.type === 0) {
            const remaining = threshold249 - currentAmount;
            return `Чтобы снизить стоимость доставки до 249 руб, добавьте в корзину товаров на ${remaining.toFixed()} руб.`;
        }

        if (currentAmount < thresholdFree && thresholdFree > 0 && deliveryData?.type === 0) {
            const remaining = thresholdFree - currentAmount;
            return `Чтобы стоимость доставки стала 0 руб, добавьте в корзину товаров на ${remaining.toFixed()} руб.`;
        }

        return `Заказ: ${currentAmount.toFixed()} руб.`;
    };

    return (
        <View style={styles.banner}>
            <Txt size={14} weight="Bold" color="#fff" style={styles.text}>
                {getBannerText()}
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
