import { Dimensions, StyleSheet, View, Share } from 'react-native'
import React, { useCallback, useEffect, useRef, useMemo } from 'react'
import RoundButton from '../../../ui/RoundButton'
import Icons from '../../../ui/Icons'
import useCatalogStore from '../../../store/catalog'
import useFavoriteStore from '../../../store/favorite'
import { IFavorite } from '../../../types'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import OptimizedImage from '../../../ui/OptimizedImage'
import useNotificationStore from '../../../store/notification'

const Preview = () => {
    const { activeProduct } = useCatalogStore()
    const { addItemToFav, removeItemFromFav, getFavoriteList, favoriteList } = useFavoriteStore()
    const { setMessage } = useNotificationStore()

    const navigation = useNavigation()
    const route = useRoute<any>()
    const productId = route.params?.id
    const isMounted = useRef(true)
    
    const isExist = useMemo(() => {
        const exists = favoriteList.some(item => item.id === productId)
        console.log('Проверка избранного для товара:', productId, 'Результат:', exists, 'Список:', favoriteList.length)
        return exists
    }, [favoriteList, productId])

    const handleShare = useCallback(async () => {
        console.log('🔘 [Share] ========== КНОПКА ПОДЕЛИТЬСЯ НАЖАТА ==========')
        console.log('🔘 [Share] Время:', new Date().toISOString())
        
        console.log('📋 [Share] Проверка activeProduct:', {
            exists: !!activeProduct,
            productId: activeProduct?.id,
            productName: activeProduct?.name,
            price: activeProduct?.price,
            weighed: activeProduct?.weighed
        })

        if (!activeProduct) {
            console.error('❌ [Share] ОШИБКА: activeProduct не найден!')
            setMessage('Товар не загружен', 'error')
            return
        }

        try {
            console.log('📝 [Share] Формирование сообщения...')
            const shareMessage = `${activeProduct.name}\n\n💰 Цена: ${activeProduct.price} руб.${activeProduct.weighed ? ' / кг' : ''}\n\n🛒 Закажи в Бурёнка - магазин фермерских продуктов`
            
            console.log('📤 [Share] Сообщение для sharing:', shareMessage)
            console.log('📤 [Share] Вызов Share.share()...')
            
            const result = await Share.share({
                message: shareMessage,
                title: activeProduct.name
            })

            console.log('📥 [Share] Результат Share.share():', {
                action: result.action,
                activityType: result.activityType,
                sharedAction: Share.sharedAction,
                dismissedAction: Share.dismissedAction
            })

            if (result.action === Share.sharedAction) {
                console.log('✅ [Share] Успешно поделились!')
                if (result.activityType) {
                    console.log('📱 [Share] Использован канал:', result.activityType)
                    setMessage('Спасибо за то, что делитесь!', 'success')
                } else {
                    console.log('📱 [Share] Поделились (канал неизвестен)')
                    setMessage('Спасибо за то, что делитесь!', 'success')
                }
            } else if (result.action === Share.dismissedAction) {
                console.log('❌ [Share] Пользователь отменил sharing')
            } else {
                console.log('⚠️ [Share] Неизвестный результат action:', result.action)
            }
            
            console.log('🔘 [Share] ========== ОБРАБОТКА ЗАВЕРШЕНА ==========')
        } catch (error: any) {
            console.error('❌ [Share] ========== ПРОИЗОШЛА ОШИБКА ==========')
            console.error('❌ [Share] Тип ошибки:', typeof error)
            console.error('❌ [Share] Ошибка:', error)
            console.error('❌ [Share] Сообщение ошибки:', error?.message)
            console.error('❌ [Share] Stack trace:', error?.stack)
            setMessage('Не удалось поделиться товаром', 'error')
        }
    }, [activeProduct, setMessage])

    const handleLike = useCallback(() => {
        if (!activeProduct) return

        const payload: IFavorite = {
            id: activeProduct.id,
            image: activeProduct.image,
            name: activeProduct.name,
            price: activeProduct.price,
            isWeighted: activeProduct.weighed,
            weight: 0.1,
            stock: activeProduct.stock
        }

        if (isExist) {
            console.log('Удаляем из избранного:', activeProduct.id)
            removeItemFromFav(activeProduct.id)
        } else {
            console.log('Добавляем в избранное:', activeProduct.id)
            addItemToFav(payload)
        }
    }, [activeProduct, isExist, removeItemFromFav, addItemToFav])

    useFocusEffect(
        useCallback(() => {
            getFavoriteList()
        }, [getFavoriteList])
    )

    useEffect(() => {
        console.log('🎬 [Preview] Компонент смонтирован')
        console.log('🎬 [Preview] productId из route:', productId)
        console.log('🎬 [Preview] handleShare функция создана:', typeof handleShare)
        isMounted.current = true
        return () => {
            console.log('🎬 [Preview] Компонент размонтирован')
            isMounted.current = false
        }
    }, [productId, handleShare])

    console.log('🔄 [Preview] RENDER - activeProduct:', activeProduct ? {
        id: activeProduct.id,
        name: activeProduct.name?.substring(0, 30),
        exists: true
    } : 'НЕТ ТОВАРА')

    return (
        <View style={styles.Preview}>
            {activeProduct ? (
                <OptimizedImage
                    productId={activeProduct.id}
                    index={0}
                    style={styles.Image}
                    resizeMode="cover"
                    emptyStyle={styles.Empty}
                />
            ) : (
                <View style={styles.Empty} />
            )}

            <View style={styles.Top} pointerEvents="box-none">
                <RoundButton onClick={() => navigation.goBack()}>
                    <Icons.Back />
                </RoundButton>

                <View style={styles.Share}>
                    <RoundButton onClick={() => {
                        console.log('🖱️ [Preview] RoundButton для Share был нажат!')
                        handleShare()
                    }}>
                        <Icons.Share />
                    </RoundButton>
                    <RoundButton onClick={() => {
                        console.log('🖱️ [Preview] RoundButton для Like был нажат!')
                        handleLike()
                    }}>
                        <Icons.Heard isBold={isExist} color={isExist ? "#EF2D45" : "#4D4D4D"} />
                    </RoundButton>
                </View>
            </View>
        </View>
    )
}

export default Preview

const styles = StyleSheet.create({
    Preview: {
        width: "100%",
        height: Dimensions.get("screen").width - 32,
        paddingHorizontal: 16,
        marginTop: 8,
        position: "relative"
    },
    Image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        borderRadius: 16
    },
    Top: {
        position: "absolute",
        top: 24,
        left: 32,
        justifyContent: "space-between",
        flexDirection: "row",
        width: Dimensions.get("screen").width - 64,
    },
    Share: {
        gap: 16
    },
    Bottom: {
        position: "absolute",
        bottom: 24,
        left: 32,
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "flex-end",
        width: Dimensions.get("screen").width - 64,
    },
    Empty: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEEEEE",
        borderRadius: 16
    }
})
