import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import LiveAudioStream from 'react-native-live-audio-stream';

export const usePTT = (socket: Socket | null, activeSOSRoom: string | null) => {
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isChannelLocked, setIsChannelLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  const isRecording = useRef(false);

  useEffect(() => {
    // LiveAudioStream configuration
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 1, // 1 for MIC
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
      setIsChannelLocked(true); // büyük ihtimalle zaten kilitlidir
      stopPtt();
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
    };
  }, [socket, activeSOSRoom]);

  // Audio stream dinleyicisi
  useEffect(() => {
    LiveAudioStream.on('data', (data: string) => {
      if (isRecording.current && socket && activeSOSRoom && !isChannelLocked) {
        socket.emit('audio_chunk', {
          room: activeSOSRoom,
          audio: data
        });
      }
    });

    return () => {
       // Listener automatically handled/cleaned by react-native-live-audio-stream if properly setup
    };
  }, [socket, activeSOSRoom, isChannelLocked]);

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
