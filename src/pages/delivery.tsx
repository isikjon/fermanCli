import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef } from 'react';
import FullLogo from '../assets/FullLogo';
import Tabs from '../components/Tabs';
import Sections from '../components/Sections';
import useDeliveryStore from '../store/delivery';
import Back from '../ui/Back';
import { useNavigation } from '@react-navigation/native';
import useGlobalStore from '../store';
import Button from '../ui/Button';
import Txt from '../ui/Text';

const Delivery = () => {
    const navigation = useNavigation();
    const { getDelivery, deliveryData } = useDeliveryStore();
    const { setDeliverySet, isAuth, isDeliverySet } = useGlobalStore();
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        getDelivery();
    }, [getDelivery]);

    const handleContinue = () => {
        if (deliveryData) {
            setDeliverySet(true);
            navigation.navigate('home' as never);
        }
    };

    const handleBack = () => {
        if (isAuth) {
            navigation.goBack();
        } else {
            navigation.navigate('home' as never);
        }
    };

    const isDeliveryRequired = isAuth && !isDeliverySet;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // если нужен отступ под header
        >
            <ScrollView ref={scrollRef} style={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
                <View>
                    <FullLogo />
                    {!isDeliveryRequired && (
                        <View style={styles.BackBox}>
                            <Back onClick={handleBack} />
                        </View>
                    )}
                    <View style={styles.InfoBox}>
                        <Txt size={18} weight="Bold" style={styles.InfoTitle}>
                            Выберите способ получения заказа
                        </Txt>
                        <Txt size={14} color="#666" style={styles.InfoText}>
                            Укажите адрес доставки или самовывоза, чтобы видеть актуальный ассортимент, цены и остатки
                        </Txt>
                    </View>
                    <Tabs
                        activeTab={deliveryData?.type}
                        labels={['Доставка', 'Самовывоз']}
                        tabs={[<Sections.Delivery.Address scrollRef={scrollRef} />, <Sections.Delivery.SelfPickup />]}
                    />
                    {deliveryData && (
                        <View style={styles.ButtonContainer}>
                            <Button height={56} onClick={handleContinue}>
                                <Txt color="#fff" weight="Bold" size={18}>
                                    {isDeliveryRequired ? 'Продолжить' : 'Продолжить'}
                                </Txt>
                            </Button>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default Delivery;

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingBottom: 70,
    },
    BackBox: {
        padding: 15,
    },
    ButtonContainer: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    InfoBox: {
        padding: 15,
    },
    InfoTitle: {
        marginBottom: 5,
    },
    InfoText: {
        opacity: 0.7,
    },
});