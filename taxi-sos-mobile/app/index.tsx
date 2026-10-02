import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, Animated, Dimensions, FlatList, Platform, LogBox, Easing, AppState, Linking } from 'react-native';

// --- Hata ve Uyarı Gizleme ---
LogBox.ignoreLogs([
  '[expo-av]', // expo-av deprecation uyarısını gizle
  'Unable to activate keep awake', // Android'de gereksiz keep-awake hatasını gizle
]);

import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { notifee, AndroidImportance } from '../lib/notifee';

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { jwtDecode } from 'jwt-decode';
import * as SplashScreen from 'expo-splash-screen';
import * as ImagePicker from 'expo-image-picker';
import { usePTT } from '../hooks/usePTT';
import PCM from 'react-native-pcm-player-lite';
import { AuthScreen } from '../components/screens/auth-screen';
import { RoomScreen } from '../components/screens/room-screen';
import { HomeScreen } from '../components/screens/home-screen';
import { SosNotification, ChatMessage } from '../types/app';
import { LEGAL_DOCUMENTS, LegalDocumentId } from '../constants/legal-documents';
import { Notifications, registerForPushNotificationsAsync } from '../lib/notifications';
import { logBreadcrumb, captureError } from '../lib/sentry';

// DİKKAT: Bu değer, usePTT.ts içindeki bufferSize: 4096 (16kHz, 16bit Mono) ile senkron olmalıdır. Değişirse ikisi birden değişmelidir!
const CHUNK_DURATION_MS = 128;

let pcmQueue: string[] = [];
let isPcmPlaying = false;
let pcmStarted = false;
let isPcmStarting = false;
let pcmInterval: ReturnType<typeof setInterval> | null = null;
let pcmStopTimer: ReturnType<typeof setTimeout> | null = null;
let serverClockOffset = 0;

