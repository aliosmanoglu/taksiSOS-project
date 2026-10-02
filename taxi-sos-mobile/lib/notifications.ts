import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// --- Hata Gizleme (Expo Go expo-notifications hatası için) ---
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('expo-notifications')) {
    return;
  }
  originalConsoleError(...args);
};

export const Notifications = require('expo-notifications');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Push bildirimleri için izin verilmedi!');
      return null;
    }
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } else {
    console.log('Push bildirimleri fiziksel bir cihazda çalışır.');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
