import { useEffect, useRef, useState } from 'react';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices, MediaStream } from 'react-native-webrtc';
import { Socket } from 'socket.io-client';

export const useWebRTC = (socket: Socket | null, activeSOSRoom: string | null) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    const initStream = async () => {
      try {
        stream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        // Mute initially
        stream.getAudioTracks().forEach(track => (track.enabled = false));
        setLocalStream(stream);
      } catch (err) {
        console.error('getUserMedia err', err);
      }
    };
    initStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!socket || !activeSOSRoom) return;

    const createPeerConnection = (targetId: string) => {
      if (peerConnections.current[targetId]) return peerConnections.current[targetId];

      const pc = new RTCPeerConnection(iceServers);
      peerConnections.current[targetId] = pc;

      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc_ice_candidate', {
            targetId,
            candidate: event.candidate,
            room: activeSOSRoom,
          });
        }
      };

      return pc;
    };

    socket.on('webrtc_offer', async (data) => {
      const { offer, senderId } = data;
      const pc = createPeerConnection(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', {
        targetId: senderId,
        answer,
        room: activeSOSRoom,
      });
    });

    socket.on('webrtc_answer', async (data) => {
      const { answer, senderId } = data;
      const pc = peerConnections.current[senderId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc_ice_candidate', async (data) => {
      const { candidate, senderId } = data;
      const pc = peerConnections.current[senderId];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
    };
  }, [socket, activeSOSRoom, localStream]);

  // Yeni bir kullanıcı katıldığında ona Offer gönderme fonksiyonu (Mesh)
  const connectToNewUser = async (targetId: string) => {
    if (!socket || !activeSOSRoom) return;
    const pc = peerConnections.current[targetId];
    if (!pc) return; // createPeerConnection should be called before this
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);
    socket.emit('webrtc_offer', {
      targetId,
      offer,
      room: activeSOSRoom,
    });
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  return { localStream, isMicMuted, toggleMic, peerConnections, connectToNewUser };
};
