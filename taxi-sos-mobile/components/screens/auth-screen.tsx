import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../../app/index.styles';
import { AuthField } from '../auth-field';
import { LegalDocumentModal } from '../legal-document-modal';
import { LEGAL_DOCUMENTS, LegalDocumentId, getLegalDocument } from '../../constants/legal-documents';

type CameraPermissionResponse = ReturnType<typeof useCameraPermissions>[0];
type RequestCameraPermission = ReturnType<typeof useCameraPermissions>[1];

type AuthScreenProps = {
  isCheckingAuth: boolean;
  isConnecting: boolean;
  testLoading: boolean;

  cameraRef: React.RefObject<any>;
  isCameraScanning: boolean;
  setIsCameraScanning: (v: boolean) => void;
  cameraPermission: CameraPermissionResponse;
  requestCameraPermission: RequestCameraPermission;
  isCardDetected: boolean;
  setIsCardDetected: (v: boolean) => void;
  setImageBase64: (v: string | null) => void;

  splashLogoTranslateY: Animated.Value;
  splashLogoScale: Animated.Value;
  splashFormOpacity: Animated.Value;

  authStatus: string | null;
  setAuthStatus: (v: string | null) => void;
  handleLoginClick: () => void;
  name: string;
  plate: string;
  phone: string;
  accessToken: string | null;
  handleConnect: (connectName?: string, connectPlate?: string, connectPhone?: string, currentToken?: string | null) => void;

  authMode: 'login' | 'register';
  setAuthMode: (v: 'login' | 'register') => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  passwordConfirm: string;
  setPasswordConfirm: (v: string) => void;
  setPhone: (v: string) => void;
  setName: (v: string) => void;
  setPlate: (v: string) => void;
  imageBase64: string | null;
  pickImage: (useCamera: boolean) => void;
  acceptedLegalDocs: Partial<Record<LegalDocumentId, boolean>>;
  setAcceptedLegalDocs: React.Dispatch<React.SetStateAction<Partial<Record<LegalDocumentId, boolean>>>>;
  viewingLegalDoc: LegalDocumentId | null;
  setViewingLegalDoc: (v: LegalDocumentId | null) => void;
  registerUser: () => void;
};

