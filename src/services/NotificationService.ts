import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';

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
      requestPermissions: false, // Будем запрашивать вручную
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

  scheduleInactiveUserNotification = () => {
    PushNotification.localNotification({
      channelId: "default-channel-id",
      title: "Мы скучаем по вам! 😢",
      message: "Вернитесь и используйте промокод WELCOME20 для скидки 20%!",
      playSound: true,
      soundName: 'default',
      userInfo: { promoCode: 'WELCOME20' },
    });

    console.log('Test notification sent immediately');
  };

  startMinuteNotifications = () => {
    // Отменяем предыдущие с тем же ID, чтобы не плодить дубликаты
    try { PushNotification.cancelLocalNotifications({ id: '1001' as any }); } catch {}

    PushNotification.localNotificationSchedule({
      /*
        Важно: для repeatType требуется стартовая дата в будущем
      */
      id: 1001,
      channelId: 'default-channel-id',
      title: 'Напоминание',
      message: 'Это локальное уведомление раз в минуту',
      allowWhileIdle: true,
      date: new Date(Date.now() + 60 * 1000),
      repeatType: 'minute',
      playSound: true,
      soundName: 'default',
      vibrate: true,
    });

    console.log('Scheduled repeating notification every minute');
  };

  stopMinuteNotifications = () => {
    try {
      PushNotification.cancelLocalNotifications({ id: '1001' as any });
      console.log('Cancelled repeating minute notification');
    } catch (e) {
      console.log('Error cancelling minute notification', e);
    }
  };

  cancelAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };

  requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ (API 33) требует POST_NOTIFICATIONS
        const apiLevel = Platform.Version as number;
        if (apiLevel >= 33) {
          const has = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any);
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
        // На Android PushNotification.requestPermissions ничего не делает — выходим
        return true;
      }

      // iOS
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