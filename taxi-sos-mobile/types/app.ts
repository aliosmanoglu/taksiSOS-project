export type SosNotification = {
  from: string;
  distance: number | null;
  roomName: string;
  lat: number | null;
  lon: number | null;
};

export type ChatMessage = {
  id: string;
  type: 'text' | 'audio';
  content: string;
  senderName: string;
  senderId: string;
  timestamp: number;
  duration?: number;
};
