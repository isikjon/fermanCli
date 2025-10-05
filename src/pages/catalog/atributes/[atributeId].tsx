import React, { useEffect, useState } from 'react';
import { View, StatusBar, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Sections from '../../../components/Sections';
import useCatalogStore from '../../../store/catalog';
import Back from '../../../ui/Back';
import { RootStackParamList } from "../../../RootLayout";

type AtributeRouteProp = RouteProp<RootStackParamList, 'atributes'>;

const Atribute: React.FC = () => {
    const route = useRoute<AtributeRouteProp>();
    const navigation = useNavigation();
    const { id } = route.params;

    const { getDataFromAtributes } = useCatalogStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const startTime = performance.now()
            console.log('📄 [Atribute Page] MOUNT', id, 'at', performance.now())
            try {
                await getDataFromAtributes(id);
                console.log('✅ [Atribute Page] LOADED in', (performance.now() - startTime).toFixed(2), 'ms')
            } catch (e) {
                console.error('❌ [Atribute Page] ERROR', e, (performance.now() - startTime).toFixed(2), 'ms');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id, getDataFromAtributes]);

    return (
        <View style={styles.Container}>
            <View style={styles.BackBox}>
                <Back onClick={() => navigation.goBack()} />
            </View>

        
                <Sections.Catalog.Atributes />
        
        </View>
    );
};

export default Atribute;

const styles = StyleSheet.create({
    Container: {
        paddingTop: StatusBar.currentHeight,
        flex: 1,
        backgroundColor: '#fff',
    },
    BackBox: {
        padding: 15,
    },
    Loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});