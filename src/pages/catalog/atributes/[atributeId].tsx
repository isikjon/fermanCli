import React, { useEffect, useState } from 'react';
import { View, StatusBar, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Sections from '../../../components/Sections';
import useCatalogStore from '../../../store/catalog';
import Back from '../../../ui/Back';
import { RootStackParamList } from "../../../RootLayout";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AtributeRouteProp = RouteProp<RootStackParamList, 'atributes'>;

const Atribute: React.FC = () => {
    const route = useRoute<AtributeRouteProp>();
    const navigation = useNavigation();
    const { id } = route.params;
    const insets = useSafeAreaInsets();

    const { getDataFromAtributes } = useCatalogStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                await getDataFromAtributes(id);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id, getDataFromAtributes]);

    return (
        <View style={styles.Container}>
            <View style={[styles.BackBox, { paddingTop: Math.max(insets.top, 15) }]}>
                <Back onClick={() => navigation.goBack()} />
            </View>

        
                <Sections.Catalog.Atributes />
        
        </View>
    );
};

export default Atribute;

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    BackBox: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    Loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});