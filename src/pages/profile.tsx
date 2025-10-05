import { ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import React from 'react'
import FullLogo from '../assets/FullLogo'
import Txt from '../ui/Text'
import Tabs from '../components/Tabs'
import Sections from '../components/Sections'
import { Bonuses } from '../components/Sections/Profile'
import Back from '../ui/Back'
import {useNavigation} from "@react-navigation/native";

const profile = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.Container}>
     <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
                <View>
                    <FullLogo />

                    <View style={styles.Box}>
                        <View style={styles.TextBox}>
                            <Back onClick={() => navigation.goBack()} />
                            <Txt size={40} weight='Jingleberry'>ЛИЧНЫЙ КАБИНЕТ</Txt>
                        </View>

                        <Bonuses />

                        <Tabs
                            labels={["Мой профиль", "История"]}
                            tabs={[<Sections.Profile.PersonalData />, <Sections.Profile.History />]}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

export default profile

const styles = StyleSheet.create({
    Container: {
        paddingTop: StatusBar.currentHeight,
        flex: 1,
        backgroundColor: "#fff",
        paddingBottom: 70
    },
    Box: {
        gap: 30
    },
    TextBox: {
        paddingHorizontal: 16
    }
})
