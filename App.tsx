import React, { useEffect } from 'react';
import { Appearance } from 'react-native';
import RootLayout from './src/RootLayout';
import NotificationService from './src/services/NotificationService';
import firebase from '@react-native-firebase/app';

Appearance.setColorScheme('light');

export default function App() {
    useEffect(() => {
        async function initialize() {
            try {
                if (!firebase.apps.length) {
                    await firebase.initializeApp();
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                NotificationService.initialize();
                
                await NotificationService.requestPermissions();
                
                setTimeout(() => {
                    NotificationService.startMinuteNotifications();
                }, 1000);
            } catch (error) {
            }
        }

        initialize();

        return () => {
            try {
                NotificationService.cancelAllNotifications();
            } catch (error) {
            }
        };
    }, []);

    return <RootLayout />;
}
