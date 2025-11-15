import { StyleSheet, View, Share } from 'react-native'
import React, { useCallback } from 'react'
import TouchBox from '../../../components/TouchBox'
import Icons from '../../../ui/Icons'
import Txt from '../../../ui/Text'
import Row from '../../../components/Row'
import useCatalogStore from '../../../store/catalog'
import useNotificationStore from '../../../store/notification'
import { generateShareMessage, generateShareUrl } from '../../../utils/shareProduct'

const Reviews = () => {
    const { activeProduct } = useCatalogStore()
    const { setMessage } = useNotificationStore()

    const handleShare = useCallback(async () => {
        console.log('🔘 [Reviews Share] ========== КНОПКА ПОДЕЛИТЬСЯ НАЖАТА ==========')
        console.log('🔘 [Reviews Share] Время:', new Date().toISOString())
        
        console.log('📋 [Reviews Share] Проверка activeProduct:', {
            exists: !!activeProduct,
            productId: activeProduct?.id,
            productName: activeProduct?.name,
            price: activeProduct?.price,
            weighed: activeProduct?.weighed
        })

        if (!activeProduct) {
            console.error('❌ [Reviews Share] ОШИБКА: activeProduct не найден!')
            setMessage('Товар не загружен', 'error')
            return
        }

        try {
            console.log('📝 [Reviews Share] Формирование сообщения и ссылки...')
            const shareMessage = generateShareMessage(activeProduct)
            const shareUrl = generateShareUrl(activeProduct)
            
            console.log('📤 [Reviews Share] Сообщение для sharing:', shareMessage)
            console.log('🔗 [Reviews Share] Ссылка на продукт:', shareUrl)
            console.log('📤 [Reviews Share] Вызов Share.share()...')
            
            const result = await Share.share({
                message: shareMessage,
                url: shareUrl,
                title: activeProduct.name
            })

            console.log('📥 [Reviews Share] Результат Share.share():', {
                action: result.action,
                activityType: result.activityType,
                sharedAction: Share.sharedAction,
                dismissedAction: Share.dismissedAction
            })

            if (result.action === Share.sharedAction) {
                console.log('✅ [Reviews Share] Успешно поделились!')
                if (result.activityType) {
                    console.log('📱 [Reviews Share] Использован канал:', result.activityType)
                    setMessage('Спасибо за то, что делитесь!', 'success')
                } else {
                    console.log('📱 [Reviews Share] Поделились (канал неизвестен)')
                    setMessage('Спасибо за то, что делитесь!', 'success')
                }
            } else if (result.action === Share.dismissedAction) {
                console.log('❌ [Reviews Share] Пользователь отменил sharing')
            } else {
                console.log('⚠️ [Reviews Share] Неизвестный результат action:', result.action)
            }
            
            console.log('🔘 [Reviews Share] ========== ОБРАБОТКА ЗАВЕРШЕНА ==========')
        } catch (error: any) {
            console.error('❌ [Reviews Share] ========== ПРОИЗОШЛА ОШИБКА ==========')
            console.error('❌ [Reviews Share] Тип ошибки:', typeof error)
            console.error('❌ [Reviews Share] Ошибка:', error)
            console.error('❌ [Reviews Share] Сообщение ошибки:', error?.message)
            console.error('❌ [Reviews Share] Stack trace:', error?.stack)
            setMessage('Не удалось поделиться товаром', 'error')
        }
    }, [activeProduct, setMessage])

    return (
        <View style={styles.Box}>
            <Row gap={16}>
                <TouchBox isFull background="#4FBD0180" height={56}>
                    <View style={styles.Group}>
                        <Icons.Cart />
                        <View style={styles.TextWrapper}>
                            <Txt weight='Bold' size={16} numberOfLines={1}>Добавить в список покупок</Txt>
                        </View>
                    </View>
                </TouchBox>

                <TouchBox height={56} onClick={() => {
                    console.log('🖱️ [Reviews] TouchBox для Share был нажат!')
                    handleShare()
                }}>
                    <Icons.Share width={24} height={24} />
                </TouchBox>
            </Row>

            <TouchBox height={56}>
                <Row>
                    <Txt size={16}>Читать отзывы</Txt>

                    <View style={styles.Reviews}>
                        <Icons.Star color="#FF7A00" />
                        <Txt size={16}>{`4.5 (129)`}</Txt>
                    </View>
                </Row>
            </TouchBox>
        </View>
    )
}

export default Reviews

const styles = StyleSheet.create({
    Box: {
        paddingHorizontal: 16,
        gap: 16,
        paddingBottom: '5%',
        marginTop: 32
    },
    Reviews: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    Group: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 16
    },
    TextWrapper: {
        flex: 1,
        flexShrink: 1
    }
})