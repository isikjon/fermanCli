/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootLayout from './src/RootLayout';
import NotificationService from './src/services/NotificationService';
import firebase from '@react-native-firebase/app';

export default function App() {
    console.log('App rendered');

    useEffect(() => {
        async function initialize() {
            try {
                console.log('Starting app initialization...');
                
                // Initialize Firebase first
                if (!firebase.apps.length) {
                    console.log('Initializing Firebase...');
                    await firebase.initializeApp();
                    console.log('Firebase initialized successfully');
                } else {
                    console.log('Firebase already initialized');
                }
                
                // Wait for Firebase to be fully ready
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Initialize NotificationService after Firebase
                console.log('Initializing NotificationService...');
                NotificationService.initialize();
                
                // Request notification permissions
                console.log('Requesting notification permissions...');
                await NotificationService.requestPermissions();
                console.log('Permissions requested');
                
                // Start repeating every minute after permissions
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

        // Cleanup function
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
