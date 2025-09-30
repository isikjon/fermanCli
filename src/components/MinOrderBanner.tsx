import React from 'react';
import { View, StyleSheet } from 'react-native';
import Txt from '../ui/Text';
import useCartStore from '../store/cart';
import useDeliveryStore from '../store/delivery';
import { calculateDeliveryPrice, getZoneForLocation } from '../functions';

interface Props {
    currentRoute: string;
}

const MinOrderBanner: React.FC<Props> = ({ currentRoute }) => {
    const { calculateAmount, cartList } = useCartStore();
    const { deliveryData, addresses } = useDeliveryStore();
    const currentAmount = calculateAmount();
    const minOrderAmount = 600;
    
    // Получаем информацию о доставке и зоне
    const activeAddress = deliveryData?.type === 0 && addresses.find((_, index) => index === deliveryData.id);
    const zoneName = activeAddress && getZoneForLocation(activeAddress.lat, activeAddress.lng);
    const deliveryPrice = deliveryData?.type === 0 ? zoneName ? calculateDeliveryPrice(currentAmount, zoneName.description) : 0 : 0;
    
    // Определяем минимальную сумму для бесплатной доставки в зависимости от зоны
    const getFreeDeliveryThreshold = () => {
        if (!zoneName) return 0;
        // Здесь нужно добавить логику определения порога бесплатной доставки по зонам
        // Пока используем примерные значения
        switch (zoneName.description) {
            case 'zone1': return 1500; // Например, для зоны 1
            case 'zone2': return 2000; // Для зоны 2
            default: return 1500;
        }
    };

    const freeDeliveryThreshold = getFreeDeliveryThreshold();
    const remainingForMinOrder = Math.max(0, minOrderAmount - currentAmount);
    const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - currentAmount);

    // Логика показа плашки
    if (currentRoute === 'cart') {
        // В корзине показываем только если выбрана доставка и сумма меньше минимальной
        const isDeliverySelected = deliveryData?.type === 0;
        if (!isDeliverySelected || cartList.length === 0 || currentAmount >= minOrderAmount) {
            return null;
        }
    } else if (currentRoute === 'checkout') {
        // На оформлении заказа не показываем
        return null;
    } else {
        // На других страницах показываем если есть товары и сумма меньше минимальной
        if (cartList.length === 0 || currentAmount >= minOrderAmount) {
            return null;
        }
    }

    const renderCartBanner = () => (
        <View style={styles.banner}>
            <Txt size={14} weight="Bold" color="#fff" style={styles.text}>
                {remainingForMinOrder > 0 && (
                    <>До минимального заказа: {remainingForMinOrder.toFixed()} руб.{'\n'}</>
                )}
                {deliveryPrice > 0 && remainingForFreeDelivery > 0 && (
                    <>До бесплатной доставки: {remainingForFreeDelivery.toFixed()} руб.</>
                )}
            </Txt>
        </View>
    );

    const renderGeneralBanner = () => (
        <View style={styles.banner}>
            <Txt size={14} weight="Bold" color="#fff" style={styles.text}>
                Минимальный заказ от {minOrderAmount} руб. 
                Добавьте товаров на {remainingForMinOrder.toFixed()} руб.
            </Txt>
        </View>
    );

    return currentRoute === 'cart' ? renderCartBanner() : renderGeneralBanner();
};

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        // Баннер над навбаром без перекрытия контента
        marginBottom: 0, // убираем зазор
    },
    text: {
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default MinOrderBanner;
