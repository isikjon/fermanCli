import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { FC, useEffect, useRef, useState } from 'react'
import Banner from './Banner'
import TouchBox from './TouchBox'
import Icons from '../ui/Icons'
import Txt from '../ui/Text'
import Search from '../ui/Search'
import { useNavigation } from '@react-navigation/native'
import useGlobalStore from '../store'
import useDeliveryStore from '../store/delivery'
import { selfPickupList } from '../constants'
import useBonusStore from '../store/bonus'
import useCatalogStore from '../store/catalog'
import icon from "../assets/images/icon.png";
import cow from "../assets/svg/Cow.png";
import { useSafeAreaInsets } from 'react-native-safe-area-context'
interface Props {
    isHideSearch?: boolean
    scrollRef?: React.RefObject<ScrollView>
}

const Header: FC<Props> = ({ isHideSearch, scrollRef }) => {
    const insets = useSafeAreaInsets()
    const { isAuth, changeEnableScroll } = useGlobalStore()
    const navigation = useNavigation<any>()
    const { deliveryData, addresses, getDelivery, getAddressesList } = useDeliveryStore()
    const { bonuses } = useBonusStore()
    const { search, changeSearch, searchProductByName, searchList } = useCatalogStore()
    const [localSearch, setLocalSearch] = useState(search)

    const searchWrapperRef = useRef<View>(null)

    const scrollToSearch = () => {
        if (!scrollRef?.current || !searchWrapperRef.current) return
        searchWrapperRef.current.measure((fx, fy, width, height, px, py) => {
            scrollRef.current?.scrollTo({ y: py - 100, animated: true })
        })
    }

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
        getAddressesList()
    }, [getDelivery, getAddressesList])

    useEffect(() => {
        const handler = setTimeout(() => {
            changeSearch(localSearch)
            if (localSearch.length > 0) {
                searchProductByName(localSearch)
                changeEnableScroll(false)
                scrollToSearch()
            }
        }, 300)

        if (localSearch.length === 0) {
            changeEnableScroll(true)
        }

        return () => clearTimeout(handler)
    }, [localSearch, changeSearch, searchProductByName])

    return (
        <View style={[styles.Header, { paddingTop: insets.top + 24 }]}>
            <View style={styles.TopBar}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('home')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Image source={icon} style={styles.Logo} />
                </TouchableOpacity>
                <Banner />
            </View>

            <View style={styles.ControllBar}>
                <TouchBox onClick={() => navigation.navigate("notifications")}>
                    <Icons.Bell />
                </TouchBox>

                <TouchBox isFull onClick={() => navigation.navigate("delivery")}>
                    <View style={styles.Box}>
                        {deliveryData ? (
                            <Txt lines={1}>{fillDeliveryAddress()}</Txt>
                        ) : (
                            <Txt lines={1}>Адрес не выбран</Txt>
                        )}
                        <Txt lines={1} color="rgba(77,77,77,0.7)">
                            {deliveryData?.type !== undefined
                                ? deliveryData.type === 0 ? "Доставка" : "Самовывоз"
                                : "Способ получения"}
                        </Txt>
                    </View>
                </TouchBox>

                <TouchBox padding={40} onClick={() => navigation.navigate(isAuth ? "profile" : "auth")}>
                    {isAuth ? (
                        <>
                            <Image style={styles.Image} source={cow} />
                            <View style={styles.Bonus}>
                                <Txt color="#EF2D45" size={12} weight="Bold">{bonuses.toFixed(0)} Б</Txt>
                            </View>
                        </>
                    ) : (
                        <Icons.User color="#4FBD01" />
                    )}
                </TouchBox>
            </View>

            <View style={styles.SearchContainer} ref={searchWrapperRef}>
                {!isHideSearch && (
                    <Search
                        value={localSearch}
                        onChange={setLocalSearch}
                        onFocus={scrollToSearch}
                    />
                )}

                {localSearch.length > 0 && searchList.length > 0 && (
                    <View style={styles.SearchBox}>
                        <ScrollView style={styles.SearchBoxScroll}>
                            {searchList.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.SearchBoxItem}
                                    activeOpacity={0.5}
                                    onPress={() => {
                                        changeEnableScroll(true)
                                        setLocalSearch("")
                                        navigation.navigate('product', { id: item.id })
                                    }}
                                >
                                    <Txt weight="Bold" size={16} lines={1} lineHeight={22}>{item.name}</Txt>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
                {localSearch.length > 0 && searchList.length === 0 && (
                    <View style={[styles.SearchBox, { paddingVertical: 12 }]}> 
                        <Txt>Ничего не найдено</Txt>
                    </View>
                )}
            </View>
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    Logo: { width: 74, height: 74 },
    Header: { gap: 30, paddingHorizontal: 16, paddingBottom: 24 },
    TopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 },
    ControllBar: { flexDirection: 'row', alignItems: 'center', gap: 20, justifyContent: 'space-between' },
    Box: { width: "100%" },
    Bonus: { position: "absolute", bottom: 4, left: 4 },
    Image: { position: "absolute", top: 4 },
    SearchBox: {
        position: "absolute",
        backgroundColor: "#fff",
        width: Dimensions.get("screen").width - 30,
        left: 0,
        zIndex: 500,
        elevation: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#4FBD01",
        padding: 20,
        top: 55
    },
    SearchBoxScroll: { maxHeight: 150 },
    SearchBoxItem: { paddingBottom: 12 },
    SearchContainer: { position: "relative" }
})
