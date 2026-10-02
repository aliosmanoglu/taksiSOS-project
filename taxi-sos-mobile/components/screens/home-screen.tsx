import React, { useState } from 'react';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Socket } from 'socket.io-client';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../../app/index.styles';
import { AuthField } from '../auth-field';
import { SosNotification } from '../../types/app';

type HomeScreenProps = {
  name: string;
  plate: string;
  phone: string;
  serverIp: string;
  socket: Socket | null;
  setIsConnected: (v: boolean) => void;
  setName: (v: string) => void;
  setPlate: (v: string) => void;
  setPhone: (v: string) => void;
  setAccessToken: (v: string | null) => void;
  setAuthStatus: (v: string | null) => void;
  setPassword: (v: string) => void;
  setPasswordConfirm: (v: string) => void;
  setIsAutoLoginTriggered: (v: boolean) => void;
  setAuthMode: (v: 'login' | 'register') => void;

  sosNotifications: SosNotification[];
  joinSOSRoom: (roomName: string, fromName: string) => void;

  sosActive: boolean;
  radarAnim1: Animated.Value;
  radarAnim2: Animated.Value;
  handleSOS: () => void;
  setPageMode: (mode: 'home' | 'room') => void;
  pulseAnim: Animated.Value;

  showProfileModal: boolean;
  setShowProfileModal: (v: boolean) => void;
  handleUpdateProfile: () => void;

  showOnboarding: boolean;
  handleFinishOnboarding: () => void;
};

export function HomeScreen(props: HomeScreenProps) {
  const {
    name, plate, phone, serverIp, socket,
    setIsConnected, setName, setPlate, setPhone, setAccessToken, setAuthStatus,
    setPassword, setPasswordConfirm, setIsAutoLoginTriggered, setAuthMode,
    sosNotifications, joinSOSRoom,
    sosActive, radarAnim1, radarAnim2, handleSOS, setPageMode, pulseAnim,
    showProfileModal, setShowProfileModal, handleUpdateProfile,
    showOnboarding, handleFinishOnboarding,
  } = props;

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const resetSessionState = async () => {
    if (socket) socket.disconnect();
    setIsConnected(false);
    await SecureStore.deleteItemAsync('refreshToken');
    await AsyncStorage.removeItem('activeSOSRoom');
    setName("");
    setPlate("");
    setPhone("");
    setAccessToken(null);
    setAuthStatus(null);
    setPassword("");
    setPasswordConfirm("");
    setIsAutoLoginTriggered(false);
    setAuthMode('login');
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Uyarı', 'Hesabınızı silmek için şifrenizi girmeniz gerekir.');
      return;
    }
    setIsDeleteSubmitting(true);
    try {
      const res = await fetch(`${serverIp}/api/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: deletePassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        Alert.alert('Hata', data.error || 'Hesap silinemedi.');
        return;
      }
      setShowProfileModal(false);
      setIsDeletingAccount(false);
      setDeletePassword('');
      await resetSessionState();
      Alert.alert('Hesabınız Silindi', 'Hesabınız ve kişisel verileriniz kalıcı olarak silindi.');
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

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
                <Text style={styles.plateBadgeText}>{plate.toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={async () => {
            try {
              // Sunucu tarafında token versiyonunu artırarak çıkış yap (Token Invalidation)
              fetch(`${serverIp}/api/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
              }).catch(() => {});

              await resetSessionState();
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
            <Text style={styles.bannerSubtitle}>{notification.from}{typeof notification.distance === 'number' ? ` · ${notification.distance.toFixed(2)} km` : ''}</Text>
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
        <KeyboardAvoidingView style={styles.profileSheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1, width: '100%' }} activeOpacity={1} onPress={() => setShowProfileModal(false)} />
          <View style={styles.profileSheet}>
            <View style={styles.chatDragHandle} />
            <View style={[styles.avatarCircle, styles.profileSheetAvatar]}>
              <Text style={[styles.avatarText, { fontSize: 22 }]}>{(name || '?').trim().charAt(0).toUpperCase()}</Text>
            </View>

            <AuthField icon="person-outline" value={name} onChangeText={setName} placeholder="İsim Soyisim" />
            <AuthField icon="call" value={phone} onChangeText={setPhone} placeholder="Telefon Numarası" keyboardType="phone-pad" />
            <AuthField icon="directions-car" value={plate} onChangeText={setPlate} placeholder="Plaka (örn: 34 T 1234)" autoCapitalize="characters" />

            <View style={styles.sheetActionsRow}>
              <TouchableOpacity style={styles.ghostButton} onPress={() => setShowProfileModal(false)}>
                <Text style={styles.ghostButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.connectButton, { flex: 1, marginTop: 0 }]} onPress={handleUpdateProfile}>
                <Text style={styles.connectButtonText}>Güncelle</Text>
              </TouchableOpacity>
            </View>

            {!isDeletingAccount ? (
              <TouchableOpacity
                style={{ marginTop: 18, alignItems: 'center' }}
                onPress={() => setIsDeletingAccount(true)}
              >
                <Text style={{ color: '#ff3b30', fontWeight: '700', fontSize: 13 }}>Hesabımı Sil</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginTop: 18, width: '100%' }}>
                <Text style={{ color: '#ff3b30', fontSize: 12.5, textAlign: 'center', marginBottom: 10 }}>
                  Bu işlem geri alınamaz. Hesabınızı ve kişisel verilerinizi kalıcı olarak silmek için şifrenizi girin.
                </Text>
                <TextInput
                  style={[styles.input, { marginBottom: 10 }]}
                  placeholder="Şifreniz"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                />
                <View style={styles.sheetActionsRow}>
                  <TouchableOpacity
                    style={styles.ghostButton}
                    onPress={() => { setIsDeletingAccount(false); setDeletePassword(''); }}
                  >
                    <Text style={styles.ghostButtonText}>Vazgeç</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.connectButton, styles.connectButtonRed, { flex: 1, marginTop: 0 }, isDeleteSubmitting && { opacity: 0.7 }]}
                    onPress={handleDeleteAccount}
                    disabled={isDeleteSubmitting}
                  >
                    {isDeleteSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.connectButtonText}>Kalıcı Olarak Sil</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
