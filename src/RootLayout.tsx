import React, { useEffect, useState } from 'react';
import {
  View,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  LogBox,
  StatusBar,
  StyleSheet
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

// Временные заглушки для компонентов (будем создавать постепенно) 
import HomeScreen from './pages/home';
import Navigation from './components/Navigation';
import WelcomeScreen from './components/WelcomeScreen';
import Profile from './pages/profile';
import Search from './pages/search';
import Favorite from './pages/favorite';
import Delivery from './pages/delivery';
import Contacts from './pages/contacts';
import Checkout from './pages/checkout';
import Cart from './pages/cart';
import Auth from './pages/auth';
import Notifications from './pages/notifications';
import CatalogScreen from './pages/catalog';
import NotFoundScreen from './pages/+not-found';
import CatalogDetails from "./pages/catalog/catalogDetails";
import Atribute from './pages/catalog/atributes/[atributeId]';
import ProductScreen from './pages/catalog/product/[productId]';
import { navigationRef } from './components/Navigation';
import { setNavigationCallback } from './store/auth';
import { List } from './components/Sections/Catalog';
import MinOrderBanner from './components/MinOrderBanner';
import useGlobalStore from './store'; 

LogBox.ignoreAllLogs();

export type RootStackParamList = {
  welcome: undefined;
  home: undefined;
  catalog: undefined;
  catalogItem: { id: string };
  atributes: { id: string };
  profile: undefined;
  search: undefined;
  favorite: undefined;
  delivery: undefined;
  contacts: undefined;
  checkout: undefined;
  cart: undefined;
  cartDetails: { id: string };
  auth: undefined;
  'not-found': undefined;
  product: { id: string };
  notifications: undefined;

};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootLayout() {
  const [currentRoute, setCurrentRoute] = useState('welcome');
  const { isAuth, isDeliverySet, isFirstLaunch } = useGlobalStore();

  useEffect(() => {
    setNavigationCallback((route: string, reset?: boolean) => {
      if (navigationRef.current?.isReady()) {
        if (reset) {
          // Полная очистка стека навигации
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: route as never }],
          });
        } else {
          navigationRef.current.navigate(route as never);
        }
      }
    });
  }, []);

  const onStateChange = (state: any) => {
    if (state) {
      const routeName = state.routes[state.index]?.name;
      setCurrentRoute(routeName);
    }
  };

  // Определяем когда показывать навигацию
  const isDeliveryRequired = isAuth && !isDeliverySet;
  const isAuthRequired = !isAuth; // Авторизация обязательна для всех неавторизованных
  const showNavigation = currentRoute !== 'welcome' && 
                         !(currentRoute === 'delivery' && isDeliveryRequired) &&
                         !(currentRoute === 'auth' && isAuthRequired);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={DefaultTheme} onStateChange={onStateChange}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="welcome">
              <Stack.Screen name="welcome" component={WelcomeScreen} />
              <Stack.Screen name="home" component={HomeScreen} />
              <Stack.Screen name="profile" component={Profile} />
                        <Stack.Screen name="search" component={Search} />
                        <Stack.Screen name="favorite" component={Favorite} />
                        <Stack.Screen name="delivery" component={Delivery} />
                        <Stack.Screen name="contacts" component={Contacts} />
                        <Stack.Screen name="checkout" component={Checkout} />
                        <Stack.Screen name="cart" component={Cart} />
                        <Stack.Screen name="auth" component={Auth} />
                        <Stack.Screen name="catalog" component={CatalogScreen} />
                        <Stack.Screen name="catalogItem" component={List} />
                        <Stack.Screen name="not-found" component={NotFoundScreen} />
                        <Stack.Screen name="atributes" component={Atribute} />
                        <Stack.Screen name="cartDetails" component={CatalogDetails} />
                        <Stack.Screen name='product' component={ProductScreen} />
                        <Stack.Screen name='notifications' component={Notifications} />
            </Stack.Navigator>
            {showNavigation && (
              <View style={styles.NavWrapper}>
                <MinOrderBanner currentRoute={currentRoute} />
                <Navigation />
              </View>
            )}
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            </KeyboardAvoidingView>
          </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default RootLayout;

const styles = StyleSheet.create({
  NavWrapper: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      zIndex: 100,
  },
});
