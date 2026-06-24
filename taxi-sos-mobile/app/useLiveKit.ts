import { useState, useEffect, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { AudioSession } from '@livekit/react-native';

export const useLiveKit = (serverUrl: string | null, token: string | null) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isMicMuted, setMicMuted] = useState(true);

  useEffect(() => {
    if (!serverUrl || !token) {
      if (room) {
        room.disconnect();
        setRoom(null);
      }
      return;
    }

    let isMounted = true;
    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    const connectToRoom = async () => {
      try {
        await AudioSession.startAudioSession();
        await newRoom.connect(serverUrl, token);
        
        if (isMounted) {
          setRoom(newRoom);
          // Odaya girer girmez mikrofonu kapalı tutuyoruz (Bas-Konuş için)
          await newRoom.localParticipant.setMicrophoneEnabled(false);
          setMicMuted(true);
        } else {
          newRoom.disconnect();
        }
      } catch (e) {
        console.error("LiveKit connection error:", e);
      }
    };

    connectToRoom();

    return () => {
      isMounted = false;
      newRoom.disconnect();
      AudioSession.stopAudioSession();
    };
  }, [serverUrl, token]);

  const toggleMic = useCallback(async (enabled: boolean) => {
    if (room && room.localParticipant) {
      await room.localParticipant.setMicrophoneEnabled(enabled);
      setMicMuted(!enabled);
    }
  }, [room]);

  return { room, isMicMuted, toggleMic };
};