const { width, height } = Dimensions.get('window');

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
  const [acceptedLegalDocs, setAcceptedLegalDocs] = useState<Partial<Record<LegalDocumentId, boolean>>>({});
  const [viewingLegalDoc, setViewingLegalDoc] = useState<LegalDocumentId | null>(null);

  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Konum izni verilmiş mi? İzin reddedilirse uygulama konumsuz çalışmaya devam eder (App Store 5.1.1(iv)).
  const [locationGranted, setLocationGranted] = useState(false);
  // Konum izni reddedildiğinde sahte/varsayılan koordinat sunucuya gönderilmez.
  const [hasLocation, setHasLocation] = useState(false);

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
  const liveDotAnim = useRef(new Animated.Value(1)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const eqAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0.4))).current;
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
    const firstNotif = sosNotifications[0];
    if (creatorUser && typeof creatorUser.lat === 'number' && typeof creatorUser.lon === 'number') {
      mapRef.current.animateToRegion({
        latitude: creatorUser.lat,
        longitude: creatorUser.lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    } else if (firstNotif && firstNotif.lat !== null && firstNotif.lon !== null) {
      mapRef.current.animateToRegion({
        latitude: firstNotif.lat,
        longitude: firstNotif.lon,
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
        if (creatorUser && typeof creatorUser.lat === 'number' && typeof creatorUser.lon === 'number') {
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

  // SOS Odası başlığındaki "canlı" noktası
  useEffect(() => {
    if (pageMode === 'room') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(liveDotAnim, { toValue: 0.35, duration: 800, useNativeDriver: true }),
          Animated.timing(liveDotAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => {
        loop.stop();
        liveDotAnim.setValue(1);
      };
    }
  }, [pageMode]);

  // Telsizde konuşurken mikrofonun nabzı ve yanındaki ses göstergesi
  useEffect(() => {
    const isTalking = !isMicMuted || pttHoldTime > 0;
    if (isTalking) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, { toValue: 1.045, duration: 600, useNativeDriver: true }),
          Animated.timing(micPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      const eqLoops = eqAnims.map((anim, i) => Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(anim, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.4, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ));
      pulseLoop.start();
      eqLoops.forEach(loop => loop.start());
      return () => {
        pulseLoop.stop();
        micPulseAnim.setValue(1);
        eqLoops.forEach(loop => loop.stop());
        eqAnims.forEach(anim => anim.setValue(0.4));
      };
    }
  }, [isMicMuted, pttHoldTime]);

  // --- KONUM İZNİ ---
  // Sistem izin diyaloğu yalnızca izin henüz sorulmadıysa gösterilir. Kullanıcı reddettiyse
  // tekrar sorulmaz ve "fikrini değiştir" uyarısı gösterilmez (App Store 5.1.1(iv)).
  const ensureLocationPermission = async (): Promise<boolean> => {
    try {
      let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      if (status === 'undetermined' && canAskAgain) {
        ({ status } = await Location.requestForegroundPermissionsAsync());
      }
      const granted = status === 'granted';
      setLocationGranted(granted);
      return granted;
    } catch (e) {
      console.log("Konum izni kontrol edilemedi:", e);
      return false;
    }
  };

  // Kullanıcı Ayarlar'dan izni değiştirip geri döndüğünde durumu güncelle (diyalog göstermeden)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState !== 'active') return;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationGranted(status === 'granted');
        if (status !== 'granted') setHasLocation(false);
      } catch { }
    });
    return () => sub.remove();
  }, []);

  // --- GERÇEK CANLI KONUM TAKİBİ ---
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startWatchingLocation = async () => {
      if (isConnected && socket && locationGranted) {
        try {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (location) => {
              const currentLat = location.coords.latitude;
              const currentLon = location.coords.longitude;

              setHasLocation(true);
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
  }, [isConnected, socket, locationGranted]);

  
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
    const missingRequiredDoc = LEGAL_DOCUMENTS.find(doc => doc.required && !acceptedLegalDocs[doc.id]);
    if (missingRequiredDoc) return Alert.alert('Uyarı', `Kayıt olmak için "${missingRequiredDoc.title}" metnini onaylamanız gerekmektedir.`);

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
        logBreadcrumb('Kayıt talebi gönderildi', 'auth', { phone });
        Alert.alert('Başarılı', 'Kayıt talebiniz alındı. Yöneticiler tarafından onaylandığında giriş yapabileceksiniz.');
      } else {
        Alert.alert('Hata', data.error || 'Kayıt başarısız.');
      }
    } catch (e) {
      captureError(e, { flow: 'register' });
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

        logBreadcrumb('Giriş başarılı', 'auth', { phone });
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
      captureError(e, { flow: 'login' });
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

    // İzinleri ve konum bilgisini al. Konum alınamazsa null kalır; sahte konum sunucuya gönderilmez.
    let currentLat: number | null = null;
    let currentLon: number | null = null;

    // --- GERÇEK İZİN VE KONUM ALMA KODU ---
    try {
      // 1. Konum izni (yalnızca daha önce sorulmadıysa sistem diyaloğu çıkar)
      const locGranted = await ensureLocationPermission();

      // 2. Ses kayıt izinlerini iste
      await Audio.requestPermissionsAsync();

      if (locGranted) {
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
            console.log("Konum bilgisine erişilirken hata oluştu, konumsuz devam edilecek:", err);
          }
        }
      }
      // İzin reddedildiyse veya konum servisi kapalıysa uyarı gösterilmez; uygulama konumsuz çalışır.
      // Konum gerektiren SOS özelliği kullanılmak istendiğinde Ayarlar bağlantısı sunulur (handleSOS).
    } catch (e) {
      console.log("Konum izin veya veri hatası:", e);
    }
    // ---------------------------------------------

    if (currentLat !== null && currentLon !== null) {
      setHasLocation(true);
      setMapRegion({
        ...mapRegion,
        latitude: currentLat,
        longitude: currentLon
      });
    } else {
      setHasLocation(false);
    }

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
      logBreadcrumb('Socket bağlandı', 'socket', { socketId: newSocket.id });

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
      logBreadcrumb('Socket koptu', 'socket', { reason });
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
            // Basit kuş uçuşu mesafe formülü (iki tarafın da konumu yoksa mesafe bilinmez)
            let distance: number | null = null;
            if (currentLat !== null && currentLon !== null && typeof sosUser.lat === 'number' && typeof sosUser.lon === 'number') {
              const latDiff = currentLat - sosUser.lat;
              const lonDiff = currentLon - sosUser.lon;
              distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111;
            }

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
      const distanceText = typeof data.distance === 'number' ? ` (${data.distance.toFixed(2)} km)` : '';
      addLog(`🚨 ACİL DURUM: ${data.from}${distanceText}`);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 ACİL YARDIM ÇAĞRISI!",
          body: `${data.from} isimli kullanıcıdan bir SOS çağrısı aldınız${distanceText}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          autoDismiss: false,
        },
        trigger: null,
      });
    });

    newSocket.on('connect_error', (error: any) => {
      console.log("Socket.io Bağlantı Hatası:", error);
      logBreadcrumb('Socket bağlantı hatası', 'socket', { message: error?.message });

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
          } catch(e) { console.log('PCM Start err:', e); captureError(e, { flow: 'ptt_pcm_start', trigger: 'channel_locked' }); }
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
          PCM.stop().catch((e: any) => { console.log('PCM Stop err:', e); captureError(e, { flow: 'ptt_pcm_stop' }); });
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
          } catch(e) { console.log('PCM Start err:', e); captureError(e, { flow: 'ptt_pcm_start', trigger: 'receive_audio_chunk' }); }
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
    // Konum yoksa: SOS'un konumsuz gideceğini bildir, Ayarlar bağlantısı sun; karar kullanıcıda.
    if (!hasLocation) {
      Alert.alert(
        "Konum Paylaşılamıyor",
        "Konum erişimi kapalı olduğu için SOS çağrınız konum bilgisi olmadan gönderilecek ve diğer şoförler sizi haritada göremeyecek. Konum erişimini Ayarlar'dan açabilirsiniz.",
        [
          { text: "Ayarlar", onPress: () => { Linking.openSettings(); } },
          { text: "Konumsuz Gönder", style: 'destructive', onPress: triggerSOS },
          { text: "İptal", style: 'cancel' },
        ]
      );
      return;
    }
    triggerSOS();
  };

  const triggerSOS = () => {
    if (!socket) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    socket.emit('sos_trigger');
    setSosActive(true);
    const room = "sos_room_" + phone;
    setActiveSOSRoom(room);
    setPageMode('room'); // Odaya otomatik geçiş
    addLog("🚨 SOS OLUŞTURULDU!");
    logBreadcrumb('SOS tetiklendi', 'sos', { room });
  };

  const joinSOSRoom = (roomName: string, fromName: string) => {
    if (!socket) return;
    socket.emit('join_sos_room', roomName);
    setActiveSOSRoom(roomName);
    setPageMode('room'); // Odaya geç
    addLog(`📞 Odaya Katıldınız: ${fromName}`);
    logBreadcrumb('SOS odasına katıldı', 'sos', { roomName });
  };

  const leaveRoom = () => {
    if (socket && activeSOSRoom) {
      socket.emit('leave_sos_room', activeSOSRoom);
    }
    logBreadcrumb('SOS odasından ayrıldı', 'sos', { roomName: activeSOSRoom });
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
    logBreadcrumb('PTT konuşma isteği gönderildi', 'ptt', { room: activeSOSRoom });

    setPttHoldTime(0);
    pttTimerRef.current = setInterval(() => {
      setPttHoldTime(prev => prev + 1);
    }, 1000);

    addLog("🎙️ Konuşma isteği gönderildi.");
  };

  const handleStopPtt = () => {
    stopPtt();
    logBreadcrumb('PTT konuşma durduruldu', 'ptt', { room: activeSOSRoom, heldSeconds: pttHoldTime });

    if (pttTimerRef.current) {
      clearInterval(pttTimerRef.current);
      pttTimerRef.current = null;
    }
    setPttHoldTime(0);

    addLog("🔇 Ses gönderimi bitti.");
  };

  // --- RENDERING VIEWS ---

  if (!isConnected || testLoading) {
    return (
      <AuthScreen
        isCheckingAuth={isCheckingAuth}
        isConnecting={isConnecting}
        testLoading={testLoading}
        cameraRef={cameraRef}
        isCameraScanning={isCameraScanning}
        setIsCameraScanning={setIsCameraScanning}
        cameraPermission={cameraPermission}
        requestCameraPermission={requestCameraPermission}
        isCardDetected={isCardDetected}
        setIsCardDetected={setIsCardDetected}
        setImageBase64={setImageBase64}
        splashLogoTranslateY={splashLogoTranslateY}
        splashLogoScale={splashLogoScale}
        splashFormOpacity={splashFormOpacity}
        authStatus={authStatus}
        setAuthStatus={setAuthStatus}
        handleLoginClick={handleLoginClick}
        name={name}
        plate={plate}
        phone={phone}
        accessToken={accessToken}
        handleConnect={handleConnect}
        authMode={authMode}
        setAuthMode={setAuthMode}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        passwordConfirm={passwordConfirm}
        setPasswordConfirm={setPasswordConfirm}
        setPhone={setPhone}
        setName={setName}
        setPlate={setPlate}
        imageBase64={imageBase64}
        pickImage={pickImage}
        acceptedLegalDocs={acceptedLegalDocs}
        setAcceptedLegalDocs={setAcceptedLegalDocs}
        viewingLegalDoc={viewingLegalDoc}
        setViewingLegalDoc={setViewingLegalDoc}
        registerUser={registerUser}
      />
    );
  }

  if (pageMode === 'room') {
    // Görünüm 2: SOS Odası (Telsiz ve Oda Haritası)
    return (
      <RoomScreen
        hasLocation={hasLocation}
        setPageMode={setPageMode}
        liveDotAnim={liveDotAnim}
        socket={socket}
        activeSOSRoom={activeSOSRoom}
        phone={phone}
        leaveRoom={leaveRoom}
        mapRef={mapRef}
        setFollowMode={setFollowMode}
        sosNotifications={sosNotifications}
        mapRegion={mapRegion}
        roomUsers={roomUsers}
        focusOnSOS={focusOnSOS}
        focusOnMe={focusOnMe}
        setShowChat={setShowChat}
        isMicMuted={isMicMuted}
        pttHoldTime={pttHoldTime}
        isChannelLocked={isChannelLocked}
        lockedBy={lockedBy}
        formatDuration={formatDuration}
        eqAnims={eqAnims}
        handleStartPtt={handleStartPtt}
        handleStopPtt={handleStopPtt}
        micPulseAnim={micPulseAnim}
        showChat={showChat}
        height={height}
        chatListRef={chatListRef}
        chatMessages={chatMessages}
        renderWaveform={renderWaveform}
        playbackProgress={playbackProgress}
        handlePlayPause={handlePlayPause}
        playingAudioId={playingAudioId}
        inputText={inputText}
        setInputText={setInputText}
        sendTextMessage={sendTextMessage}
      />
    );
  }

  // Görünüm 1: Ana Ekran (Home)
  return (
    <HomeScreen
      name={name}
      plate={plate}
      phone={phone}
      serverIp={serverIp}
      socket={socket}
      setIsConnected={setIsConnected}
      setName={setName}
      setPlate={setPlate}
      setPhone={setPhone}
      setAccessToken={setAccessToken}
      setAuthStatus={setAuthStatus}
      setPassword={setPassword}
      setPasswordConfirm={setPasswordConfirm}
      setIsAutoLoginTriggered={setIsAutoLoginTriggered}
      setAuthMode={setAuthMode}
      sosNotifications={sosNotifications}
      joinSOSRoom={joinSOSRoom}
      sosActive={sosActive}
      radarAnim1={radarAnim1}
      radarAnim2={radarAnim2}
      handleSOS={handleSOS}
      setPageMode={setPageMode}
      pulseAnim={pulseAnim}
      showProfileModal={showProfileModal}
      setShowProfileModal={setShowProfileModal}
      handleUpdateProfile={handleUpdateProfile}
      showOnboarding={showOnboarding}
      handleFinishOnboarding={handleFinishOnboarding}
    />
  );
}
