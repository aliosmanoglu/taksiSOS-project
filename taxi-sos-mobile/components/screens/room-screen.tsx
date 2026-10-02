import React from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Socket } from 'socket.io-client';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../../app/index.styles';
import { ChatMessage, SosNotification } from '../../types/app';

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type RoomScreenProps = {
  setPageMode: (mode: 'home' | 'room') => void;
  liveDotAnim: Animated.Value;
  socket: Socket | null;
  activeSOSRoom: string | null;
  phone: string;
  leaveRoom: () => void;
  mapRef: React.RefObject<MapView | null>;
  setFollowMode: (mode: 'none' | 'me' | 'sos') => void;
  sosNotifications: SosNotification[];
  mapRegion: MapRegion;
  hasLocation: boolean;
  roomUsers: any[];
  focusOnSOS: () => void;
  focusOnMe: () => void;
  setShowChat: (v: boolean) => void;

  isMicMuted: boolean;
  pttHoldTime: number;
  isChannelLocked: boolean;
  lockedBy: string | null;
  formatDuration: (millis?: number) => string;
  eqAnims: Animated.Value[];
  handleStartPtt: () => void;
  handleStopPtt: () => void;
  micPulseAnim: Animated.Value;

  showChat: boolean;
  height: number;
  chatListRef: React.RefObject<FlatList<ChatMessage> | null>;
  chatMessages: ChatMessage[];
  renderWaveform: (msgId: string, progress?: number) => React.ReactElement;
  playbackProgress: { [id: string]: number };
  handlePlayPause: (msgId: string) => void;
  playingAudioId: string | null;
  inputText: string;
  setInputText: (v: string) => void;
  sendTextMessage: () => void;
};

export function RoomScreen(props: RoomScreenProps) {
  const {
    setPageMode, liveDotAnim, socket, activeSOSRoom, phone, leaveRoom,
    mapRef, setFollowMode, sosNotifications, mapRegion, hasLocation, roomUsers, focusOnSOS, focusOnMe, setShowChat,
    isMicMuted, pttHoldTime, isChannelLocked, lockedBy, formatDuration, eqAnims, handleStartPtt, handleStopPtt, micPulseAnim,
    showChat, height, chatListRef, chatMessages, renderWaveform, playbackProgress, handlePlayPause, playingAudioId,
    inputText, setInputText, sendTextMessage,
  } = props;

  return (
    <View style={styles.roomContainer}>
      <View style={styles.roomHeader}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setPageMode('home')}>
          <MaterialIcons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.roomTitleWrap}>
          <Animated.View style={[styles.liveDot, { opacity: liveDotAnim }]} />
          <Text style={styles.roomTitle} numberOfLines={1}>ACİL DURUM ODASI</Text>
        </View>
        {socket && activeSOSRoom === "sos_room_" + phone ? (
          <TouchableOpacity style={styles.endButton} onPress={() => {
            Alert.alert(
              "Emin misiniz?",
              "SOS çağrısını bitirmek istediğinize emin misiniz? Bu işlem odayı herkes için kapatacaktır.",
              [
                { text: "İptal", style: "cancel" },
                { text: "Evet, Bitir", style: "destructive", onPress: () => socket.emit('end_sos', activeSOSRoom) }
              ]
            );
          }}>
            <MaterialIcons name="stop" size={14} color="#fff" />
            <Text style={styles.endButtonText}>SOS BİTİR</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.endButton} onPress={leaveRoom}>
            <MaterialIcons name="logout" size={14} color="#fff" />
            <Text style={styles.endButtonText}>Çıkış Yap</Text>
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
            latitude: sosNotifications[0]?.lat ?? mapRegion.latitude,
            longitude: sosNotifications[0]?.lon ?? mapRegion.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {!hasLocation ? null : socket && activeSOSRoom === "sos_room_" + phone ? (
            <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} title="Siz (SOS)">
              <View style={styles.sosMarkerContainer}>
                <View style={styles.sosMarkerRing} />
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
            // Konum izni vermeyen kullanıcıların koordinatı yoktur
            if (typeof u.lat !== 'number' || typeof u.lon !== 'number') return null;

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
                    <View style={styles.sosMarkerRing} />
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

        <View style={styles.occupancyChip}>
          <View style={styles.occupancyDot} />
          <Text style={styles.occupancyChipText}>{roomUsers.length} kişi çevrimiçi</Text>
        </View>

        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControlBtn} onPress={focusOnSOS}>
            <MaterialIcons name="location-on" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlBtn} onPress={focusOnMe}>
            <MaterialIcons name="my-location" size={18} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.chatFab} onPress={() => setShowChat(true)}>
          <MaterialIcons name="chat-bubble" size={14} color="white" />
          <Text style={styles.chatFabText}>Sohbet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pttBox}>
        {activeSOSRoom ? (
          <>
            <View style={styles.pttDragHandle} />

            {(!isMicMuted || pttHoldTime > 0) && (
              <View style={styles.pttStatusRow}>
                <View style={[styles.pttStatusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.pttStatusTextNew}>Ses yayını aktif</Text>
                <Text style={styles.pttTimerText}>{formatDuration(pttHoldTime * 1000)}</Text>
              </View>
            )}

            {isChannelLocked && !!lockedBy ? (
              <View style={styles.lockChip}>
                <MaterialIcons name="lock" size={14} color="#ff3b30" />
                <Text style={styles.lockChipText}>{lockedBy} konuşuyor…</Text>
              </View>
            ) : null}

            <View style={styles.pttButtonContainer}>
              {(!isMicMuted || pttHoldTime > 0) ? (
                <View style={styles.eqRow}>
                  {eqAnims.map((anim, i) => (
                    <Animated.View key={`eq-l-${i}`} style={[styles.eqBar, { height: [14, 26, 18, 30][i], transform: [{ scaleY: anim }] }]} />
                  ))}
                </View>
              ) : <View style={styles.eqRow} />}

              <TouchableOpacity
                style={[styles.pttButton, (!isMicMuted || pttHoldTime > 0) ? styles.pttButtonRecording : styles.pttButtonInactive, isChannelLocked && styles.pttButtonLocked]}
                onPressIn={handleStartPtt}
                onPressOut={handleStopPtt}
                activeOpacity={0.8}
              >
                <Animated.View style={{ transform: [{ scale: (!isMicMuted || pttHoldTime > 0) ? micPulseAnim : 1 }] }}>
                  <MaterialIcons name="mic" size={56} color={isChannelLocked ? 'rgba(255,255,255,0.35)' : 'white'} />
                </Animated.View>
              </TouchableOpacity>

              {(!isMicMuted || pttHoldTime > 0) ? (
                <View style={styles.eqRow}>
                  {eqAnims.map((anim, i) => (
                    <Animated.View key={`eq-r-${i}`} style={[styles.eqBar, { height: [14, 26, 18, 30][i], transform: [{ scaleY: anim }] }]} />
                  ))}
                </View>
              ) : <View style={styles.eqRow} />}
            </View>
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
