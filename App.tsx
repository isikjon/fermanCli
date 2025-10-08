/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootLayout from './src/RootLayout';
import NotificationService from './src/services/NotificationService';
import { getApps } from '@react-native-firebase/app';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ImageCacheManager } from './src/utils/imageCacheManager';

export default function App() {
    console.log('App rendered');

    useEffect(() => {
        async function initialize() {
            try {
                console.log('Starting app initialization...');
                
                const apps = getApps();
                if (apps.length === 0) {
                    console.log('Firebase already initialized via google-services.json');
                } else {
                    console.log('Firebase already initialized');
                }
                
                console.log('Initializing NotificationService...');
                NotificationService.initialize();
                
                console.log('Requesting notification permissions...');
                await NotificationService.requestPermissions();
                console.log('Permissions requested');
                
                setTimeout(() => {
                    console.log('Checking and scheduling notifications...');
                    NotificationService.checkAndScheduleNotifications();
                    NotificationService.updateLastActivityDate();
                }, 2000);
                
                setTimeout(async () => {
                    console.log('🧹 Starting automatic cache cleanup...');
                    await ImageCacheManager.autoCleanup();
                    console.log('✅ Cache cleanup completed');
                }, 5000);
                
                console.log('App initialized successfully');
                
            } catch (error) {
                console.error('❌ Initialization error:', error);
                console.error('❌ Error stack:', error.stack);
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

    return (
        <ErrorBoundary>
            <RootLayout />
        </ErrorBoundary>
    );
}