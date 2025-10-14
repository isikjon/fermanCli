import React, { useEffect } from 'react';
import RootLayout from './src/RootLayout';
import NotificationService from './src/services/NotificationService';
import firebase from '@react-native-firebase/app';

export default function App() {
    console.log('App rendered');

    useEffect(() => {
        async function initialize() {
            try {
                console.log('Starting app initialization...');
                
                if (!firebase.apps.length) {
                    console.log('Initializing Firebase...');
                    await firebase.initializeApp();
                    console.log('Firebase initialized successfully');
                } else {
                    console.log('Firebase already initialized');
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log('Initializing NotificationService...');
                NotificationService.initialize();
                
                console.log('Requesting notification permissions...');
                await NotificationService.requestPermissions();
                console.log('Permissions requested');
                
                setTimeout(() => {
                    console.log('Starting minute notifications...');
                    NotificationService.startMinuteNotifications();
                }, 1000);
                
                console.log('App initialized successfully');
            } catch (error) {
                console.error('Initialization error:', error);
                console.error('Error stack:', error.stack);
            }
        }

        initialize();

        return () => {
            try {
                NotificationService.cancelAllNotifications();
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        };
    }, []);

    return <RootLayout />;
}
