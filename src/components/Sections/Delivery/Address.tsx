import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View, Keyboard, StatusBar } from 'react-native'
import React, { FC, useEffect, useRef, useState } from 'react'
import Txt from '../../../ui/Text'
import TouchBox from '../../../components/TouchBox'
import Icons from '../../../ui/Icons'
import Checkbox from '../../../ui/Checkbox'
import useDeliveryStore from '../../../store/delivery'
import Input from '../../../ui/Input'
import Button from '../../../ui/Button'
import useGlobalStore from '../../../store'
import { SuggestionType } from '../../../types'
import { getZoneForLocation } from '../../../functions'
import useNotificationStore from '../../../store/notification'
import Row from '../../../components/Row'

interface Props {
    scrollRef?: React.RefObject<ScrollView>
}

const Address: FC<Props> = ({ scrollRef }) => {
    const { addresses, getAddressesList, deliveryData, changeDelivery, changeAddressList, getSugesstions, suggestionList, removeAddressList } = useDeliveryStore()
    const { changeEnableScroll } = useGlobalStore()
    const { setMessage } = useNotificationStore()
    const [showInput, setShowInput] = useState(false)
    const [address, setAddress] = useState("")
    const [showSuggest, setShowSuggest] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState<SuggestionType | null>(null)

    const localScrollRef = useRef<ScrollView>(null)
    const targetScrollRef = scrollRef || localScrollRef
    const inputContainerRef = useRef<View>(null)
    const inputYPosition = useRef<number>(0)

    const scrollToInput = () => {
        if (!targetScrollRef?.current || !inputContainerRef?.current) return
        
        // Используем сохранённую позицию вместо measureLayout
        if (inputYPosition.current > 0) {
            targetScrollRef.current?.scrollTo({ 
                y: Math.max(0, inputYPosition.current - 100), 
                animated: true 
            })
        } else {
            // Fallback: измеряем позицию
            inputContainerRef.current?.measure((x, y, width, height, pageX, pageY) => {
                inputYPosition.current = pageY
                targetScrollRef.current?.scrollTo({ 
                    y: Math.max(0, pageY - 100), 
                    animated: true 
                })
            })
        }
    }

    // Сохраняем позицию инпута после рендера
    useEffect(() => {
        if (showInput && inputContainerRef.current) {
            setTimeout(() => {
                inputContainerRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    inputYPosition.current = pageY
                })
            }, 100)
        }
    }, [showInput])

    useEffect(() => {
        getAddressesList()
    }, [getAddressesList])

    useEffect(() => {
        if (showInput) {
            // Даём время отрендериться инпуту
            setTimeout(scrollToInput, 200)
        }
    }, [showInput])

    useEffect(() => {
        const handler = setTimeout(() => {
            if (address.length >= 3) {
                getSugesstions(address)
                setShowSuggest(true)
            } else {
                setShowSuggest(false)
            }
        }, 300)
        return () => clearTimeout(handler)
    }, [address])

    function selectAddress(item: SuggestionType) {
        setAddress(item.value)
        const zone = getZoneForLocation(Number(item.data.geo_lat), Number(item.data.geo_lon))
        if (zone !== null) {
            setSelectedAddress(item)
            setShowSuggest(false)
        } else {
            setMessage("К сожалению мы не доставляем в этот регион", "error")
        }
    }

    const Content = (
        <View style={styles.Address}>
            <Txt size={16} weight='Bold'>Адрес доставки</Txt>

            <TouchBox onClick={() => setShowInput(!showInput)} height={56}>
                <View style={styles.Button}>
                    {showInput ? <Icons.Close width={20} height={20} /> : <Icons.Plus2 width={20} height={20} />}
                    <Txt size={16} weight='Bold'>{showInput ? "Отмена" : "Добавить адрес"}</Txt>
                    <View style={styles.Empty} />
                </View>
            </TouchBox>

            {showInput && (
                <View style={styles.InputBox} ref={inputContainerRef} collapsable={false}>
                    <Input
                        placeholder="Новый адрес"
                        value={address}
                        onChange={setAddress}
                        onFocus={scrollToInput}
                    />

                    {showSuggest && address.length !== 0 && (
                        <View style={styles.SuggestPanel}>
                            <ScrollView 
                                style={styles.SearchBoxScroll} 
                                contentContainerStyle={styles.SearchBoxContent}
                                keyboardShouldPersistTaps="always"
                                nestedScrollEnabled={true}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                {suggestionList.map((item, idx) => (
                                    <TouchableOpacity 
                                        key={`${item.value}-${idx}`}
                                        activeOpacity={0.7} 
                                        onPress={() => {
                                            Keyboard.dismiss()
                                            selectAddress(item)
                                        }}
                                        style={styles.SuggestionItem}
                                        delayPressIn={0}
                                    >
                                        <Txt weight="Bold" size={16} lines={2} lineHeight={22}>
                                            {item.value}
                                        </Txt>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <Button height={56} onClick={() => {
                        if (!selectedAddress) return
                        changeAddressList({
                            value: selectedAddress.value,
                            lat: Number(selectedAddress.data.geo_lat),
                            lng: Number(selectedAddress.data.geo_lon)
                        }, addresses.length)
                        setAddress("")
                        setShowInput(false)
                        setSelectedAddress(null)
                    }}>
                        <Txt size={16} weight='Bold' color='#fff'>Сохранить</Txt>
                    </Button>
                </View>
            )}

            <View style={styles.List}>
                {addresses.length !== 0
                    ? addresses.map((item, index) => (
                        <Row gap={10} key={index}>
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    activeOpacity={0.5}
                                    onPress={() => changeDelivery(index, 0)}
                                    style={styles.ListItem}>
                                    <Checkbox checked={deliveryData?.type === 0 && deliveryData?.id === index} />
                                    <Txt>{item.value}</Txt>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity activeOpacity={0.5} onPress={() => removeAddressList(index)}>
                                <Icons.Trash color="#EF2D45" width={24} height={24} />
                            </TouchableOpacity>
                        </Row>
                    ))
                    : <Txt>Нет адресов</Txt>
                }
            </View>
        </View>
    )

    // УБРАЛ KeyboardAvoidingView - он конфликтует
    return scrollRef ? (
        Content
    ) : (
        <ScrollView 
            ref={localScrollRef} 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: '40%' }} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
        >
            {Content}
        </ScrollView>
    )
}

export default Address

const styles = StyleSheet.create({
    Address: { gap: 16, paddingBottom: 100 },
    List: { gap: 8 },
    ListItem: { height: 56, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, borderWidth: 1, borderColor: "rgba(77,77,77,0.5)", borderRadius: 8 },
    Button: { flexDirection: "row", width: "100%", justifyContent: "space-between" },
    Empty: { width: 20, height: 20 },
    InputBox: { gap: 16, position: "relative" },
    SearchBoxContent: { gap: 12 },
    SearchBoxScroll: { maxHeight: 150 },
    SuggestPanel: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4FBD01',
        padding: 12,
        maxHeight: 150,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 12,
        zIndex: 1000,
    },
    SuggestionItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: 'transparent',
        minHeight: 44,
        justifyContent: 'center',
    },
})