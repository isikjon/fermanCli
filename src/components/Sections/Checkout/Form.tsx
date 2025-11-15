import { StyleSheet, TouchableOpacity, View, Dimensions, ActivityIndicator } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import Row from '../../../components/Row'
import Txt from '../../../ui/Text'
import Input from '../../../ui/Input'
import Icons from '../../../ui/Icons'
import Button from '../../../ui/Button'
import Select from '../../../ui/Select'
import Toggle from '../../../ui/Toggle'
import useCartStore from '../../../store/cart'
import useDeliveryStore from '../../../store/delivery'
import { selfPickupList } from '../../../constants'
import useBonusStore from '../../../store/bonus'
import { calculateDeliveryPrice, getSlots, getZoneForLocation, formatPrice } from '../../../functions'
import useCheckoutStore from '../../../store/checkout'
import CartItem from '../../../ui/CartItem'

const Form = () => {
    const navigation = useNavigation()
    const { calculateAmount, cartList } = useCartStore()
    const [bonusAction, setBonusAction] = useState<"save" | "writeOff">("save")
    const [paymentMethod, setPaymentMethod] = useState(0)
    const [express, setExpress] = useState(false)
    const [comment, setComment] = useState('')
    const [bonusAmount, setBonusAmount] = useState(0)
    const { deliveryData, addresses, getDelivery } = useDeliveryStore()
    const { createOrder, deliveryTime, changeDeliveryTime, isCreatingOrder } = useCheckoutStore()
    const { bonuses, calculateBonus, getBonuses } = useBonusStore()
    const bonusType = bonusAction === "writeOff" ? 0 : 1

    const activeAddress = deliveryData?.type === 0 && addresses.find((_, index) => index === deliveryData.id)
    const zoneName = activeAddress && getZoneForLocation(activeAddress.lat, activeAddress.lng)
    const deliveryPrice = deliveryData?.type === 0 ? zoneName ? calculateDeliveryPrice(calculateAmount(), zoneName.description, express) : 0 : 0
    const slotList = deliveryData?.type !== undefined ? getSlots(deliveryData?.type, express).array : []
    
    const minOrderAmount = 600
    const currentAmount = calculateAmount()
    const isOrderDisabled = cartList.length === 0 || currentAmount < minOrderAmount
    
    const screenWidth = Dimensions.get('window').width
    const isSmallScreen = screenWidth < 360

    function fillDeliveryAddress() {
        if (deliveryData?.type === 0) {
            return addresses[deliveryData.id]?.value || "Адрес не выбран"
        } else {
            if (deliveryData?.city === undefined) return "Адрес не выбран"
            return selfPickupList[deliveryData?.city].list[deliveryData.id].address
        }
    }

    useEffect(() => {
        getDelivery()
        getBonuses()
    }, [getDelivery, getBonuses])

    useEffect(() => {
        const updateBonus = async () => {
            const amount = await calculateBonus(bonusType, express)
            setBonusAmount(amount)
        }
        updateBonus()
    }, [bonusType, express, calculateBonus])

    useEffect(() => {
        if (slotList.length === 0) {
            if (deliveryTime !== "") {
                changeDeliveryTime("")
            }
            return
        }

        const hasSelected = slotList.some(slot => slot.id === deliveryTime)
        if (!hasSelected) {
            changeDeliveryTime(slotList[0].id)
        }
    }, [slotList, deliveryTime, changeDeliveryTime])

    useEffect(() => {
        if (express && deliveryData?.type === 0 && slotList.length === 0) {
            setExpress(false)
        }
    }, [express, deliveryData?.type, slotList.length])

    const selectPlaceholder = useMemo(() => (
        express ? 'Нет доступных слотов на сегодня' : 'Выберите слот'
    ), [express])

    const selectKey = useMemo(() => (express ? 'personal-slots' : 'regular-slots'), [express, slotList.length])

    const selectedSlotIndex = slotList.findIndex(i => i.id === deliveryTime)
    const selectValue = slotList.length === 0
        ? null
        : (selectedSlotIndex >= 0 ? selectedSlotIndex : 0)

    return (
        <View style={styles.Form}>
            {/* Персональная доставка */}
            {deliveryData?.type === 0 && ["Эгершельд", "Заря", "Чкалова"].includes(zoneName ? zoneName?.description : "")
                && (
                    <View style={[
                        styles.PersonalDeliveryContainer,
                        isSmallScreen && styles.PersonalDeliveryContainerSmall
                    ]}>
                        <View style={[
                            styles.PersonalDeliveryText,
                            isSmallScreen && styles.PersonalDeliveryTextSmall
                        ]}>
                            <Txt size={isSmallScreen ? 18 : 20} weight='Bold'>Персональная доставка</Txt>
                            <Txt size={isSmallScreen ? 13 : 14}>
                                по согласованию с менеджером в удобное для вас вечернее время
                            </Txt>
                        </View>
                        <View style={[
                            styles.PersonalDeliveryToggle,
                            isSmallScreen && styles.PersonalDeliveryToggleSmall
                        ]}>
                            <Toggle checked={express} onChange={value => setExpress(value)} />
                        </View>
                    </View>
                )
            }

            {/* Адрес доставки/самовывоза */}
            <TouchableOpacity activeOpacity={0.5} onPress={() => navigation.navigate("delivery")}>
                <Input
                    onChange={() => ({})}
                    label={`Адрес ${deliveryData?.type === 0 ? "доставки" : "самовывоза"}`}
                    value={fillDeliveryAddress()}
                    withIcon={{
                        component: Icons.ArrowRight,
                        onClick: () => ({})
                    }}
                    readonly
                />
            </TouchableOpacity>

            {/* Время доставки/самовывоза */}
            <View style={styles.Group}>
                <Txt size={16} weight='Bold'>Время {deliveryData?.type === 0 ? "доставки" : "самовывоза"}</Txt>
                <Select
                    key={selectKey}
                    array={slotList.map(i => i.value)}
                    onChange={value => changeDeliveryTime(slotList[value].id)}
                    value={selectValue}
                    placeholder={selectPlaceholder}
                    isScrollEnabled={true}
                />
            </View>

            {/* Бонусы */}
            <View style={styles.Bonus}>
                <Input
                    onChange={() => ({})}
                    label='Бонусы бурёнки'
                    value={String(bonuses)}
                    readonly
                />

                <Row>
                    <View style={styles.FlexBox}>
                        <Button
                            height={56}
                            background={bonusAction === "writeOff" ? "#4FBD01" : "#EEEEEE"}
                            onClick={() => setBonusAction("writeOff")}
                        >
                            <Txt color={bonusAction === "writeOff" ? "#fff" : "#4D4D4D"} size={16} weight='Bold'>Списать</Txt>
                        </Button>
                    </View>

                    <View style={styles.FlexBox}>
                        <Button
                            height={56}
                            background={bonusAction === "save" ? "#4FBD01" : "#EEEEEE"}
                            onClick={() => setBonusAction("save")}
                        >
                            <Txt color={bonusAction === "save" ? "#fff" : "#4D4D4D"} size={16} weight='Bold'>Копить</Txt>
                        </Button>
                    </View>
                </Row>
            </View>

            {/* Способ оплаты */}
            <View style={styles.Group}>
                <Txt size={16} weight='Bold'>Способ оплаты</Txt>
                <Select array={["СБП", "Наличные"]} onChange={value => setPaymentMethod(value)} value={paymentMethod} />
            </View>

            {/* Комментарий к заказу */}
            <View style={styles.Group}>
                <Input
                    onChange={setComment}
                    label='Комментарий к заказу'
                    value={comment}
                    placeholder='Укажите дополнительную информацию...'
                    multiline
                />
            </View>

            {/* Список товаров */}
            <View style={styles.ProductList}>
                <Txt size={30} weight='Bold'>Товары в корзине</Txt>
                {cartList.map((item, index) => (
                    <CartItem key={index} item={item} />
                ))}
            </View>

            {/* Итоговая стоимость */}
            <View style={styles.Group}>
                {deliveryData?.type === 0
                    ? <Row>
                        <Txt>Доставка</Txt>
                        <Txt>{formatPrice(deliveryPrice)} руб.</Txt>
                    </Row>
                    : <Row>
                        <Txt>Самовывоз</Txt>
                        <Txt>Бесплатно</Txt>
                    </Row>
                }

                <Row>
                    <Txt>Бонусы</Txt>
                    <Txt>{bonusType === 0 ? `-${bonusAmount}` : `+${bonusAmount}`}</Txt>
                </Row>

                <Row>
                    <Txt weight='Bold' size={16}>Стоимость заказа</Txt>
                    <Txt weight='Bold' size={16}>{formatPrice(calculateAmount() + deliveryPrice - (bonusType === 0 ? bonusAmount : 0))} руб.</Txt>
                </Row>
            </View>

            <Button 
                height={56} 
                onClick={() => {
                    if (!isCreatingOrder) {
                        createOrder(bonusType, express, comment)
                    }
                }}
                disabled={isOrderDisabled || isCreatingOrder}
            >
                {isCreatingOrder ? (
                    <View style={styles.LoadingContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Txt color='#fff' weight='Bold' size={18}>Оформление заказа...</Txt>
                    </View>
                ) : (
                    <Txt color='#fff' weight='Bold' size={18}>
                        {isOrderDisabled 
                            ? `Мин. заказ ${minOrderAmount} руб.` 
                            : 'Подтвердить заказ'}
                    </Txt>
                )}
            </Button>
            {isOrderDisabled && !isCreatingOrder && (
                <Txt size={14} color="#FF0000" style={{ textAlign: 'center', marginTop: -16 }}>
                    {cartList.length === 0 
                        ? 'Корзина пуста' 
                        : `Добавьте ещё ${formatPrice(minOrderAmount - currentAmount)} руб. для оформления`}
                </Txt>
            )}
        </View>
    )
}

export default Form

const styles = StyleSheet.create({
    Form: {
        paddingHorizontal: 16,
        marginTop: 32,
        gap: 24,
        paddingBottom: 70
    },
    FlexBox: {
        flex: 1
    },
    Group: {
        gap: 4
    },
    Bonus: {
        gap: 16
    },
    ProductList: {
        gap: 16
    },
    PersonalDeliveryContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12
    },
    PersonalDeliveryContainerSmall: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 16
    },
    PersonalDeliveryText: {
        flex: 1,
        gap: 4
    },
    PersonalDeliveryTextSmall: {
        flex: 0
    },
    PersonalDeliveryToggle: {
        marginTop: 4,
        marginRight: 8
    },
    PersonalDeliveryToggleSmall: {
        alignSelf: 'flex-start',
        marginTop: 0,
        marginRight: 0,
        marginLeft: 0
    },
    LoadingContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
    }
})
