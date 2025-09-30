import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
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
import { calculateDeliveryPrice, getSlots, getZoneForLocation } from '../../../functions'
import useCheckoutStore from '../../../store/checkout'
import CartItem from '../../../ui/CartItem'

const Form = () => {
    const navigation = useNavigation() // вместо router
    const { calculateAmount, cartList } = useCartStore()
    const [bonusAction, setBonusAction] = useState<"save" | "writeOff">("save")
    const [paymentMethod, setPaymentMethod] = useState(0)
    const [express, setExpress] = useState(false)
    const [expressTime, setExpressTime] = useState(3)
    const [comment, setComment] = useState('')
    const { deliveryData, addresses, getDelivery } = useDeliveryStore()
    const { createOrder, deliveryTime, changeDeliveryTime } = useCheckoutStore()
    const { bonuses, calculateBonus } = useBonusStore()
    const bonusType = bonusAction === "writeOff" ? 0 : 1
    const bonusAmount = calculateBonus(bonusType, express)

    const activeAddress = deliveryData?.type === 0 && addresses.find((_, index) => index === deliveryData.id)
    const zoneName = activeAddress && getZoneForLocation(activeAddress.lat, activeAddress.lng)
    const deliveryPrice = deliveryData?.type === 0 ? zoneName ? calculateDeliveryPrice(calculateAmount(), zoneName.description, express) : 0 : 0
    const slotList = deliveryData?.type !== undefined ? getSlots(deliveryData?.type).array : []

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
    }, [getDelivery])

    return (
        <View style={styles.Form}>
            {/* Экспресс-доставка */}
            {deliveryData?.type === 0 && ["Эгершельд", "Заря", "Чкалова"].includes(zoneName ? zoneName?.description : "")
                && <>
                    <Row>
                        <View style={styles.Group}>
                            <Txt size={20} weight='Bold'>Экспресс доставка</Txt>
                            <Txt>Сегодня в течение 2х часов</Txt>
                        </View>
                        <Toggle checked={express} onChange={value => setExpress(value)} />
                    </Row>
                </>
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
            {!express && (
                <View style={styles.Group}>
                    <Txt size={16} weight='Bold'>Время {deliveryData?.type === 0 ? "доставки" : "самовывоза"}</Txt>
                    <Select
                        array={slotList.map(i => i.value)}
                        onChange={value => changeDeliveryTime(slotList[value].id)}
                        value={slotList.findIndex(i => i.id === deliveryTime)}
                    />
                </View>
            )}

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
                        <Txt>{deliveryPrice} руб.</Txt>
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
                    <Txt weight='Bold' size={16}>{(calculateAmount() + deliveryPrice - (bonusType === 0 ? bonusAmount : 0)).toFixed()} руб.</Txt>
                </Row>
            </View>

            <Button height={56} onClick={() => createOrder(bonusType, express)}>
                <Txt color='#fff' weight='Bold' size={18}>Подтвердить заказ</Txt>
            </Button>
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
    }
})
