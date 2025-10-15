import React, { FC, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import Txt from './Text';

interface Props {
    onChange: (value: string) => void
    value: string
}

const CodeInput: FC<Props> = ({ onChange, value }) => {
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value, setValue: onChange });
    const ref = useBlurOnFulfill({ value, cellCount: 4 });

    // Автоматическая обработка SMS кода на iOS
    useEffect(() => {
        if (Platform.OS === 'ios' && value.length === 4) {
            // Код автоматически заполнился, можно выполнить дополнительные действия
            console.log('SMS код автоматически заполнен:', value);
        }
    }, [value]);

    return (
        <View style={styles.root}>
            <Txt size={20}>Введите код из СМС</Txt>
            <CodeField
                ref={ref}
                {...props}
                value={value}
                onChangeText={onChange}
                cellCount={4}
                rootStyle={styles.codeFieldRoot}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                autoFocus={Platform.OS === 'android'}
                importantForAutofill={Platform.OS === 'android' ? 'yes' : 'no'}
                renderCell={({ index, symbol, isFocused }) => (
                    <View
                        key={index}
                        style={[styles.cell, isFocused && styles.focusCell]}
                        onLayout={getCellOnLayoutHandler(index)}
                    >
                        <Text style={styles.cellText}>
                            {symbol || (isFocused ? <Cursor /> : null)}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

export default CodeInput

const styles = StyleSheet.create({
    root: { alignItems: "center", gap: 20, paddingVertical: 20 },
    title: { textAlign: 'center', fontSize: 20, marginBottom: 20 },
    codeFieldRoot: { justifyContent: 'center' },
    cell: {
        width: 50,
        height: 60,
        lineHeight: 58,
        fontSize: 24,
        borderWidth: 2,
        borderColor: '#ccc',
        textAlign: 'center',
        marginHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12
    },
    cellText: {
        fontSize: 24,
        fontFamily: "Bold",
        color: "#4D4D4D"
    },
    focusCell: {
        borderColor: '#4FBD01',
    },
});
