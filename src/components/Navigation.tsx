import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React, {createRef, useEffect, useState} from 'react';
import { navList } from '../constants';
import Txt from '../ui/Text';
import NavImg from '../assets/svg/NavImg';
import useCartStore from '../store/cart';
import useFavoriteStore from '../store/favorite';
import useDeliveryStore from '../store/delivery';
import useGlobalStore from '../store';
import { NavigationContainerRef } from "@react-navigation/native";
import {RootStackParamList} from "../RootLayout";



export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

export function navigate(name: keyof RootStackParamList, params?: any) {
    navigationRef.current?.navigate(name, params);
}

export function getCurrentRoute() {
    return navigationRef.current?.getCurrentRoute();
}

const Navigation = () => {
    const { cartList, getCartList } = useCartStore();
    const { favoriteList, getFavoriteList } = useFavoriteStore();
    const { deliveryData } = useDeliveryStore();
    const { hideNavigation } = useGlobalStore();
    const [currentRoute, setCurrentRoute] = useState<string | undefined>();

    useEffect(() => {
        getCartList();
        getFavoriteList();
        const interval = setInterval(() => {
            setCurrentRoute(getCurrentRoute()?.name);
        }, 100);
        return () => clearInterval(interval);
    }, [getCartList, getFavoriteList]);

    const isHiddenImage = ["/checkout", "/cart", "/", "/auth"].includes(deliveryData?.type?.toString() || '');

    function isActive(link: string) {
        return link === currentRoute;
    }

    if (hideNavigation) {
        return null;
    }

    return (
        <View style={styles.NavBox}>
            {/* Картинка лежит СВЕРХУ навбара без зазора (позиционируем относительно NavBox) */}
            <NavImg pointerEvents="none" style={styles.NavImgAboveBar} />
            <View style={styles.Navigation}>
                {navList.map((item, index) => {
                    const isActiveRoute = isActive(item.link)
                    const iconColor = item.name === "избранное" && isActiveRoute ? "#EF2D45" : "#4FBD01"
                    
                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.5}
                            style={styles.NavItem}
                            onPress={() => navigate(item.link as any)}
                        >
                            <item.icon isBold={isActiveRoute} color={iconColor} width={28} height={28} />
                            <Txt weight={isActiveRoute ? "Bold" : "Regular"} size={12}>{item.name}</Txt>

                            {item.name === "корзина" && <View style={styles.Indicator}>
                                <Txt weight='Bold' color='#F73106' size={14}>{cartList.length}</Txt>
                            </View>}

                            {item.name === "избранное" && <View style={styles.Indicator}>
                                <Txt weight='Bold' color='#F73106' size={14}>{favoriteList.length}</Txt>
                            </View>}
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    );
}

export default Navigation;

const styles = StyleSheet.create({
    Navigation: {
        width: "100%",
        height: 80,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
        backgroundColor: "#FDF5E5",
        zIndex: 10, // бар поверх картинки
        elevation: 6, // для Android чтобы перекрывал по z
        paddingBottom: 15
    },
    NavItem: {
        width: "100%",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        position: 'relative',
    },
    NavImgAboveBar: {
        position: 'absolute',
        zIndex: 1, // ниже бара, чтобы бар лежал сверху
        // высота бара 80 — чтобы картинка ЧУТЬ налегала, ставим меньше 80 (регулируй здесь)
        bottom: 60, // налегание ~6px; больше число — выше, меньше — ниже
        right: 50,
    },
    NavBox: {
        position: "relative",

    },
    // Ранее сдвигали картинку вверх для каталога — отключено, чтобы иконка была на самом баре
    // IsCatalogCart: {
    //     top: -100
    // },
    Indicator: {
        position: "absolute",
        top: -5,
        transform: [{ translateX: -20 }]
    }
});
