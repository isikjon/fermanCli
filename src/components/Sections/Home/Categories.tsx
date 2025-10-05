import { StyleSheet, View } from 'react-native'
import React from 'react'
import Row from '../../Row'
import TouchBox from '../../TouchBox'
import { categoriesList } from '../../../constants'
import Txt from '../../../ui/Text'

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../RootLayout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Categories = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <View style={styles.Categories}>
            <Row>
                {categoriesList.slice(0, 3).map((item, index) => (
                    <TouchBox
                        padding={16}
                        height={62}
                        isFull
                        key={index}
                        onClick={() => {
                            console.log('🖱️ [Categories] CLICKED', item.name, 'at', performance.now())
                            navigation.navigate('atributes', { id: item.id })
                        }}
                    >
                        <View style={styles.Box}>
                            <item.icon />
                            <Txt>{item.name}</Txt>
                        </View>
                    </TouchBox>
                ))}
            </Row>

            <Row>
                {categoriesList.slice(3, 5).map((item, index) => (
                    <TouchBox
                        padding={16}
                        height={62}
                        isFull
                        key={index}
                        onClick={() => {
                            console.log('🖱️ [Categories] CLICKED', item.name, 'at', performance.now())
                            navigation.navigate('atributes', { id: item.id })
                        }}
                    >
                        <View style={styles.Box}>
                            <item.icon />
                            <Txt>{item.name}</Txt>
                        </View>
                    </TouchBox>
                ))}
            </Row>
        </View>
    )
}
export default Categories

const styles = StyleSheet.create({
    Categories: {
        width: '100%',
        paddingHorizontal: 20,
        marginVertical: '4%',
        gap: 16
    },
    Box: {
        alignItems: "center",
        gap: 4,
        paddingVertical: 8
    }
})
