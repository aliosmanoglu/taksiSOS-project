import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Animated, ScrollView, Dimensions, Modal, FlatList, KeyboardAvoidingView, Platform, LogBox, Image, ActivityIndicator } from 'react-native';

// --- Hata ve Uyarı Gizleme ---
LogBox.ignoreLogs([
  '[expo-av]', // expo-av deprecation uyarısını gizle
  'Unable to activate keep awake', // Android'de gereksiz keep-awake hatasını gizle
]);

import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// --- Hata Gizleme (Expo Go expo-notifications hatası için) ---
// Expo Go'da push notification desteklenmediği için çıkan kırmızı ekran hatasını gizler.
// Lokal bildirimler çalışmaya devam eder.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('expo-notifications')) {
    return;
  }
  originalConsoleError(...args);
};
// --------------------------------------------------------------

const Notifications = require('expo-notifications');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width, height } = Dimensions.get('window');

type SosNotification = {
  from: string;
  distance: number;
  roomName: string;
  lat: number;
  lon: number;
};

type ChatMessage = {
  id: string;
  type: 'text' | 'audio';
  content: string;
  senderName: string;
  senderId: string;
  timestamp: number;
  duration?: number;
};

const SERVER_URL = 'http://172.2.2.172:5000';

async function registerForPushNotificationsAsync() {
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

export default function App() {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data.roomName &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const roomName = lastNotificationResponse.notification.request.content.data.roomName;
      setActiveSOSRoom(roomName);
      setPageMode('room');
    }
  }, [lastNotificationResponse]);
  const splashLogoTranslateY = useRef(new Animated.Value(Dimensions.get('window').height / 4)).current;
  const splashLogoScale = useRef(new Animated.Value(2)).current;
  const splashFormOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Uygulama açılış animasyonu: Kendi özel splash ekranımız
    SplashScreen.preventAutoHideAsync().catch(() => {});
    
    setTimeout(() => {
      // Orijinal splash'i gizle ve pürüzsüz animasyonu başlat
      SplashScreen.hideAsync().catch(() => {});
      
      Animated.parallel([
        Animated.timing(splashLogoTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(splashLogoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(splashFormOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        })
      ]).start();
    }, 1500); // Siyah ekranda logoyu 1.5 saniye tut
  }, []);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [phone, setPhone] = useState("");
  const [serverIp, setServerIp] = useState("https://taksisos-project.onrender.com");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAutoLoginTriggered, setIsAutoLoginTriggered] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // State Management for UI
  const [pageMode, setPageMode] = useState<'home' | 'room'>('home');
  const [sosNotifications, setSosNotifications] = useState<SosNotification[]>([]);

  const [sosActive, setSosActive] = useState(false); // Ben SOS verdim mi?
  const [activeSOSRoom, setActiveSOSRoom] = useState<string | null>(null); // Hangi odadayım?

  useEffect(() => {
    if (activeSOSRoom) {
      AsyncStorage.setItem('activeSOSRoom', activeSOSRoom).catch(() => {});
    } else {
      AsyncStorage.removeItem('activeSOSRoom').catch(() => {});
    }
  }, [activeSOSRoom]);
  const [roomUsers, setRoomUsers] = useState<any[]>([]); // Haritada göstermek için diğer kişilerin konumu.
  const [followMode, setFollowMode] = useState<'none' | 'me' | 'sos'>('none'); // Harita kimi takip edecek?

  const [logs, setLogs] = useState<{ id: string, msg: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [incomingSpeaker, setIncomingSpeaker] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [recordingUI, setRecordingUI] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [inputText, setInputText] = useState("");

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [id: string]: number }>({});
  const historySoundRef = useRef<Audio.Sound | null>(null);

  const formatDuration = (millis?: number) => {
    if (!millis) return "0:00";
    let totalSeconds = Math.round(millis / 1000);
    if (totalSeconds < 1) totalSeconds = 1; // En az 1 saniye göster
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderWaveform = (msgId: string, progress: number = 0) => {
    const bars = [];
    const totalBars = 20;
    for (let i = 0; i < totalBars; i++) {
      const isPlayed = (i / totalBars) <= progress;
      bars.push(<View key={i} style={{ width: 3, height: 24, backgroundColor: isPlayed ? '#ff3b30' : 'rgba(255,255,255,0.2)', marginHorizontal: 1, borderRadius: 2 }} />);
    }
    return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{bars}</View>;
  };

  const focusOnSOS = () => {
    setFollowMode('sos');
    if (!mapRef.current || !activeSOSRoom) return;

    if (socket && activeSOSRoom === "sos_room_" + phone) {
      mapRef.current.animateToRegion({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
      return;
    }

    const creatorUser = roomUsers.find(u => "sos_room_" + u.phone === activeSOSRoom);
    if (creatorUser) {
      mapRef.current.animateToRegion({
        latitude: creatorUser.lat,
        longitude: creatorUser.lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    } else if (sosNotifications.length > 0) {
      mapRef.current.animateToRegion({
        latitude: sosNotifications[0].lat,
        longitude: sosNotifications[0].lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  };

  const focusOnMe = () => {
    setFollowMode('me');
    if (!mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    }, 1000);
  };

  // --- HARİTA TAKİP SİSTEMİ (FOLLOW MODE) ---
  useEffect(() => {
    if (!mapRef.current || followMode === 'none') return;

    if (followMode === 'me') {
      mapRef.current.animateToRegion({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 500);
    } else if (followMode === 'sos' && activeSOSRoom) {
      if (socket && activeSOSRoom === "sos_room_" + phone) {
        mapRef.current.animateToRegion({
          latitude: mapRegion.latitude,
          longitude: mapRegion.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }, 500);
      } else {
        const creatorUser = roomUsers.find(u => "sos_room_" + u.phone === activeSOSRoom);
        if (creatorUser) {
          mapRef.current.animateToRegion({
            latitude: creatorUser.lat,
            longitude: creatorUser.lon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          }, 500);
        }
      }
    }
  }, [mapRegion.latitude, mapRegion.longitude, roomUsers, followMode, activeSOSRoom]);


  const stopHistoryAudio = async () => {
    if (historySoundRef.current) {
      await historySoundRef.current.stopAsync();
      await historySoundRef.current.unloadAsync();
      historySoundRef.current = null;
    }
    setPlayingAudioId(null);
  };

  const playHistorySequence = async (startIndex: number) => {
    if (startIndex >= chatMessages.length) {
      setPlayingAudioId(null);
      return;
    }
    const msg = chatMessages[startIndex];
    if (msg.type !== 'audio') {
      playHistorySequence(startIndex + 1);
      return;
    }

    await stopHistoryAudio();
    setPlayingAudioId(msg.id);

    try {
      const fileUri = FileSystem.documentDirectory + `history_voice_${Date.now()}.m4a`;
      const pureBase64 = msg.content.includes('base64,') ? msg.content.split('base64,')[1] : msg.content;
      await FileSystem.writeAsStringAsync(fileUri, pureBase64, { encoding: FileSystem.EncodingType.Base64 });

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );
      historySoundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          const progress = status.durationMillis ? status.positionMillis / status.durationMillis : 0;
          setPlaybackProgress(prev => ({ ...prev, [msg.id]: progress }));
          if (status.didJustFinish) {
            playHistorySequence(startIndex + 1);
          }
        }
      });
    } catch (err) {
      console.log("Geçmiş ses çalınamadı", err);
      playHistorySequence(startIndex + 1);
    }
  };

  const handlePlayPause = (msgId: string) => {
    if (playingAudioId === msgId) {
      stopHistoryAudio();
    } else {
      // Güncel chatMessages referansı useEffect dışında da geçerlidir fakat closure olabilir.
      // En garantisi index bulup başlatmak
      const index = chatMessages.findIndex(m => m.id === msgId);
      if (index !== -1) {
        playHistorySequence(index);
      }
    }
  };

  const sendTextMessage = () => {
    if (!inputText.trim() || !socket || !activeSOSRoom) return;
    socket.emit('text_message', { room: activeSOSRoom, text: inputText.trim() });
    setInputText("");
  };

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const storedData = await AsyncStorage.getItem('user_credentials');
        if (storedData) {
          const data = JSON.parse(storedData);
          const storedRoom = await AsyncStorage.getItem('activeSOSRoom');
          if (storedRoom) {
            setActiveSOSRoom(storedRoom);
            setPageMode('room');
            if (storedRoom === "sos_room_" + data.phone) {
              setSosActive(true);
            }
          }
          if (data.name) setName(data.name);
          if (data.plate) setPlate(data.plate);
          if (data.phone) setPhone(data.phone);
        } else {
          // Eski FileSystem verisi varsa AsyncStorage'a taşı
          const credentialsPath = FileSystem.documentDirectory + 'user_credentials.json';
          const fileInfo = await FileSystem.getInfoAsync(credentialsPath);
          if (fileInfo.exists) {
            const content = await FileSystem.readAsStringAsync(credentialsPath);
            const data = JSON.parse(content);
            if (data.name) setName(data.name);
            if (data.plate) setPlate(data.plate);
            if (data.phone) setPhone(data.phone);
            await AsyncStorage.setItem('user_credentials', content);
          }
        }
      } catch (err) {
        console.log("Kimlik bilgileri yüklenirken hata oluştu:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    loadCredentials();
  }, []);

  useEffect(() => {
    if (sosActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [sosActive]);

  // --- GERÇEK CANLI KONUM TAKİBİ ---
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startWatchingLocation = async () => {
      if (isConnected && socket) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
             return;
          }

          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (location) => {
              const currentLat = location.coords.latitude;
              const currentLon = location.coords.longitude;

              setMapRegion(prev => ({
                ...prev,
                latitude: currentLat,
                longitude: currentLon,
              }));

              socket.emit('live_location', {
                id: socket.id,
                lat: currentLat,
                lon: currentLon,
              });
            }
          );
        } catch (err) {
          console.log("Konum takibi başlatılamadı:", err);
        }
      }
    };

    startWatchingLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isConnected, socket]);

  const handleConnect = async () => {
    if (!name || !plate || !phone) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]{3,}$/;
    if (!nameRegex.test(name.trim())) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir isim soyisim giriniz (Sadece harfler ve en az 3 karakter).');
      return;
    }

    const phoneRegex = /^(05|5)[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir telefon numarası giriniz (Örn: 05xx veya 5xx ile başlayan 10-11 haneli numara).');
      return;
    }

    const plateClean = plate.replace(/\s/g, '');
    const plateRegex = /^34T[A-Z0-9]{2,6}$/i;
    if (!plateRegex.test(plateClean)) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir İstanbul Taksi plakası giriniz (Plaka 34 T ile başlamalıdır).');
      return;
    }

    const ipRegex = /^https?:\/\/.+/;
    if (!ipRegex.test(serverIp.trim())) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir sunucu adresi giriniz (http:// veya https:// ile başlamalı).');
      return;
    }

    setIsConnecting(true);

    // İzinleri ve konum bilgisini al:
    let currentLat = 41.0082; // varsayılan fallback
    let currentLon = 28.9784;

    // --- GERÇEK İZİN VE KONUM ALMA KODU ---
    try {
      // 1. Konum izinlerini iste
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      
      // 2. Ses kayıt izinlerini iste
      await Audio.requestPermissionsAsync();

      if (locStatus === 'granted') {
        // Web'de hasServicesEnabledAsync desteklenmeyebilir veya sorunlu olabilir, bu yüzden web için true sayıyoruz
        const servicesEnabled = Platform.OS === 'web' ? true : await Location.hasServicesEnabledAsync();
        if (servicesEnabled) {
          try {
            let currentLoc = null;
            // Web'de getLastKnownPositionAsync her zaman çalışmayabilir, doğrudan getCurrentPosition kullanmak daha güvenlidir
            if (Platform.OS !== 'web') {
              currentLoc = await Location.getLastKnownPositionAsync({});
            }

            if (currentLoc) {
              currentLat = currentLoc.coords.latitude;
              currentLon = currentLoc.coords.longitude;
            } else {
              // Web tarayıcılarında ilk konumun bulunması (özellikle Wi-Fi ile) 10-15 saniye sürebilir, timeout uzatıldı
              currentLoc = await Promise.race([
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
              ]) as Location.LocationObject | null;

              if (currentLoc) {
                currentLat = currentLoc.coords.latitude;
                currentLon = currentLoc.coords.longitude;
              }
            }
          } catch (err) {
            console.log("Konum bilgisine erişilirken hata oluştu, varsayılan konum kullanılacak:", err);
          }
        } else {
          Alert.alert(
            "Konum Servisleri Kapalı",
            "Cihazınızın GPS/konum servisi kapalı. Uygulama varsayılan konum (İstanbul) ile açılacaktır. Lütfen ayarlardan konumu açın."
          );
        }
      } else {
        Alert.alert(
          "Konum İzni Reddedildi",
          "Uygulamanın çalışması için konum izni gereklidir. Varsayılan konum (İstanbul) kullanılacaktır."
        );
      }
    } catch (e) {
      console.log("Konum izin veya veri hatası:", e);
    }
    // ---------------------------------------------

    setMapRegion({
      ...mapRegion,
      latitude: currentLat,
      longitude: currentLon
    });

    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(serverIp);
    let hasConnected = false;

    newSocket.on('connect', async () => {
      hasConnected = true;
      setIsConnected(true);
      setIsConnecting(false);
      
      let pushToken = await registerForPushNotificationsAsync();
      
      newSocket.emit('connect_sos', {
        name: name,
        plate: plate,
        phone: phone,
        lat: currentLat,
        lon: currentLon,
        pushToken: pushToken
      });

      AsyncStorage.getItem('activeSOSRoom').then(storedRoom => {
        if (storedRoom) {
           newSocket.emit('join_sos_room', storedRoom);
        }
      }).catch(()=>{});
      addLog(`✅ Bağlanıldı: ${name}`);

      // Kimlik bilgilerini yerel olarak kaydet
      try {
        await AsyncStorage.setItem('user_credentials', JSON.stringify({ name, plate, phone, serverIp }));
      } catch (err) {
        console.log("Kimlik bilgileri kaydedilemedi:", err);
      }
    });

    newSocket.on('all_users_update', (usersData: any[]) => {
      setRoomUsers(usersData);
    });

    newSocket.on('sos_alert', async (data: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setSosNotifications(prev => {
        if (prev.find(n => n.roomName === data.roomName)) return prev;
        return [...prev, {
          from: data.from,
          distance: data.distance,
          roomName: data.roomName,
          lat: data.lat,
          lon: data.lon
        }];
      });
      addLog(`🚨 ACİL DURUM: ${data.from} (${data.distance.toFixed(2)} km)`);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 ACİL YARDIM ÇAĞRISI!",
          body: `${data.from} isimli kullanıcıdan bir SOS çağrısı aldınız (${data.distance.toFixed(2)} km)`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          autoDismiss: false,
        },
        trigger: null,
      });
    });

    newSocket.on('connect_error', (error: any) => {
      console.log("Socket.io Bağlantı Hatası:", error);

      // Eğer ilk defa bağlanmaya çalışıp hata aldıysa, döngüyü durdur ve uyarı ver.
      if (!hasConnected) {
        Alert.alert("Bağlantı Hatası", `Sunucuya bağlanılamadı. Lütfen IP adresinin doğru olduğundan ve telefonunuzun bilgisayarla aynı Wi-Fi ağına bağlı olduğundan emin olun.`);
        setIsConnecting(false);
        newSocket.disconnect();
      }
    });

    newSocket.on('play_voice', async (payload: any) => {
      try {
        const dataUrl = typeof payload === 'string' ? payload : payload.audio;
        const speakerName = (typeof payload === 'object' && payload.senderName) ? payload.senderName : "BİRİSİ";

        setIncomingSpeaker(speakerName);

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false
        });

        const base64Data = dataUrl.includes('base64,') ? dataUrl.split('base64,')[1] : dataUrl;
        const fileUri = FileSystem.documentDirectory + `incoming_voice_${Date.now()}.m4a`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });

        const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIncomingSpeaker(null);
            await sound.unloadAsync();
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
          }
        });
        await sound.playAsync();
      } catch (e) {
        setIncomingSpeaker(null);
        console.log("Ses çalınamadı:", e);
      }
    });

    newSocket.on('chat_message', async (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
      if (msg.senderId !== newSocket.id) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "💬 Yeni Mesaj",
            body: `${msg.senderName}: ${msg.type === 'audio' ? '🎤 Sesli Mesaj' : msg.content}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null,
        });
      }
    });

    newSocket.on('sos_ended', (data: any) => {
      const endedRoom = data?.room;
      if (endedRoom) {
        setSosNotifications(prev => prev.filter(n => n.roomName !== endedRoom));
      }
      setActiveSOSRoom(prevRoom => {
        if (prevRoom === endedRoom) {
          setSosActive(false);
          setPageMode('home');
          setChatMessages([]);
          setShowChat(false);
          Alert.alert("Bilgi", "SOS Çağrısı sonlandırıldı.");
          return null;
        }
        return prevRoom;
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      addLog("❌ Bağlantı koptu.");
    });

    setSocket(newSocket);
  };

  useEffect(() => {
    // Kayıtlı bilgiler yüklendiğinde otomatik giriş yap
    if (name && plate && phone && !isAutoLoginTriggered && !isConnected && !isConnecting) {
      setIsAutoLoginTriggered(true);
      handleConnect();
    }
  }, [name, plate, phone, isConnected, isConnecting, isAutoLoginTriggered]);

  const handleUpdateProfile = async () => {
    if (!name || !plate || !phone) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }
    const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]{3,}$/;
    if (!nameRegex.test(name.trim())) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir isim soyisim giriniz.');
      return;
    }
    const phoneRegex = /^(05|5)[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir telefon numarası giriniz.');
      return;
    }
    const plateClean = plate.replace(/\s/g, '');
    const plateRegex = /^34T[A-Z0-9]{2,6}$/i;
    if (!plateRegex.test(plateClean)) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir İstanbul Taksi plakası giriniz.');
      return;
    }

    try {
      await AsyncStorage.setItem('user_credentials', JSON.stringify({ name, plate, phone, serverIp }));
    } catch (err) {}

    if (socket) {
      socket.emit('update_profile', { name, plate, phone });
    }
    setShowProfileModal(false);
    Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
  };

  const handleSOS = () => {
    if (!socket) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    socket.emit('sos_trigger');
    setSosActive(true);
    const room = "sos_room_" + phone;
    setActiveSOSRoom(room);
    setPageMode('room'); // Odaya otomatik geçiş
    addLog("🚨 SOS OLUŞTURULDU!");
  };

  const joinSOSRoom = (roomName: string, fromName: string) => {
    if (!socket) return;
    socket.emit('join_sos_room', roomName);
    setActiveSOSRoom(roomName);
    setPageMode('room'); // Odaya geç
    addLog(`📞 Odaya Katıldınız: ${fromName}`);
  };

  const leaveRoom = () => {
    if (socket && activeSOSRoom) {
      socket.emit('leave_sos_room', activeSOSRoom);
    }
    setSosActive(false);
    setActiveSOSRoom(null);
    setPageMode('home');
    addLog("ℹ️ Odadan Ayrıldınız.");
  };

  const addLog = (msg: string) => {
    setLogs(prev => [{ id: Math.random().toString(), msg }, ...prev].slice(0, 3));
  };

  const startRecording = async () => {
    try {
      if (recordingRef.current) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.log("Kayıt başlatılamadı", err);
    }
  };

  const stopRecording = async () => {
    try {
      const currentRecording = recordingRef.current;
      if (!currentRecording) return;

      setIsRecording(false);
      recordingRef.current = null;

      try {
        const status = await currentRecording.stopAndUnloadAsync();
        const duration = status.durationMillis;
        const uri = currentRecording.getURI();

        if (uri && socket && activeSOSRoom) {
          const base64String = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          socket.emit('voice_message', { room: activeSOSRoom, audio: base64String, duration: duration });
          addLog("🎙️ Ses gönderildi.");
        }
      } catch (err) {
        console.log("Dosya okuma hatası:", err);
      }
    } catch (err) {
      console.log("Kayıt durdurulamadı", err);
    }
  };

  // --- RENDERING VIEWS ---

  if (!isConnected) {
    if (isCheckingAuth || (isConnecting && isAutoLoginTriggered)) {
      return (
        <KeyboardAvoidingView 
          style={[styles.container, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }]} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.loginOverlay, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }]}>
            <Animated.Image 
              source={require('../assets/images/logo.png')} 
              style={{ 
                width: 120, 
                height: 120, 
                alignSelf: 'center', 
                borderRadius: 25,
                transform: [
                  { translateY: splashLogoTranslateY },
                  { scale: splashLogoScale }
                ]
              }} 
            />
            <Animated.View style={{ opacity: splashFormOpacity, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 30 }} />
              <Text style={{ color: '#fff', marginTop: 15, fontSize: 16 }}>Bağlanıyor...</Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      );
    }

    return (
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: '#000000' }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled" style={{ width: '100%' }}>
          <View style={[styles.loginOverlay, { backgroundColor: '#000000' }]}>
            <View style={[styles.loginBox, { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]}>
            <Animated.Image 
              source={require('../assets/images/logo.png')} 
              style={{ 
                width: 120, 
                height: 120, 
                alignSelf: 'center', 
                marginBottom: 15, 
                borderRadius: 25,
                transform: [
                  { translateY: splashLogoTranslateY },
                  { scale: splashLogoScale }
                ]
              }} 
            />
            
            <Animated.View style={{ opacity: splashFormOpacity }}>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="İsim Soyisim" placeholderTextColor="#999" />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telefon Numarası" keyboardType="phone-pad" placeholderTextColor="#999" />
              <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="Plaka (örn: 34XYZ99)" autoCapitalize="characters" placeholderTextColor="#999" />

              <TouchableOpacity 
                style={[styles.connectButton, isConnecting && { opacity: 0.7 }]} 
                onPress={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.connectButtonText}>Giriş Yap</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (pageMode === 'room') {
    // Görünüm 2: SOS Odası (Telsiz ve Oda Haritası)
    return (
      <View style={styles.roomContainer}>
        <View style={styles.roomHeader}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setPageMode('home')}>
            <Text style={styles.headerButtonText}>⬅ Ana Sayfa</Text>
          </TouchableOpacity>
          <Text style={styles.roomTitle}>ACİL DURUM ODASI</Text>
          {socket && activeSOSRoom === "sos_room_" + phone ? (
            <TouchableOpacity style={styles.headerButtonRed} onPress={() => {
              Alert.alert(
                "Emin misiniz?",
                "SOS çağrısını bitirmek istediğinize emin misiniz? Bu işlem odayı herkes için kapatacaktır.",
                [
                  { text: "İptal", style: "cancel" },
                  { text: "Evet, Bitir", style: "destructive", onPress: () => socket.emit('end_sos', activeSOSRoom) }
                ]
              );
            }}>
              <Text style={styles.headerButtonText}>SOS BİTİR</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.headerButtonRed} onPress={leaveRoom}>
              <Text style={styles.headerButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.roomMapBox}>
          <MapView
            ref={mapRef}
            userInterfaceStyle="dark"
            key={`map-room-${activeSOSRoom}`}
            style={styles.map}
            onPanDrag={() => setFollowMode('none')}
            initialRegion={{
              latitude: sosNotifications.length > 0 ? sosNotifications[0].lat : mapRegion.latitude,
              longitude: sosNotifications.length > 0 ? sosNotifications[0].lon : mapRegion.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {socket && activeSOSRoom === "sos_room_" + phone ? (
              <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} title="Siz (SOS)">
                <View style={styles.sosMarkerContainer}>
                  <View style={styles.sosBadge}>
                    <Text style={styles.sosBadgeText}>SOS</Text>
                  </View>
                  <Text style={styles.carIcon}>🚗</Text>
                </View>
              </Marker>
            ) : (
              <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} title="Siz">
                <View style={styles.taxiMarker}>
                  <Text style={{ fontSize: 26 }}>🚕</Text>
                </View>
              </Marker>
            )}
            {roomUsers.map(u => {
              if (socket && u.id === socket.id) return null;

              if (activeSOSRoom && u.activeRoom !== activeSOSRoom) return null;

              const isCreator = activeSOSRoom === "sos_room_" + u.phone;

              if (isCreator) {
                return (
                  <Marker
                    key={u.id}
                    coordinate={{ latitude: u.lat, longitude: u.lon }}
                    title={u.name + " (SOS)"}
                  >
                    <View style={styles.sosMarkerContainer}>
                      <View style={styles.sosBadge}>
                        <Text style={styles.sosBadgeText}>SOS</Text>
                      </View>
                      <Text style={styles.carIcon}>🚗</Text>
                    </View>
                  </Marker>
                );
              }

              return (
                <Marker
                  key={u.id}
                  coordinate={{ latitude: u.lat, longitude: u.lon }}
                  title={u.name}
                >
                  <View style={styles.taxiMarker}>
                    <Text style={{ fontSize: 26 }}>🚕</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>

          <TouchableOpacity style={[styles.focusButton, { bottom: 20, left: 20 }]} onPress={() => setShowChat(true)}>
            <Text style={styles.focusButtonText}>💬 Sohbet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.focusButton, { bottom: 20, right: 20, width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center', alignItems: 'center', borderRadius: 22 }]} onPress={focusOnMe}>
            <MaterialIcons name="my-location" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.focusButton, { top: 20, right: 20 }]} onPress={focusOnSOS}>
            <Text style={styles.focusButtonText}>📍 SOS'a Odaklan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pttBox}>
          {incomingSpeaker ? (
            <View style={[styles.pttButton, { backgroundColor: '#28a745' }]}>
              <Text style={styles.pttButtonText}>🔊 {incomingSpeaker.toUpperCase()} KONUŞUYOR...</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 5 }}>(Konuşmak için basılı tutun)</Text>
            </View>
          ) : (
            <>
              <Text style={styles.pttStatusText}>🔴 Telsiz Bağlantısı Aktif</Text>
              <TouchableOpacity
                style={[styles.pttButton, { width: 120, height: 120, borderRadius: 60, alignSelf: 'center' }, isRecording && styles.pttButtonRecording]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                activeOpacity={0.9}
              >
                <MaterialIcons name={isRecording ? "settings-voice" : "mic"} size={64} color="white" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* SOHBET MODALI */}
        <Modal visible={showChat} animationType="slide" transparent={true}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.chatModalContainer}>
            <View style={styles.chatBox}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatHeaderTitle}>Acil Durum Sohbeti</Text>
                <TouchableOpacity onPress={() => setShowChat(false)}>
                  <Text style={styles.chatCloseText}>Kapat</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={chatMessages}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 10 }}
                renderItem={({ item }) => {
                  const isMe = socket && item.senderId === socket.id;
                  return (
                    <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}>
                      <Text style={styles.chatSenderName}>{item.senderName}</Text>
                      {item.type === 'text' ? (
                        <Text style={styles.chatContent}>{item.content}</Text>
                      ) : (
                        <View style={styles.audioMessageContainer}>
                          <View style={styles.audioMessageRow}>
                            <View style={styles.waveformBox}>
                              {renderWaveform(item.id, playbackProgress[item.id] || 0)}
                            </View>
                            <TouchableOpacity style={[styles.chatPlayIconBtn, { marginLeft: 10, marginRight: 0 }]} onPress={() => handlePlayPause(item.id)}>
                              <Text style={{ fontSize: 24 }}>{playingAudioId === item.id ? '⏹️' : '▶️'}</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.audioDurationText}>{formatDuration(item.duration)}</Text>
                        </View>
                      )}
                    </View>
                  );
                }}
              />
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Mesaj yaz..."
                  value={inputText}
                  onChangeText={setInputText}
                />
                <TouchableOpacity style={styles.chatSendButton} onPress={sendTextMessage}>
                  <Text style={styles.chatSendText}>Gönder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // Görünüm 1: Ana Ekran (Home)
  return (
    <View style={styles.container}>

      {/* Üst Kısım Bilgi Paneli */}
      <View style={{ position: 'absolute', top: 40, left: 20, zIndex: 100 }}>
        <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: 'bold' }}>👤 {name}</Text>
          {plate ? <Text style={{ color: '#fff', fontSize: 11, marginTop: 2 }}>🎫 Plaka: {plate}</Text> : null}
        </View>
      </View>

      {/* Bağlantıyı Kes Butonu */}
      <View style={{ position: 'absolute', top: 40, right: 20, zIndex: 100 }}>
        <TouchableOpacity
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8 }}
          onPress={async () => {
            if (socket) socket.disconnect();
            setIsConnected(false);
            try {
              const credentialsPath = FileSystem.documentDirectory + 'user_credentials.json';
              await FileSystem.deleteAsync(credentialsPath, { idempotent: true });
              setName("");
              setPlate("");
              setPhone("");
              setIsAutoLoginTriggered(false);
            } catch(e) {}
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* Üstteki SOS Alert Banner */}
      {sosNotifications.map((notification, index) => (
        <View key={notification.roomName} style={[styles.topBanner, { top: 100 + (index * 90) }]}>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>🚨 ACİL YARDIM ÇAĞRISI!</Text>
            <Text style={styles.bannerSubtitle}>{notification.from} ({notification.distance.toFixed(2)} km)</Text>
          </View>
          <TouchableOpacity style={styles.joinButton} onPress={() => joinSOSRoom(notification.roomName, notification.from)}>
            <Text style={styles.joinButtonText}>Katıl</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Ana Ekran Ortalanmış Harita (Gizlendi) - Tamamen Silindi */}

      {/* Ortalanmış SOS Butonu */}
      <View style={styles.homeSosContainer}>
        {!sosActive ? (
          <TouchableOpacity onPress={handleSOS} activeOpacity={0.8}>
            <Animated.View style={styles.sosButton}>
              <Text style={styles.sosText}>SOS</Text>
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setPageMode('room')} activeOpacity={0.8}>
            <Animated.View style={[styles.sosButton, { backgroundColor: '#ff9800', transform: [{ scale: pulseAnim }] }]}>
              <Text style={[styles.sosText, { fontSize: 22, textAlign: 'center' }]}>SOS'e Dön</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* Sol Alt Profil Düzenle Butonu */}
      <View style={{ position: 'absolute', bottom: 40, left: 20, zIndex: 100 }}>
        <TouchableOpacity 
          style={{ backgroundColor: '#ff3b30', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5, flexDirection: 'row', alignItems: 'center' }} 
          onPress={() => setShowProfileModal(true)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Profili Düzenle</Text>
        </TouchableOpacity>
      </View>

      {/* Profil Düzenleme Modalı */}
      <Modal visible={showProfileModal} animationType="slide" transparent={true} onRequestClose={() => setShowProfileModal(false)}>
        <KeyboardAvoidingView style={styles.loginOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.loginBox, { backgroundColor: '#1e1e1e' }]}>
            <Text style={styles.title}>Profili Düzenle</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="İsim Soyisim" placeholderTextColor="#999" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telefon Numarası" keyboardType="phone-pad" placeholderTextColor="#999" />
            <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="Plaka (örn: 34 T 1234)" autoCapitalize="characters" placeholderTextColor="#999" />
            
            <TouchableOpacity style={styles.connectButton} onPress={handleUpdateProfile}>
              <Text style={styles.connectButtonText}>Güncelle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setShowProfileModal(false)}>
              <Text style={{ color: '#ff3b30', fontSize: 16, fontWeight: 'bold' }}>İptal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', alignItems: 'center' },
  map: { width: '100%', height: '100%' },

  // Login Ekranı
  loginOverlay: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  loginBox: { width: '85%', backgroundColor: 'rgba(30,30,30,1)', padding: 25, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  connectButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  connectButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // Ana Ekran (Home) Görünümü
  topBanner: { position: 'absolute', top: 50, width: '90%', backgroundColor: '#ff3b30', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5 },
  bannerInfo: { flex: 1 },
  bannerTitle: { color: 'white', fontWeight: '900', fontSize: 16 },
  bannerSubtitle: { color: 'white', fontSize: 14, marginTop: 2 },
  joinButton: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  joinButtonText: { color: '#ff3b30', fontWeight: 'bold' },

  mapCenterBox: { width: '90%', height: 350, marginTop: 140, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#ddd', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },

  homeLogsContainer: { position: 'absolute', top: 120, left: 20, right: 20, zIndex: 10, alignItems: 'center' },
  homeLogCard: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8, marginBottom: 5 },
  homeLogText: { color: 'white', fontSize: 12 },

  homeSosContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  sosButton: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#ff3b30', justifyContent: 'center', alignItems: 'center', shadowColor: '#ff3b30', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10 },
  sosText: { color: 'white', fontSize: 32, fontWeight: '900' },

  // Oda (Room) Görünümü
  roomContainer: { flex: 1, backgroundColor: '#111' },
  roomHeader: { height: 100, paddingTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#222' },
  headerButton: { padding: 10, backgroundColor: '#444', borderRadius: 8 },
  headerButtonRed: { padding: 10, backgroundColor: '#ff3b30', borderRadius: 8 },
  headerButtonText: { color: 'white', fontWeight: 'bold' },
  roomTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  roomMapBox: { flex: 1, backgroundColor: '#333' },

  pttBox: { height: 250, backgroundColor: '#111', borderTopWidth: 2, borderColor: '#222', alignItems: 'center', justifyContent: 'center', padding: 20 },
  pttStatusText: { color: '#ff3b30', fontWeight: 'bold', fontSize: 18, marginBottom: 20 },
  pttButton: { width: '100%', height: 100, backgroundColor: '#333', borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#555' },
  pttButtonRecording: { backgroundColor: '#ff3b30', borderColor: '#ff0000' },
  pttButtonText: { color: 'white', fontSize: 24, fontWeight: 'bold' },

  sosMarkerContainer: { alignItems: 'center', justifyContent: 'center' },
  sosBadge: { backgroundColor: '#ff3b30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 2, borderColor: 'white', zIndex: 2, elevation: 5, marginBottom: -5 },
  sosBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  carIcon: { fontSize: 36 },
  taxiMarker: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  focusButton: { position: 'absolute', backgroundColor: 'rgba(255, 59, 48, 0.9)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  focusButtonText: { color: 'white', fontWeight: 'bold' },

  chatModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  chatBox: { backgroundColor: '#222', height: '60%', borderTopLeftRadius: 20, borderTopRightRadius: 20, display: 'flex' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#444', backgroundColor: '#333', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  chatHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  chatCloseText: { color: '#ff3b30', fontWeight: 'bold', fontSize: 16 },
  chatBubble: { padding: 10, borderRadius: 10, marginBottom: 10, maxWidth: '80%' },
  chatBubbleMe: { backgroundColor: '#007aff', alignSelf: 'flex-end' },
  chatBubbleOther: { backgroundColor: '#444', alignSelf: 'flex-start' },
  chatSenderName: { fontSize: 12, color: '#ccc', marginBottom: 2, fontWeight: 'bold' },
  chatContent: { color: '#fff', fontSize: 16 },
  chatPlayIconBtn: { marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  audioMessageContainer: { minWidth: 150, paddingVertical: 5 },
  audioMessageRow: { flexDirection: 'row', alignItems: 'center' },
  waveformBox: { flex: 1 },
  audioDurationText: { color: '#aaa', fontSize: 11, fontWeight: 'bold', marginTop: 5, alignSelf: 'flex-start' },
  chatInputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#333', borderTopWidth: 1, borderColor: '#444' },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#555', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#222', color: 'white' },
  chatSendButton: { backgroundColor: '#007aff', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 20, marginLeft: 10 },
  chatSendText: { color: 'white', fontWeight: 'bold' },

});
