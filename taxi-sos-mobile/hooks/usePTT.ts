import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import LiveAudioStream from 'react-native-live-audio-stream';

export const usePTT = (socket: Socket | null, activeSOSRoom: string | null) => {
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isChannelLocked, setIsChannelLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  const isRecording = useRef(false);
  const channelLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // LiveAudioStream configuration
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 7, // 7 for VOICE_COMMUNICATION (Auto Gain Control, Echo Canceler ve Noise Suppressor aktif)
      bufferSize: 4096,
      wavFile: '' // TypeScript hatasını çözmek için boş eklendi
    };

    LiveAudioStream.init(options);

    // Cleanup
    return () => {
      LiveAudioStream.stop();
    };
  }, []);

  useEffect(() => {
    if (!socket || !activeSOSRoom) return;

    // --- Socket Listeners for PTT ---

    // Başkası kanalı aldıysa
    const handleChannelLocked = (data: { lockedBy: string }) => {
      if (channelLockTimeoutRef.current) {
        clearTimeout(channelLockTimeoutRef.current);
        channelLockTimeoutRef.current = null;
      }
      setIsChannelLocked(true);
      setLockedBy(data.lockedBy);
      // Eğer ben konuşmaya çalışıyorsam durdur
      if (isRecording.current) {
        stopPtt();
      }
    };

    // Kanal serbest kalınca
    const handleChannelReleased = () => {
      setIsChannelLocked(false);
      setLockedBy(null);
    };

    // Konuşma iznim reddedilirse
    const handleTalkRejected = (data: { reason: string }) => {
      console.log('Talk rejected:', data.reason);
      
      setIsChannelLocked(true);
      stopPtt();

      // Eğer reddedilme sebebi kanalın gerçekten dolu olmasıysa (başka biri konuşuyorsa),
      // zaten bir 'channel_locked' gelmiştir ya da gelecektir. Bu durumda timeout kurmayız.
      if (data.reason === 'ALREADY_LOCKED') {
        return;
      }

      // Farklı bir spekülatif ret durumuysa: Sunucudan channel_locked gelmemesi ihtimaline karşı 3 saniyelik otomatik kilit açma
      if (channelLockTimeoutRef.current) clearTimeout(channelLockTimeoutRef.current);
      channelLockTimeoutRef.current = setTimeout(() => {
        setIsChannelLocked(false);
        channelLockTimeoutRef.current = null;
      }, 3000);
    };

    // Konuşma iznim onaylandıysa
    const handleTalkGranted = () => {
      // Artık mikrofondan gelen base64 paketlerini yollayabilirim
      isRecording.current = true;
      setIsMicMuted(false);
      LiveAudioStream.start();
    };

    socket.on('channel_locked', handleChannelLocked);
    socket.on('channel_released', handleChannelReleased);
    socket.on('talk_rejected', handleTalkRejected);
    socket.on('talk_granted', handleTalkGranted);

    return () => {
      socket.off('channel_locked', handleChannelLocked);
      socket.off('channel_released', handleChannelReleased);
      socket.off('talk_rejected', handleTalkRejected);
      socket.off('talk_granted', handleTalkGranted);
      if (isRecording.current) {
        stopPtt();
      }
      if (channelLockTimeoutRef.current) {
        clearTimeout(channelLockTimeoutRef.current);
      }
    };
  }, [socket, activeSOSRoom]);

  const isChannelLockedRef = useRef(isChannelLocked);
  isChannelLockedRef.current = isChannelLocked;
  const socketRef = useRef(socket);
  socketRef.current = socket;
  const roomRef = useRef(activeSOSRoom);
  roomRef.current = activeSOSRoom;

  // Audio stream dinleyicisi
  useEffect(() => {
    // react-native-live-audio-stream kütüphanesinin TypeScript (.d.ts) tanımlarında 
    // .on() metodunun dönüş tipi hatalı (void) tanımlanmış. Ancak kaynak kodunda (index.js)
    // EventEmitter.addListener döndürdüğü için 'as any' cast'i eklenerek .remove() kullanabilmemiz sağlandı.
    const emitter = LiveAudioStream.on('data', (data: string) => {
      if (isRecording.current && socketRef.current && roomRef.current && !isChannelLockedRef.current) {
        socketRef.current.emit('audio_chunk', {
          room: roomRef.current,
          audio: data
        });
      }
    }) as any;

    return () => {
      if (emitter && typeof emitter.remove === 'function') {
        emitter.remove();
      }
    };
  }, []); // Sadece bir kez mount olması çok önemli, yoksa her state değişiminde yeni listener ekler!

  const requestPtt = () => {
    if (!socket || !activeSOSRoom || isChannelLocked) return;

    // Sunucudan izin iste
    socket.emit('request_talk', { room: activeSOSRoom });
  };

  const stopPtt = () => {
    if (!isRecording.current) return;

    isRecording.current = false;
    setIsMicMuted(true);
    LiveAudioStream.stop();

    if (socket && activeSOSRoom) {
      socket.emit('stop_talk', { room: activeSOSRoom, duration: 0 /* Can be calculated */ });
    }
  };

  return {
    isMicMuted,
    isChannelLocked,
    lockedBy,
    requestPtt,
    stopPtt
  };
};