export function AuthScreen(props: AuthScreenProps) {
  const {
    isCheckingAuth, isConnecting, testLoading,
    cameraRef, isCameraScanning, setIsCameraScanning, cameraPermission, requestCameraPermission,
    isCardDetected, setIsCardDetected, setImageBase64,
    splashLogoTranslateY, splashLogoScale, splashFormOpacity,
    authStatus, setAuthStatus, handleLoginClick, name, plate, phone, accessToken, handleConnect,
    authMode, setAuthMode, password, setPassword, showPassword, setShowPassword,
    passwordConfirm, setPasswordConfirm, setPhone, setName, setPlate,
    imageBase64, pickImage, acceptedLegalDocs, setAcceptedLegalDocs, viewingLegalDoc, setViewingLegalDoc,
    registerUser,
  } = props;

  const toggleLegalDoc = (id: LegalDocumentId) => {
    setAcceptedLegalDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraScanning, cameraPermission]);

  if (isCheckingAuth || isConnecting || testLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff3b30" />
        <Text style={{ color: 'white', marginTop: 15, fontSize: 16, fontWeight: 'bold' }}>Yükleniyor...</Text>
      </View>
    );
  }

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
              source={require('../../assets/images/logo.png')}
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
                  <Text style={styles.authHeading}>Tekrar hoş geldin, devam etmek için giriş yap</Text>

                  <AuthField icon="call" value={phone} onChangeText={setPhone} placeholder="Telefon Numarası" keyboardType="phone-pad" />
                  <AuthField
                    icon="lock-outline"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Şifre"
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? "visibility-off" : "visibility"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                  />

                  <TouchableOpacity style={[styles.connectButton, isConnecting && { opacity: 0.7 }]} onPress={handleLoginClick} disabled={isConnecting}>
                    {isConnecting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.connectButtonText}>Giriş Yap</Text>}
                  </TouchableOpacity>

                  <View style={styles.authSwitchRow}>
                    <Text style={styles.authSwitchText}>
                      Hesabın yok mu?{' '}
                      <Text style={styles.authSwitchAction} onPress={() => setAuthMode('register')}>Kayıt Ol</Text>
                    </Text>
                  </View>
                </>
              )}

              {(authStatus === null || authStatus === 'not_found') && authMode === 'register' && (
                <>
                  <Text style={styles.authHeading}>Aramıza katıl, birkaç bilgiyle şoför hesabını oluştur</Text>

                  <AuthField icon="person-outline" value={name} onChangeText={setName} placeholder="İsim Soyisim" />
                  <AuthField icon="call" value={phone} onChangeText={setPhone} placeholder="Telefon Numarası" keyboardType="phone-pad" />
                  <AuthField icon="directions-car" value={plate} onChangeText={setPlate} placeholder="Plaka (örn: 34XYZ99)" autoCapitalize="characters" />
                  <AuthField
                    icon="lock-outline"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Şifre Belirleyin"
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? "visibility-off" : "visibility"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                  />
                  <AuthField icon="lock-outline" value={passwordConfirm} onChangeText={setPasswordConfirm} placeholder="Şifreyi Tekrar Girin" secureTextEntry={!showPassword} />

                  <View style={styles.uploadZone}>
                      <Text style={styles.uploadHintText}>Lütfen Şoför Tanıtım Kartınızı yükleyin.</Text>
                      {imageBase64 ? (
                         <View style={styles.uploadPreviewWrap}>
                           <Image source={{ uri: 'data:image/jpeg;base64,' + imageBase64 }} style={{ width: '100%', height: 150 }} resizeMode="cover" />
                           <View style={styles.uploadCheckBadge}>
                             <MaterialIcons name="check" size={14} color="#0a0a0a" />
                           </View>
                         </View>
                      ) : null}
                      <View style={styles.uploadRow}>
                         <TouchableOpacity style={styles.uploadBtn} onPress={async () => {
                            if (!cameraPermission?.granted) await requestCameraPermission();
                            setIsCameraScanning(true);
                         }}>
                            <MaterialIcons name="camera-alt" size={22} color="#fff" />
                            <Text style={styles.uploadBtnText}>Kamera</Text>
                         </TouchableOpacity>
                         <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(false)}>
                            <MaterialIcons name="photo-library" size={22} color="#fff" />
                            <Text style={styles.uploadBtnText}>Galeri</Text>
                         </TouchableOpacity>
                      </View>
                  </View>

                  {/* Legal Checkboxes */}
                  {LEGAL_DOCUMENTS.filter(doc => doc.id !== 'ticari-ileti-onayi').map(doc => (
                    <View key={doc.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                       <TouchableOpacity onPress={() => toggleLegalDoc(doc.id)} style={{ marginRight: 10 }}>
                          <MaterialIcons name={acceptedLegalDocs[doc.id] ? "check-box" : "check-box-outline-blank"} size={24} color="#ff3b30" />
                       </TouchableOpacity>
                       <Text style={{ color: '#ccc', flex: 1, fontSize: 13 }}>
                          <Text style={{ color: '#58a6ff', textDecorationLine: 'underline' }} onPress={() => setViewingLegalDoc(doc.id)}>{doc.title}</Text>'ni okudum{doc.required ? ' ve kabul ediyorum' : ', anladım'}.
                          {!doc.required && <Text style={{ color: '#888', fontStyle: 'italic' }}> (İsteğe bağlı)</Text>}
                       </Text>
                    </View>
                  ))}

                  <TouchableOpacity style={[styles.connectButton, styles.connectButtonRed, isConnecting && { opacity: 0.7 }]} onPress={registerUser} disabled={isConnecting}>
                    {isConnecting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.connectButtonText}>Kayıt Ol</Text>}
                  </TouchableOpacity>

                  <View style={styles.authSwitchRow}>
                    <Text style={styles.authSwitchText}>
                      Zaten hesabın var mı?{' '}
                      <Text style={styles.authSwitchAction} onPress={() => setAuthMode('login')}>Giriş Yap</Text>
                    </Text>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </View>
      </ScrollView>
      <LegalDocumentModal
        document={viewingLegalDoc ? getLegalDocument(viewingLegalDoc) : null}
        onClose={() => setViewingLegalDoc(null)}
      />
    </KeyboardAvoidingView>
  );
}
