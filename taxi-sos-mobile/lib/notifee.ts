// Notifee'yi dinamik olarak yüklüyoruz. Expo Go'da çökmeyi önlemek için try-catch kullanıyoruz.
let notifee: any = null;
let AndroidImportance: any = null;
try {
  const notifeeModule = require('@notifee/react-native');
  notifee = notifeeModule.default;
  AndroidImportance = notifeeModule.AndroidImportance;
} catch (e) {
  console.log("Notifee native module bulunamadı. Foreground Service Expo Go'da çalışmayacak.");
  notifee = {
    requestPermission: async () => { },
    createChannel: async () => 'mock_channel',
    displayNotification: async () => { },
    stopForegroundService: async () => { }
  };
  AndroidImportance = { HIGH: 4 };
}

export { notifee, AndroidImportance };
