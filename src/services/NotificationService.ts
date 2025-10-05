import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  private isInitialized = false;

  constructor() {
    // Не инициализируем сразу, ждем явного вызова
  }

  initialize = () => {
    if (this.isInitialized) {
      console.log('NotificationService already initialized');
      return;
    }

    console.log('Initializing NotificationService...');
    this.configure();
    this.createDefaultChannel();
    this.isInitialized = true;
    console.log('NotificationService initialized');
  };

  configure = () => {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);

        if (notification.userInteraction) {
          console.log('Notification tapped:', notification.data);
          if (notification.data?.promoCode) {
            console.log('Promo code:', notification.data.promoCode);
          }
        }
      },

      onAction: function (notification) {
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);
      },

      onRegistrationError: function(err) {
        console.error('Registration error:', err.message, err);
      },

      permissions: {
        alert: true,
        badge: false,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: false,
    });
  };

  createDefaultChannel = () => {
    PushNotification.createChannel(
      {
        channelId: "default-channel-id",
        channelName: "Default channel",
        channelDescription: "A default channel for notifications",
        playSound: true,
        soundName: "default",
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  };

  scheduleBirthdayNotification = async (birthDate: string) => {
    try {
      if (!birthDate) return;
      
      const [day, month] = birthDate.split('.');
      if (!day || !month) return;

      const now = new Date();
      const birthdayThisYear = new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day), 10, 0, 0);
      
      if (birthdayThisYear < now) {
        birthdayThisYear.setFullYear(now.getFullYear() + 1);
      }

      PushNotification.cancelLocalNotification('2001');

      PushNotification.localNotificationSchedule({
        id: '2001',
        channelId: 'default-channel-id',
        title: '🎉 С Днём Рождения!',
        message: 'Поздравляем вас с днём рождения! Закажите что-нибудь вкусное и порадуйте себя! 🎂',
        date: birthdayThisYear,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        vibrate: true,
      });

      console.log('✅ Birthday notification scheduled for:', birthdayThisYear.toLocaleDateString());
    } catch (error) {
      console.error('❌ Failed to schedule birthday notification:', error);
    }
  };

  scheduleNoOrderReminderNotification = async () => {
    try {
      const lastOrderDate = await this.getLastOrderDate();
      const now = new Date();
      
      if (lastOrderDate) {
        const daysSinceLastOrder = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('📊 Days since last order:', daysSinceLastOrder);

        if (daysSinceLastOrder >= 7) {
          PushNotification.localNotification({
            channelId: 'default-channel-id',
            title: '🍽️ Давно не виделись!',
            message: 'Прошла уже неделя с вашего последнего заказа. Самое время заказать что-нибудь вкусное! 😊',
            playSound: true,
            soundName: 'default',
            vibrate: true,
          });
          console.log('✅ No order reminder sent (7+ days since last order)');
        } else {
          console.log('ℹ️ No reminder needed - last order was recent');
        }
      } else {
        console.log('ℹ️ No last order date found');
      }
    } catch (error) {
      console.error('❌ Failed to send no order reminder:', error);
    }
  };

  scheduleInactiveUserNotification = async (promoCode: string = 'WELCOME20') => {
    try {
      const lastActivityDate = await this.getLastActivityDate();
      const now = new Date();
      
      if (lastActivityDate) {
        const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('📊 Days since last activity:', daysSinceLastActivity);

        if (daysSinceLastActivity >= 14) {
          PushNotification.localNotification({
            channelId: 'default-channel-id',
            title: '💝 Мы скучаем по вам!',
            message: `Вы не заходили уже 2 недели! Используйте промокод ${promoCode} для скидки! 🎁`,
            playSound: true,
            soundName: 'default',
            vibrate: true,
            userInfo: { promoCode },
          });
          console.log('✅ Inactive user notification sent with promo:', promoCode);
        } else {
          console.log('ℹ️ No inactive reminder needed - user was active recently');
        }
      } else {
        console.log('ℹ️ No last activity date found');
      }
    } catch (error) {
      console.error('❌ Failed to send inactive user notification:', error);
    }
  };

  private getLastOrderDate = async (): Promise<Date | null> => {
    try {
      const lastOrderDateStr = await AsyncStorage.getItem('lastOrderDate');
      return lastOrderDateStr ? new Date(lastOrderDateStr) : null;
    } catch {
      return null;
    }
  };

  private getLastActivityDate = async (): Promise<Date | null> => {
    try {
      const lastActivityDateStr = await AsyncStorage.getItem('lastActivityDate');
      return lastActivityDateStr ? new Date(lastActivityDateStr) : null;
    } catch {
      return null;
    }
  };

  updateLastOrderDate = async () => {
    try {
      await AsyncStorage.setItem('lastOrderDate', new Date().toISOString());
      console.log('✅ Last order date updated');
    } catch (error) {
      console.error('❌ Failed to update last order date:', error);
    }
  };

  updateLastActivityDate = async () => {
    try {
      await AsyncStorage.setItem('lastActivityDate', new Date().toISOString());
    } catch (error) {
      console.error('❌ Failed to update last activity date:', error);
    }
  };

  checkAndScheduleNotifications = async () => {
    try {
      console.log('🔔 Checking and scheduling notifications...');

      const profileData = await AsyncStorage.getItem('profileData');
      if (profileData) {
        const { dateBirth } = JSON.parse(profileData);
        if (dateBirth) {
          await this.scheduleBirthdayNotification(dateBirth);
        } else {
          console.log('ℹ️ No birth date found in profile');
        }
      } else {
        console.log('ℹ️ No profile data found');
      }

      await this.scheduleNoOrderReminderNotification();
      
      const promoCode = await AsyncStorage.getItem('currentPromoCode');
      await this.scheduleInactiveUserNotification(promoCode || 'WELCOME20');
      
      console.log('✅ All notifications checked and scheduled');
    } catch (error) {
      console.error('❌ Failed to schedule notifications:', error);
    }
  };

  cancelAllNotifications = () => {
    try {
      PushNotification.cancelAllLocalNotifications();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  };

  requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const apiLevel = Platform.Version as number;
        
        if (apiLevel >= 33) {
          const has = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any
          );
          if (!has) {
            const res = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any,
              {
                title: 'Разрешение на уведомления',
                message: 'Приложению нужно разрешение, чтобы отправлять уведомления.',
                buttonPositive: 'OK',
              }
            );
            console.log('POST_NOTIFICATIONS result:', res);
          }
        }

        if (apiLevel >= 31) {
          try {
            const hasExact = await PermissionsAndroid.check(
              'android.permission.SCHEDULE_EXACT_ALARM' as any
            );
            console.log('SCHEDULE_EXACT_ALARM permission:', hasExact);
            
            if (!hasExact) {
              console.warn('No exact alarm permission - will use inexact scheduling');
            }
          } catch (error) {
            console.log('Could not check exact alarm permission:', error);
          }
        }

        return true;
      }

      const res = await PushNotification.requestPermissions(['alert', 'badge', 'sound'] as any);
      console.log('iOS notification permission result:', res);
      return res;
    } catch (err) {
      console.error('Permissions request error:', err);
      return false;
    }
  };
}

export default new NotificationService();
