import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Animated, ScrollView, Dimensions, Modal, FlatList, KeyboardAvoidingView, Platform, LogBox, Image, ActivityIndicator, Easing, AppState } from 'react-native';

// --- Hata ve Uyarı Gizleme ---
LogBox.ignoreLogs([
  '[expo-av]', // expo-av deprecation uyarısını gizle
  'Unable to activate keep awake', // Android'de gereksiz keep-awake hatasını gizle
]);

import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS, Video, ResizeMode } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
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

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { jwtDecode } from 'jwt-decode';
import { MaterialIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { usePTT } from '../hooks/usePTT';
import PCM from 'react-native-pcm-player-lite';

// DİKKAT: Bu değer, usePTT.ts içindeki bufferSize: 4096 (16kHz, 16bit Mono) ile senkron olmalıdır. Değişirse ikisi birden değişmelidir!
const CHUNK_DURATION_MS = 128;

let pcmQueue: string[] = [];
let isPcmPlaying = false;
let pcmStarted = false;
let isPcmStarting = false;
let pcmInterval: ReturnType<typeof setInterval> | null = null;
let pcmStopTimer: ReturnType<typeof setTimeout> | null = null;
let serverClockOffset = 0;

// --- Hata Gizleme (Expo Go expo-notifications hatası için) ---
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('expo-notifications')) {
    return;
  }
  originalConsoleError(...args);
};

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
  const { height } = Dimensions.get('window');
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('has_seen_onboarding');
        if (!hasSeen) {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.log(e);
      }
    };
    checkOnboarding();
  }, []);

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
    } catch (e) {
      console.log(e);
    }
    setShowOnboarding(false);
  };

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
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [isCardDetected, setIsCardDetected] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isKvkkChecked, setIsKvkkChecked] = useState(false);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<{type: 'kvkk' | 'terms' | null}>({type: null});

  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [pageMode, setPageMode] = useState<'home' | 'room'>('home');
  const [sosNotifications, setSosNotifications] = useState<SosNotification[]>([]);

  const [sosActive, setSosActive] = useState(false); // Ben SOS verdim mi?
  const [activeSOSRoom, setActiveSOSRoom] = useState<string | null>(null); // Hangi odadayım?

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data.roomName &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const roomName = lastNotificationResponse.notification.request.content.data.roomName;
      setActiveSOSRoom(roomName);
      setPageMode('room');

      if (socket) {
        socket.emit('join_sos_room', roomName);
      }
    }
  }, [lastNotificationResponse, socket]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (activeSOSRoom) {
      AsyncStorage.setItem('activeSOSRoom', activeSOSRoom).catch(() => { });
    } else {
      AsyncStorage.removeItem('activeSOSRoom').catch(() => { });
    }
  }, [activeSOSRoom]);

  const splashLogoTranslateY = useRef(new Animated.Value(Dimensions.get('window').height / 4)).current;
  const splashLogoScale = useRef(new Animated.Value(2)).current;
  const splashFormOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ses modunu uygulama başlatılırken 1 kez ayarla (Her seste ayarlayıp 1-2sn gecikme yaratmaması için)
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true, // Echo iptali ve kayıt için zorunlu (playAndRecord)
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: false,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        });
      } catch (e) { }
    };
    initAudio();

    SplashScreen.preventAutoHideAsync().catch(() => { });

    setTimeout(() => {
      SplashScreen.hideAsync().catch(() => { });

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
    }, 1500);
  }, []);

  const [roomUsers, setRoomUsers] = useState<any[]>([]); // Haritada göstermek için diğer kişilerin konumu.

  const [followMode, setFollowMode] = useState<'none' | 'me' | 'sos'>('none'); // Harita kimi takip edecek?

  const [logs, setLogs] = useState<{ id: string, msg: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [incomingSpeaker, setIncomingSpeaker] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarAnim1 = useRef(new Animated.Value(0)).current;
  const radarAnim2 = useRef(new Animated.Value(0)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mapRef = useRef<MapView>(null);

  // --- NOTIFEE FOREGROUND SERVICE EFEKTİ ---
  useEffect(() => {
    async function toggleForegroundService() {
      if (activeSOSRoom) {
        await notifee.requestPermission();
        const channelId = await notifee.createChannel({
          id: 'sos_channel',
          name: 'SOS Telsizi',
          importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
          title: '🚨 SOS Telsizi Aktif',
          body: 'Telsizden gelen sesleri arka planda dinlemeye devam ediyorsunuz.',
          android: {
            channelId,
            asForegroundService: true,
            color: '#ff0000',
            ongoing: true,
          },
        });
      } else {
        await notifee.stopForegroundService();
      }
    }
    toggleForegroundService();
  }, [activeSOSRoom]);

  const [testLoading, setTestLoading] = useState(false); // Geçici Test State'i

  const [recordingUI, setRecordingUI] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [inputText, setInputText] = useState("");
  const chatListRef = useRef<FlatList>(null);

  const { isMicMuted, isChannelLocked, lockedBy, requestPtt, stopPtt } = usePTT(socket, activeSOSRoom);
  const [pttHoldTime, setPttHoldTime] = useState(0);
  const pttTimerRef = useRef<NodeJS.Timeout | null>(null);


  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [id: string]: number }>({});
  const historySoundRef = useRef<Audio.Sound | null>(null);
  const incomingSoundRef = useRef<Audio.Sound | null>(null);

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


  const audioModeRef = useRef(true);

  const stopHistoryAudio = async () => {
    if (historySoundRef.current) {
      try {
        await historySoundRef.current.stopAsync();
        await historySoundRef.current.unloadAsync();
      } catch (e) { }
      historySoundRef.current = null;
    }
    setPlayingAudioId(null);
    if (!audioModeRef.current) {
      audioModeRef.current = true;
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: false,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        });
      } catch (e) {}
    }
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

    if (incomingSoundRef.current) {
      try {
        await incomingSoundRef.current.stopAsync();
        await incomingSoundRef.current.unloadAsync();
        incomingSoundRef.current = null;
        setIncomingSpeaker(null);
      } catch (e) { }
    }

    setPlayingAudioId(msg.id);

    try {
      if (audioModeRef.current) {
        audioModeRef.current = false;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false, // Mikrofonu uyutup sesi HOPARLÖRE zorlar ve hızlı oynamasını sağlar
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: false,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        });
      }

      let soundToPlay;
      if (msg.content.startsWith('http')) {
        const fileName = msg.content.split('/').pop()?.split('?')[0] || `history_voice_${msg.id}.wav`;
        const fileUri = FileSystem.documentDirectory + fileName;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: fileUri },
            { shouldPlay: true, volume: 1.0 }
          );
          soundToPlay = sound;
        } else {
          const { uri } = await FileSystem.downloadAsync(msg.content, fileUri);
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true, volume: 1.0 }
          );
          soundToPlay = sound;
        }
      } else {
        const fileUri = FileSystem.documentDirectory + `history_voice_${Date.now()}.m4a`; // Orijinal base64 AAC formatı korundu
        const pureBase64 = msg.content.includes('base64,') ? msg.content.split('base64,')[1] : msg.content;
        await FileSystem.writeAsStringAsync(fileUri, pureBase64, { encoding: FileSystem.EncodingType.Base64 });
        const { sound } = await Audio.Sound.createAsync(
          { uri: fileUri },
          { shouldPlay: true, volume: 1.0 }
        );
        soundToPlay = sound;
      }

      historySoundRef.current = soundToPlay;

      soundToPlay.setOnPlaybackStatusUpdate((status: any) => {
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
      let hasCredentials = false;
      try {
        // MIGRATION: Eski şifresiz verileri tamamen sil
        try {
          await AsyncStorage.removeItem('user_credentials');
          await AsyncStorage.removeItem('user_token');
          const credentialsPath = FileSystem.documentDirectory + 'user_credentials.json';
          const fileInfo = await FileSystem.getInfoAsync(credentialsPath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(credentialsPath, { idempotent: true });
          }
        } catch (e) {
          console.log("Migration hatası (Önemli olmayabilir, ancak takip için kaydedildi):", e);
        }

        // AĞ KONTROLÜ
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
          Alert.alert("Bağlantı Hatası", "İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
          setIsCheckingAuth(false);
          setIsAutoLoginTriggered(true);
          return;
        }

        const storedRoom = await AsyncStorage.getItem('activeSOSRoom');
        if (storedRoom) {
          setActiveSOSRoom(storedRoom);
          setPageMode('room');
          // offline mode sos aktif mi bilemiyoruz tam ama kalsın
        }

        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          try {
            const res = await fetch(`${serverIp}/api/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            const data = await res.json();
            if (data.accessToken) {
              const decoded: any = jwtDecode(data.accessToken);
              setName(decoded.name);
              setPlate(decoded.plate);
              setPhone(decoded.phone);
              setAuthStatus(decoded.status);
              setAccessToken(data.accessToken);
              hasCredentials = true;

              if (storedRoom === "sos_room_" + decoded.phone) {
                setSosActive(true);
              }
            }
          } catch (fetchErr) {
            console.log("Token yenileme başarısız", fetchErr);
          }
        }

      } catch (err) {
        console.log("Kimlik bilgileri yüklenirken hata oluştu:", err);
      } finally {
        setIsCheckingAuth(false);
        if (!hasCredentials) {
          setIsAutoLoginTriggered(true);
        }
      }
    };
    loadCredentials();
  }, []);

  // --- SILENT BACKGROUND REFRESH ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const refreshTokenIfNeeded = async () => {
      const currentRefreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!currentRefreshToken || !accessToken) return;
      
      try {
        const decoded: any = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;
        
        // Eğer token süresinin bitmesine 10 dakikadan az kalmışsa yenile
        if (decoded.exp && decoded.exp - currentTime < 600) {
          const res = await fetch(`${serverIp}/api/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken })
          });
          const data = await res.json();
          if (data.accessToken) {
            setAccessToken(data.accessToken);
            if (socket && socket.connected) {
              socket.emit('update_token', data.accessToken);
            }
          }
        }
      } catch (e) {
        console.log("Arka plan yenileme hatası:", e);
      }
    };

    // Her 5 dakikada bir kontrol et (ön plandayken)
    interval = setInterval(refreshTokenIfNeeded, 5 * 60 * 1000);

    // Arka plandan ön plana geçişleri dinle
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshTokenIfNeeded();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [accessToken, socket, serverIp]);

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

  // Ana ekrandaki SOS butonunun dikkat çekmesi için "radar" halkaları
  useEffect(() => {
    if (!sosActive) {
      const makeLoop = (anim: Animated.Value, delay: number) => Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      );
      const loop1 = makeLoop(radarAnim1, 0);
      const loop2 = makeLoop(radarAnim2, 900);
      loop1.start();
      loop2.start();
      return () => {
        loop1.stop();
        loop2.stop();
        radarAnim1.setValue(0);
        radarAnim2.setValue(0);
      };
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

  
  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Hata', 'Kamera izni gerekiyor.');
        result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Hata', 'Galeri izni gerekiyor.');
        result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5 });
      }
      if (!result.canceled && result.assets[0].base64) {
        setImageBase64(result.assets[0].base64);
      }
    } catch (e) {
      Alert.alert('Hata', 'Resim seçilemedi.');
    }
  };

  const registerUser = async () => {
    if (!name || !plate || !phone || !password || !passwordConfirm || !imageBase64) return Alert.alert('Uyarı', 'Tüm alanları ve fotoğrafı doldurun.');
    if (password !== passwordConfirm) return Alert.alert('Uyarı', 'Şifreler birbiriyle uyuşmuyor.');
    if (!isKvkkChecked || !isTermsChecked) return Alert.alert('Uyarı', 'Kayıt olmak için Kullanıcı Sözleşmesi ve KVKK metnini onaylamanız gerekmektedir.');

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

    setIsConnecting(true);
    try {
      const pushToken = await registerForPushNotificationsAsync();
      const res = await fetch(`${serverIp}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, plate, phone, password, pushToken, imageBase64: 'data:image/jpeg;base64,' + imageBase64 })
      });
      const data = await res.json();
      if (data.success) {
        setAuthStatus('pending');
        Alert.alert('Başarılı', 'Kayıt talebiniz alındı. Yöneticiler tarafından onaylandığında giriş yapabileceksiniz.');
      } else {
        Alert.alert('Hata', data.error || 'Kayıt başarısız.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLoginClick = async () => {
    if (!phone || !password) return Alert.alert('Uyarı', 'Lütfen telefon numarası ve şifrenizi girin.');
    setIsConnecting(true);
    try {
      const res = await fetch(`${serverIp}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (data.status === 'approved') {
        setAuthStatus('approved');
        setName(data.user.name);
        setPlate(data.user.plate);
        setAccessToken(data.accessToken);
        
        if (data.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        } else {
          // Geriye uyumluluk veya sunucu güncellenmemişse eski tokeni sakla (Geçici)
          await SecureStore.setItemAsync('refreshToken', data.token || "dummy_token");
        }
        
        // Remove old style local storage
        await AsyncStorage.removeItem('user_credentials');
        await AsyncStorage.removeItem('user_token');

        handleConnect(data.user.name, data.user.plate, phone, data.accessToken || data.token);
      } else if (data.status === 'not_found') {
        Alert.alert('Hata', 'Bu telefon numarasıyla kayıtlı bir hesap bulunamadı.');
      } else if (data.error) {
        Alert.alert('Hata', data.error);
        if (data.status === 'rejected') setAuthStatus('not_found');
        if (data.status === 'banned') setAuthStatus('banned');
      } else {
        setAuthStatus(data.status);
      }
    } catch (e) {
      console.log("Login hatası:", e);
      Alert.alert('Hata', 'Sunucuya bağlanılamadı veya bir hata oluştu: ' + (e as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async (connectName = name, connectPlate = plate, connectPhone = phone, currentToken = accessToken) => {
    if (!currentToken) {
       Alert.alert("Hata", "Oturum süresi dolmuş veya token bulunamadı. Lütfen tekrar giriş yapın.");
       return;
    }
    if (!connectName || !connectPlate || !connectPhone) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]{3,}$/;
    if (!nameRegex.test(connectName.trim())) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir isim soyisim giriniz (Sadece harfler ve en az 3 karakter).');
      return;
    }

    const phoneRegex = /^(05|5)[0-9]{9}$/;
    if (!phoneRegex.test(connectPhone.replace(/\s/g, ''))) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir telefon numarası giriniz (Örn: 05xx veya 5xx ile başlayan 10-11 haneli numara).');
      return;
    }

    const plateClean = connectPlate.replace(/\s/g, '');
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

    const newSocket = io(serverIp, {
      auth: { token: currentToken }
    });
    let hasConnected = false;

    newSocket.on('connect', async () => {
      hasConnected = true;
      setIsConnected(true);
      setIsConnecting(false);

      // Sunucu saat senkronizasyonu için ping at
      newSocket.emit('ping_time', Date.now());

      let pushToken = await registerForPushNotificationsAsync();

      newSocket.emit('connect_sos', {
        name: connectName,
        plate: connectPlate,
        phone: connectPhone,
        lat: currentLat,
        lon: currentLon,
        pushToken: pushToken
      });

      AsyncStorage.getItem('activeSOSRoom').then(storedRoom => {
        if (storedRoom) {
          newSocket.emit('join_sos_room', storedRoom);
          setActiveSOSRoom(storedRoom); // Geri döndüğünde state'e de set et
          setPageMode('room'); // Otomatik olarak SOS odası arayüzüne geçir
        }
      }).catch(() => { });
      addLog(`✅ Bağlanıldı: ${connectName}`);

      // Kimlik bilgileri artık AsyncStorage'de SAKLANMIYOR. Sadece SecureStore'daki token var.
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket koptu:', reason);
      // Eğer sunucu bizi bilerek kopardıysa (token yenileme başarısızsa) logine at
      if (reason === 'io server disconnect') {
        setIsConnected(false);
        setIsAutoLoginTriggered(false);
        setAuthStatus(null);
        Alert.alert("Oturum Kapandı", "Oturum süreniz doldu veya başka bir cihazdan giriş yapıldı.");
      }
    });

    newSocket.on('pong_time', (data: { clientTime: number, serverTime: number }) => {
      const now = Date.now();
      const rtt = now - data.clientTime;
      const estimatedServerTime = data.serverTime + (rtt / 2);
      serverClockOffset = estimatedServerTime - now;
      console.log("Sunucu saat farkı (offset) hesaplandı: ", serverClockOffset, "ms");
    });

    newSocket.on('all_users_update', (usersData: any[]) => {
      setRoomUsers(usersData);

      // Aktif SOS odalarını bul ve "Tekrar Katıl" butonunun çıkması için bildirimlere ekle
      const activeSOS = usersData.filter(u => u.activeRoom && u.activeRoom.startsWith('sos_room_'));
      setSosNotifications(prev => {
        let newNotifs = [...prev];
        activeSOS.forEach(sosUser => {
          const roomName = sosUser.activeRoom;
          // Eğer bu odanın bildirimi zaten varsa veya kendi odamızsa ekleme
          if (!newNotifs.find(n => n.roomName === roomName) && roomName !== "sos_room_" + connectPhone) {
            const latDiff = currentLat - sosUser.lat;
            const lonDiff = currentLon - sosUser.lon;
            // Basit kuş uçuşu mesafe formülü
            const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111;

            newNotifs.push({
              roomName: roomName,
              lat: sosUser.lat,
              lon: sosUser.lon,
              distance: distance,
              from: sosUser.name
            });
          }
        });
        return newNotifs;
      });
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

    newSocket.on('channel_locked', async (data: any) => {
      if (data.speakerId !== newSocket.id) {
        setIncomingSpeaker(data.lockedBy);
        if (pcmStopTimer) { clearTimeout(pcmStopTimer); pcmStopTimer = null; }
        if (!pcmStarted && !isPcmStarting) {
          isPcmStarting = true;
          try {
            await PCM.start(16000);
            pcmStarted = true;
          } catch(e) { console.log('PCM Start err:', e); }
          isPcmStarting = false;
        }
      }
    });

    newSocket.on('channel_released', () => {
      setIncomingSpeaker(null);
      // Sesi anında kesmeyip kuyruğun (son kelimelerin) bitmesini bekle
      // Ancak çok uzun sürerse diye max 2 saniye sonra zorla kapat
      if (pcmStopTimer) clearTimeout(pcmStopTimer);
      pcmStopTimer = setTimeout(() => {
        if (pcmStarted) {
          PCM.stop().catch((e: any) => console.log('PCM Stop err:', e));
          pcmStarted = false;
        }
        if (pcmInterval) { clearInterval(pcmInterval); pcmInterval = null; }
        pcmQueue = [];
      }, 2000);
    });

    newSocket.on('receive_audio_chunk', async (payload: any) => {
      try {
        if (payload.senderId === newSocket.id) return; // Self-mute

        // Drift (Eskime/Burst) Koruması
        // Cihazın saati ile sunucunun saati arasındaki senkronizasyon farkını (offset) kullan.
        if (payload.timestamp) {
           const adjustedLocalTime = Date.now() + serverClockOffset;
           // Eşiği 1.5 saniyeden 5 saniyeye çıkardık (Ping süresi uzarsa sesler çöpe gitmesin)
           if (adjustedLocalTime - payload.timestamp > 5000) {
              return; 
           }
        }

        // Dayanıklılık (Resilience): Sinyal (channel_locked) kaybolsa bile veri akıyorsa kapanmayı engelle
        if (pcmStopTimer) { clearTimeout(pcmStopTimer); pcmStopTimer = null; }

        if (!pcmStarted && !isPcmStarting) {
          isPcmStarting = true;
          try {
            await PCM.start(16000);
            pcmStarted = true;
            // Başladıktan sonra bekleyen chunk'ları gönder
            while (pcmQueue.length > 0) {
              const chunk = pcmQueue.shift();
              if (chunk) PCM.enqueueBase64(chunk);
            }
          } catch(e) { console.log('PCM Start err:', e); }
          isPcmStarting = false;
        }

        const dataUrl = typeof payload === 'string' ? payload : payload.audio;
        
        // Interval (JS tarafında buffering) kullanmak sesi geciktirir ve anlık iletişimi bozar.
        // Gelen veriyi anında Native tarafa iletiyoruz. (Native taraf kendi buffer'ını yönetir)
        if (pcmStarted) {
          PCM.enqueueBase64(dataUrl);
        } else {
          pcmQueue.push(dataUrl); // Henüz başlamadıysa kısa süreliğine kuyruğa al
          // Güvenlik sınırı: PCM motoru bir sebeple başlatılamazsa veya takılırsa bellek şişmesini önlemek için
          if (pcmQueue.length > 15) {
            pcmQueue = pcmQueue.slice(pcmQueue.length - 10);
          }
        }
      } catch (e) {
        console.log("Chunk çalınamadı:", e);
      }
    });

    // play_voice listener tamamen kaldırıldı (Native player'in zaten çaldığı sesin tekrar oynamaması için)

    newSocket.on('chat_message', async (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
      if (msg.senderId !== newSocket.id) {
        if (AppState.currentState !== 'active') {
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

    newSocket.on('user_speaking', (data: any) => {
      setIncomingSpeaker(data.isSpeaking ? data.senderName : null);
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
    } catch (err) { }

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

  /* -- ESKİ EXPO-AV KAYIT KODLARI --
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
  ----------------------------------*/

  const handleBlockedPtt = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleStartPtt = async () => {
    await stopHistoryAudio(); // Mod değişiminin tamamlanması beklendi
    if (isChannelLocked || incomingSpeaker) {
      handleBlockedPtt();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    requestPtt();
    
    setPttHoldTime(0);
    pttTimerRef.current = setInterval(() => {
      setPttHoldTime(prev => prev + 1);
    }, 1000);
    
    addLog("🎙️ Konuşma isteği gönderildi.");
  };

  const handleStopPtt = () => {
    stopPtt();
    
    if (pttTimerRef.current) {
      clearInterval(pttTimerRef.current);
      pttTimerRef.current = null;
    }
    setPttHoldTime(0);

    addLog("🔇 Ses gönderimi bitti.");
  };

  // --- RENDERING VIEWS ---

  if (!isConnected || testLoading) {
    if (isCheckingAuth || isConnecting || testLoading) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ff3b30" />
          <Text style={{ color: 'white', marginTop: 15, fontSize: 16, fontWeight: 'bold' }}>Yükleniyor...</Text>
        </View>
      );
    }


    const takePicture = async () => {
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
          if (photo && photo.base64) {
            setImageBase64(photo.base64);
            setIsCameraScanning(false);
            setIsCardDetected(false); // reset
          }
        } catch (e) {
          Alert.alert('Hata', 'Fotoğraf çekilemedi');
        }
      }
    };

    useEffect(() => {
      if (isCameraScanning && cameraPermission?.granted) {
        // Fake card detection after 2 seconds
        const timer = setTimeout(() => {
          setIsCardDetected(true);
          setTimeout(() => {
            takePicture();
          }, 1500); // takes picture 1.5s after turning green
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setIsCardDetected(false);
      }
    }, [isCameraScanning, cameraPermission]);

    if (isCameraScanning) {
      if (!cameraPermission?.granted) {
        return (
          <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 20 }}>Kamera izni gerekiyor</Text>
            <TouchableOpacity onPress={requestCameraPermission} style={styles.connectButton}><Text style={styles.connectButtonText}>İzin Ver</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setIsCameraScanning(false)} style={{ marginTop: 20 }}><Text style={{ color: '#ff3b30', fontSize: 16 }}>İptal</Text></TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
               {/* Kredi kartı/ehliyet çerçevesi */}
               <View style={{ width: Dimensions.get('window').width * 0.85, height: 220, borderWidth: 4, borderColor: isCardDetected ? '#00ff00' : '#ffffff', borderRadius: 10, backgroundColor: 'transparent' }} />
               <Text style={{ color: isCardDetected ? '#00ff00' : '#fff', marginTop: 20, fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>
                  {isCardDetected ? 'Kart Algılandı! Fotoğraf Çekiliyor...' : 'Lütfen şoför kartınızı çerçevenin içine yerleştirin'}
               </Text>
            </View>
            <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around' }}>
              <TouchableOpacity onPress={() => setIsCameraScanning(false)} style={{ padding: 15, backgroundColor: '#333', borderRadius: 10 }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takePicture} style={{ padding: 20, backgroundColor: '#ff3b30', borderRadius: 40 }}>
                <MaterialIcons name="camera" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
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

              <Animated.View style={{ opacity: splashFormOpacity, width: '100%', paddingHorizontal: 20 }}>
                {authStatus === 'pending' && (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <MaterialIcons name="hourglass-empty" size={60} color="#ff3b30" />
                    <Text style={{ color: '#fff', fontSize: 18, marginTop: 15, textAlign: 'center', fontWeight: 'bold' }}>Kaydınız İnceleniyor</Text>
                    <Text style={{ color: '#999', fontSize: 14, marginTop: 10, textAlign: 'center' }}>Şoför kartınız yöneticiler tarafından incelendikten sonra uygulamaya giriş yapabileceksiniz.</Text>
                    <TouchableOpacity style={[styles.connectButton, { marginTop: 30 }]} onPress={handleLoginClick}>
                      {isConnecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.connectButtonText}>Durumu Kontrol Et</Text>}
                    </TouchableOpacity>
                  </View>
                )}
                {authStatus === 'rejected' && (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <MaterialIcons name="cancel" size={60} color="#ff3b30" />
                    <Text style={{ color: '#fff', fontSize: 18, marginTop: 15, textAlign: 'center', fontWeight: 'bold' }}>Kaydınız Reddedildi</Text>
                    <Text style={{ color: '#999', fontSize: 14, marginTop: 10, textAlign: 'center' }}>Bilgileriniz veya şoför kartınız geçersiz. Lütfen tekrar kayıt olun.</Text>
                    <TouchableOpacity style={[styles.connectButton, { marginTop: 30 }]} onPress={() => { setAuthStatus('not_found'); setImageBase64(null); }}>
                      <Text style={styles.connectButtonText}>Tekrar Kayıt Ol</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {authStatus === 'banned' && (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <MaterialIcons name="block" size={60} color="#ff3b30" />
                    <Text style={{ color: '#fff', fontSize: 18, marginTop: 15, textAlign: 'center', fontWeight: 'bold' }}>Hesabınız Engellendi</Text>
                    <Text style={{ color: '#999', fontSize: 14, marginTop: 10, textAlign: 'center' }}>Sistem yöneticileri tarafından uygulamaya erişiminiz kalıcı olarak engellenmiştir.</Text>
                  </View>
                )}
                {authStatus === 'approved' && (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <MaterialIcons name="wifi-off" size={60} color="#ff3b30" />
                    <Text style={{ color: '#fff', fontSize: 18, marginTop: 15, textAlign: 'center', fontWeight: 'bold' }}>Bağlantı Koptu</Text>
                    <Text style={{ color: '#999', fontSize: 14, marginTop: 10, textAlign: 'center' }}>Sunucuya bağlanılamıyor veya internet bağlantınız yok.</Text>
                    <TouchableOpacity style={[styles.connectButton, { marginTop: 30 }]} onPress={() => handleConnect(name, plate, phone, accessToken)}>
                      <Text style={styles.connectButtonText}>Yeniden Bağlan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setAuthStatus(null)}>
                      <Text style={{ color: '#ff3b30', fontSize: 16 }}>Farklı Hesaba Geç</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {(authStatus === null || authStatus === 'not_found') && authMode === 'login' && (
                  <>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telefon Numarası" keyboardType="phone-pad" placeholderTextColor="#999" />
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword} placeholder="Şifre" secureTextEntry={!showPassword} placeholderTextColor="#999" />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 15, top: 15 }}>
                         <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={24} color="#999" />
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity style={[styles.connectButton, isConnecting && { opacity: 0.7 }]} onPress={handleLoginClick} disabled={isConnecting}>
                      {isConnecting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.connectButtonText}>Giriş Yap</Text>}
                    </TouchableOpacity>

                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#ccc', fontSize: 14 }}>Hesabın yok mu?</Text>
                      <TouchableOpacity onPress={() => setAuthMode('register')} style={{ marginTop: 10 }}>
                        <Text style={{ color: '#ff3b30', fontSize: 16, fontWeight: 'bold' }}>Kayıt Ol</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {(authStatus === null || authStatus === 'not_found') && authMode === 'register' && (
                  <>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="İsim Soyisim" placeholderTextColor="#999" />
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telefon Numarası" keyboardType="phone-pad" placeholderTextColor="#999" />
                    <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="Plaka (örn: 34XYZ99)" autoCapitalize="characters" placeholderTextColor="#999" />
                    
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword} placeholder="Şifre Belirleyin" secureTextEntry={!showPassword} placeholderTextColor="#999" />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 15, top: 15 }}>
                         <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={24} color="#999" />
                      </TouchableOpacity>
                    </View>
                    
                    <TextInput style={styles.input} value={passwordConfirm} onChangeText={setPasswordConfirm} placeholder="Şifreyi Tekrar Girin" secureTextEntry={!showPassword} placeholderTextColor="#999" />
                    
                    <View style={{ marginTop: 10, marginBottom: 20 }}>
                        <Text style={{ color: '#ff3b30', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>Lütfen Şoför Tanıtım Kartınızı yükleyin.</Text>
                        {imageBase64 ? (
                           <Image source={{ uri: 'data:image/jpeg;base64,' + imageBase64 }} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 10 }} resizeMode="cover" />
                        ) : null}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                           <TouchableOpacity style={{ flex: 1, backgroundColor: '#333', padding: 12, borderRadius: 10, marginRight: 5, alignItems: 'center' }} onPress={async () => {
                              if (!cameraPermission?.granted) await requestCameraPermission();
                              setIsCameraScanning(true);
                           }}>
                              <MaterialIcons name="camera-alt" size={24} color="#fff" />
                              <Text style={{ color: '#fff', fontSize: 12, marginTop: 5 }}>Kamera</Text>
                           </TouchableOpacity>
                           <TouchableOpacity style={{ flex: 1, backgroundColor: '#333', padding: 12, borderRadius: 10, marginLeft: 5, alignItems: 'center' }} onPress={() => pickImage(false)}>
                              <MaterialIcons name="photo-library" size={24} color="#fff" />
                              <Text style={{ color: '#fff', fontSize: 12, marginTop: 5 }}>Galeri</Text>
                           </TouchableOpacity>
                        </View>

                        {/* Legal Checkboxes */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                           <TouchableOpacity onPress={() => setIsTermsChecked(!isTermsChecked)} style={{ marginRight: 10 }}>
                              <MaterialIcons name={isTermsChecked ? "check-box" : "check-box-outline-blank"} size={24} color="#ff3b30" />
                           </TouchableOpacity>
                           <Text style={{ color: '#ccc', flex: 1, fontSize: 13 }}>
                              <Text style={{ color: '#58a6ff', textDecorationLine: 'underline' }} onPress={() => setShowLegalModal({type: 'terms'})}>Kullanıcı Sözleşmesi</Text>'ni okudum ve kabul ediyorum.
                           </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                           <TouchableOpacity onPress={() => setIsKvkkChecked(!isKvkkChecked)} style={{ marginRight: 10 }}>
                              <MaterialIcons name={isKvkkChecked ? "check-box" : "check-box-outline-blank"} size={24} color="#ff3b30" />
                           </TouchableOpacity>
                           <Text style={{ color: '#ccc', flex: 1, fontSize: 13 }}>
                              <Text style={{ color: '#58a6ff', textDecorationLine: 'underline' }} onPress={() => setShowLegalModal({type: 'kvkk'})}>KVKK Aydınlatma ve Açık Rıza Metni</Text>'ni okudum, anladım ve kabul ediyorum.
                           </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.connectButton, { backgroundColor: '#ff3b30' }, isConnecting && { opacity: 0.7 }]} onPress={registerUser} disabled={isConnecting}>
                      {isConnecting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.connectButtonText}>Kayıt Ol</Text>}
                    </TouchableOpacity>

                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#ccc', fontSize: 14 }}>Zaten hesabın var mı?</Text>
                      <TouchableOpacity onPress={() => setAuthMode('login')} style={{ marginTop: 10 }}>
                        <Text style={{ color: '#ff3b30', fontSize: 16, fontWeight: 'bold' }}>Giriş Yap</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
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
          {activeSOSRoom ? (
            <>
              <View style={styles.pttStatusRow}>
                <View style={[styles.pttStatusDot, (!isMicMuted || pttHoldTime > 0) ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#555' }]} />
                <Text style={styles.pttStatusTextNew}>{(!isMicMuted || pttHoldTime > 0) ? 'Ses yayını aktif' : 'Ses yayını kapalı'}</Text>
                <Text style={styles.pttTimerText}>{formatDuration(pttHoldTime * 1000)}</Text>
              </View>
              <Text style={styles.pttInstruction}>Konuşmak için mikrofonu basılı tutun.</Text>
              
              <View style={styles.pttButtonContainer}>
                {(!isMicMuted || pttHoldTime > 0) ? <MaterialIcons name="graphic-eq" size={32} color="#ff3b30" style={{ marginRight: 20 }} /> : null}
                <TouchableOpacity
                  style={[styles.pttButton, (!isMicMuted || pttHoldTime > 0) ? styles.pttButtonRecording : styles.pttButtonInactive, isChannelLocked && styles.pttButtonLocked]}
                  onPressIn={handleStartPtt}
                  onPressOut={handleStopPtt}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="mic" size={56} color="white" />
                </TouchableOpacity>
                {(!isMicMuted || pttHoldTime > 0) ? <MaterialIcons name="graphic-eq" size={32} color="#ff3b30" style={{ marginLeft: 20 }} /> : null}
              </View>
              
              {isChannelLocked && !!lockedBy ? (
                <Text style={[styles.pttStatusText, { marginTop: 15 }]}>{lockedBy} konuşuyor...</Text>
              ) : null}
            </>
          ) : null}
        </View>

        {/* SOHBET MODALI */}
        <Modal visible={showChat} animationType="slide" transparent={true} onRequestClose={() => setShowChat(false)}>
          <View style={styles.chatModalContainer}>
            <TouchableOpacity style={{ flex: 1, width: '100%' }} activeOpacity={1} onPress={() => setShowChat(false)} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
              <View style={[styles.chatBox, { height: height * 0.7, width: '100%' }]}>
                <View style={styles.chatDragHandle} />
                <View style={styles.chatHeader}>
                  <Text style={styles.chatHeaderTitle}>Acil Durum Sohbeti</Text>
                  <TouchableOpacity onPress={() => setShowChat(false)}>
                    <Text style={styles.chatCloseText}>Kapat</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  ref={chatListRef}
                  onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
                  onLayout={() => chatListRef.current?.scrollToEnd({ animated: true })}
                  data={chatMessages}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                  renderItem={({ item }) => {
                    const isMe = socket && item.senderId === socket.id;
                    const timestampStr = new Date(item.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <View style={[styles.chatRow, isMe ? styles.chatRowMe : styles.chatRowOther]}>
                        {!isMe && (
                          <View style={styles.chatAvatarOther}>
                            <MaterialIcons name="local-taxi" size={18} color="#fbc02d" />
                          </View>
                        )}
                        <View style={{ maxWidth: '75%' }}>
                          <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}>
                            {!isMe && <Text style={styles.chatSenderName}>{item.senderName}</Text>}
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
                          <View style={[styles.chatMetaRow, isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                            <Text style={styles.chatTime}>{timestampStr}</Text>
                            {isMe && <MaterialIcons name="done-all" size={14} color="#ff3b30" style={{ marginLeft: 4 }} />}
                          </View>
                        </View>
                        {isMe && (
                          <View style={styles.chatAvatarMe}>
                            <MaterialIcons name="person" size={20} color="#ccc" />
                          </View>
                        )}
                      </View>
                    );
                  }}
                />
                
                <View style={styles.onlineUsersRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineUsersText}>{roomUsers.length} kişi çevrimiçi</Text>
                </View>

                <View style={styles.chatInputContainer}>
                  <TouchableOpacity style={styles.chatAttachmentButton}>
                    <MaterialIcons name="attach-file" size={24} color="#aaa" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Mesaj yaz..."
                    placeholderTextColor="#777"
                    value={inputText}
                    onChangeText={setInputText}
                  />
                  <TouchableOpacity style={styles.chatSendButton} onPress={sendTextMessage}>
                    <Text style={styles.chatSendText}>Gönder</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    );
  }

  // Görünüm 1: Ana Ekran (Home)
  return (
    <View style={styles.container}>

      {/* Üst Bar: Profil Bilgisi + Çıkış */}
      <View style={styles.topBar}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(name || '?').trim().charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{name || 'Sürücü'}</Text>
            {plate ? (
              <View style={styles.plateBadge}>
                <MaterialIcons name="directions-car" size={11} color="#0a0a0a" />
                <Text style={styles.plateBadgeText}>{plate}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={async () => {
            try {
              // 1. Sunucu tarafında token versiyonunu artırarak çıkış yap (Token Invalidation)
              fetch(`${serverIp}/api/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
              }).catch(() => {});

              if (socket) socket.disconnect();
              setIsConnected(false);

              // 2. Güvenli depodaki refresh token'ı sil
              await SecureStore.deleteItemAsync('refreshToken');

              // 3. Kalıntıları sil ve state'i sıfırla
              await AsyncStorage.removeItem('activeSOSRoom');
              setName("");
              setPlate("");
              setPhone("");
              setAccessToken(null);
              setAuthStatus(null);
              setPassword("");
              setPasswordConfirm("");
              setIsAutoLoginTriggered(false);
              setAuthStatus(null);
              setAuthMode('login');
            } catch (e) { }
          }}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Üstteki SOS Alert Banner */}
      {sosNotifications.map((notification, index) => (
        <View key={notification.roomName} style={[styles.topBanner, { top: 130 + (index * 92) }]}>
          <View style={styles.bannerIconWrap}>
            <MaterialIcons name="campaign" size={20} color="#ff3b30" />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>ACİL YARDIM ÇAĞRISI</Text>
            <Text style={styles.bannerSubtitle}>{notification.from} · {notification.distance.toFixed(2)} km</Text>
          </View>
          <TouchableOpacity style={styles.joinButton} onPress={() => joinSOSRoom(notification.roomName, notification.from)}>
            <Text style={styles.joinButtonText}>Katıl</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Ana Ekran Ortalanmış Harita (Gizlendi) - Tamamen Silindi */}

      {/* Ortalanmış SOS Butonu */}
      <View style={styles.homeSosContainer}>
        <View style={styles.sosButtonBox}>
          {!sosActive && (
            <>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarRing,
                  {
                    opacity: radarAnim1.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                    transform: [{ scale: radarAnim1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarRing,
                  {
                    opacity: radarAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                    transform: [{ scale: radarAnim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
                  },
                ]}
              />
            </>
          )}
          {!sosActive ? (
            <TouchableOpacity onPress={handleSOS} activeOpacity={0.85} style={styles.sosTouchable}>
              <Animated.View style={styles.sosButton}>
                <MaterialIcons name="warning" size={26} color="#fff" />
                <Text style={styles.sosText}>SOS</Text>
              </Animated.View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setPageMode('room')} activeOpacity={0.85} style={styles.sosTouchable}>
              <Animated.View style={[styles.sosButton, { backgroundColor: '#ff9800', shadowColor: '#ff9800', transform: [{ scale: pulseAnim }] }]}>
                <MaterialIcons name="campaign" size={24} color="#fff" />
                <Text style={[styles.sosText, { fontSize: 20, textAlign: 'center' }]}>SOS'e Dön</Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sol Alt Profil Düzenle Butonu */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.editProfileBtn} onPress={() => setShowProfileModal(true)} activeOpacity={0.85}>
          <MaterialIcons name="edit" size={16} color="#fff" />
          <Text style={styles.editProfileText}>Profili Düzenle</Text>
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

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Video
            source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
            style={{ flex: 1 }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            useNativeControls={false}
            onPlaybackStatusUpdate={status => {
              if (status.isLoaded && status.didJustFinish) {
                handleFinishOnboarding();
              }
            }}
          />
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 8, zIndex: 100 }}
            onPress={handleFinishOnboarding}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Geç (Skip)</Text>
          </TouchableOpacity>
        </View>
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
  topBar: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 100, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 16, maxWidth: '78%' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#0a0a0a', fontWeight: '800', fontSize: 15 },
  profileName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  plateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  plateBadgeText: { color: '#0a0a0a', fontSize: 10, fontWeight: '800', marginLeft: 3 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  topBanner: { position: 'absolute', top: 50, width: '90%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, borderWidth: 1, borderColor: '#ff3b30', shadowColor: '#ff3b30', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  bannerIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,59,48,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  bannerInfo: { flex: 1 },
  bannerTitle: { color: '#ff3b30', fontWeight: '900', fontSize: 14, letterSpacing: 0.3 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  joinButton: { backgroundColor: '#ff3b30', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  joinButtonText: { color: 'white', fontWeight: '800', fontSize: 13 },

  homeSosContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  sosButtonBox: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center' },
  sosTouchable: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center' },
  radarRing: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: '#ff3b30' },
  sosButton: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#ff3b30', justifyContent: 'center', alignItems: 'center', shadowColor: '#ff3b30', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10 },
  sosText: { color: 'white', fontSize: 32, fontWeight: '900', marginTop: 2 },

  bottomBar: { position: 'absolute', bottom: 40, left: 20, zIndex: 100 },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22 },
  editProfileText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },

  // Oda (Room) Görünümü
  roomContainer: { flex: 1, backgroundColor: '#111' },
  roomHeader: { height: 100, paddingTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#111' },
  headerButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#222', borderRadius: 8 },
  headerButtonRed: { padding: 10, backgroundColor: '#cc0000', borderRadius: 8 },
  headerButtonText: { color: '#ccc', fontWeight: 'bold' },
  roomTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  roomMapBox: { flex: 1, backgroundColor: '#333' },

  pttBox: { backgroundColor: '#161616', borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center', padding: 30, paddingBottom: 50, minHeight: 280 },
  pttStatusRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 10 },
  pttStatusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  pttStatusTextNew: { color: 'white', fontSize: 16, fontWeight: 'bold', marginRight: 20 },
  pttTimerText: { color: '#ccc', fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  pttInstruction: { color: '#888', fontSize: 14, marginBottom: 40 },
  pttButtonContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  pttButton: { width: 130, height: 130, borderRadius: 65, justifyContent: 'center', alignItems: 'center' },
  pttButtonInactive: { backgroundColor: '#333', borderWidth: 2, borderColor: '#444' },
  pttButtonRecording: { backgroundColor: '#ff3b30', shadowColor: '#ff3b30', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 },
  pttButtonLocked: { backgroundColor: '#cc0000', borderColor: '#880000' },
  pttStatusText: { color: '#ff3b30', fontWeight: 'bold', fontSize: 16, marginTop: 15 },

  sosMarkerContainer: { alignItems: 'center', justifyContent: 'center' },
  sosBadge: { backgroundColor: '#ff3b30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 2, borderColor: 'white', zIndex: 2, elevation: 5, marginBottom: -5 },
  sosBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  carIcon: { fontSize: 36 },
  taxiMarker: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  focusButton: { position: 'absolute', backgroundColor: '#d32f2f', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  focusButtonText: { color: 'white', fontWeight: 'bold' },

  chatModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.85)' },
  chatBox: { backgroundColor: '#1a1a1a', height: '70%', borderTopLeftRadius: 25, borderTopRightRadius: 25, display: 'flex' },
  chatDragHandle: { width: 40, height: 5, backgroundColor: '#555', borderRadius: 3, alignSelf: 'center', marginTop: 15, marginBottom: 5 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#333' },
  chatHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  chatCloseText: { color: '#ff3b30', fontSize: 16 },
  chatRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
  chatRowMe: { justifyContent: 'flex-end' },
  chatRowOther: { justifyContent: 'flex-start' },
  chatAvatarOther: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  chatAvatarMe: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  chatBubble: { padding: 12, borderRadius: 15 },
  chatBubbleMe: { backgroundColor: '#d32f2f', borderTopRightRadius: 4 },
  chatBubbleOther: { backgroundColor: '#2a2a2a', borderTopLeftRadius: 4 },
  chatSenderName: { fontSize: 13, color: '#ff5252', marginBottom: 4, fontWeight: 'bold' },
  chatContent: { color: '#fff', fontSize: 15 },
  chatMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  chatTime: { fontSize: 11, color: '#888' },
  chatPlayIconBtn: { marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  audioMessageContainer: { minWidth: 150, paddingVertical: 5 },
  audioMessageRow: { flexDirection: 'row', alignItems: 'center' },
  waveformBox: { flex: 1 },
  audioDurationText: { color: '#aaa', fontSize: 11, fontWeight: 'bold', marginTop: 5, alignSelf: 'flex-start' },
  onlineUsersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 },
  onlineUsersText: { color: '#888', fontSize: 12 },
  chatInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingBottom: 30, backgroundColor: '#1a1a1a', borderTopWidth: 1, borderColor: '#333' },
  chatAttachmentButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  chatInput: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 22, paddingHorizontal: 15, paddingVertical: 12, color: 'white', fontSize: 15 },
  chatSendButton: { backgroundColor: '#007aff', height: 44, paddingHorizontal: 20, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  chatSendText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

});
