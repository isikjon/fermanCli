import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { historyList } from '../../../constants'
import Txt from '../../../ui/Text'
import Button from '../../../ui/Button'
import Row from '../../../components/Row'
import useGlobalStore from '../../../store'
import useCheckoutStore from '../../../store/checkout'

const History = () => {
    const { changeModal } = useGlobalStore()
    const { getOrderList, ordersList, changeOpenedOrderId } = useCheckoutStore()

    useEffect(() => {
        getOrderList()
    }, [getOrderList])

    return (
        <View style={styles.List}>
            {ordersList.length !== 0
                ? <>
                    {ordersList.map((item, index) => (
                        <View key={index} style={styles.Card}>
                            <Row>
                                <Txt weight='Bold'>Дата создания</Txt>
                                <Txt>{item.created}</Txt>
                            </Row>

                            <Row>
                                <Txt weight='Bold'>Номер заказа</Txt>
                                <Txt>{`№${item.name}`}</Txt>
                            </Row>

                            <Row>
                                <Txt weight='Bold'>Способ получения</Txt>
                                <Txt>{item.deliveryType}</Txt>
                            </Row>

                            <Row>
                                <Txt weight='Bold'>Сумма</Txt>
                                <Txt>{item.sum} руб.</Txt>
                            </Row>

                            <Row>
                                <Txt weight='Bold'>Бонусы</Txt>
                                <Txt>{item.bonus}</Txt>
                            </Row>

                            <Row>
                                <Txt weight='Bold'>Статус</Txt>
                                <Txt>{item.status}</Txt>
                            </Row>

                            <Row gap={16}>
                                <View style={styles.Total}>
                                    <Txt weight='Bold' size={16}>Итого</Txt>
                                    <Txt weight='Bold' size={16}>{String(item.bonus)[0] === "-" ? (item.sum + Number(item.bonus)) : item.sum} руб.</Txt>
                                </View>

                                <View style={styles.ButtonBox}>
                                    <Button onClick={() => {
                                        changeModal(true, "orderHistory")
                                        changeOpenedOrderId(item.id)
                                    }}>
                                        <Txt color='#fff' weight='Bold'>Подробнее</Txt>
                                    </Button>
                                </View>
                            </Row>
                        </View>
                    ))}
                </>
                : <Txt>У вас еще нет заказов</Txt>
            }
        </View>
    )
}

export default History

const styles = StyleSheet.create({
    List: {
        gap: 16,
        paddingBottom: 50
    },
    Card: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: "#EEEEEE",
        borderRadius: 16,
        gap: 8
    },
    ButtonBox: {
        flex: 1,
        marginTop: 16
    },
    Total: {
        marginTop: 16,
        flexDirection: "row",
        gap: 16
    }
})