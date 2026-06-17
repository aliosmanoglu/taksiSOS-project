const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace socket.id with phone for SOS room logic
content = content.replace(/activeSOSRoom === "sos_room_" \+ socket\.id/g, 'activeSOSRoom === "sos_room_" + phone');
content = content.replace(/"sos_room_" \+ u\.id === activeSOSRoom/g, '"sos_room_" + u.phone === activeSOSRoom');
content = content.replace(/const room = "sos_room_" \+ socket\.id;/g, 'const room = "sos_room_" + phone;');
content = content.replace(/activeSOSRoom === "sos_room_" \+ u\.id/g, 'activeSOSRoom === "sos_room_" + u.phone');

// 2. Wrap setActiveSOSRoom to save to AsyncStorage
// We will replace setActiveSOSRoom(roomName) with a custom hook or just an effect
// Since we already did:
// useEffect(() => {
//   if (activeSOSRoom) AsyncStorage.setItem('activeSOSRoom', activeSOSRoom);
//   else AsyncStorage.removeItem('activeSOSRoom');
// }, [activeSOSRoom]);
// Let's inject this effect right after `const [activeSOSRoom, setActiveSOSRoom] = useState<string | null>(null);`

content = content.replace(
  `const [activeSOSRoom, setActiveSOSRoom] = useState<string | null>(null); // Hangi odadayım?`,
  `const [activeSOSRoom, setActiveSOSRoom] = useState<string | null>(null); // Hangi odadayım?

  useEffect(() => {
    if (activeSOSRoom) {
      AsyncStorage.setItem('activeSOSRoom', activeSOSRoom).catch(() => {});
    } else {
      AsyncStorage.removeItem('activeSOSRoom').catch(() => {});
    }
  }, [activeSOSRoom]);`
);

// 3. expo-notifications listener
// Inject inside App component, maybe near useEffect
content = content.replace(
  `export default function App() {`,
  `export default function App() {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data.roomName &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const roomName = lastNotificationResponse.notification.request.content.data.roomName;
      setActiveSOSRoom(roomName);
      setPageMode('room');
    }
  }, [lastNotificationResponse]);`
);

// 4. In loadCredentials, load activeSOSRoom
content = content.replace(
  `const data = JSON.parse(storedData);`,
  `const data = JSON.parse(storedData);
          const storedRoom = await AsyncStorage.getItem('activeSOSRoom');
          if (storedRoom) {
            setActiveSOSRoom(storedRoom);
            setPageMode('room');
            if (storedRoom === "sos_room_" + data.phone) {
              setSosActive(true);
            }
          }`
);

// 5. In handleConnect, automatically join the active room if it exists
// Find: newSocket.emit('connect_sos', { ... });
// Add join logic
content = content.replace(
  `newSocket.emit('connect_sos', {
        name: name,
        plate: plate,
        phone: phone,
        lat: currentLat,
        lon: currentLon,
        pushToken: pushToken
      });`,
  `newSocket.emit('connect_sos', {
        name: name,
        plate: plate,
        phone: phone,
        lat: currentLat,
        lon: currentLon,
        pushToken: pushToken
      });

      AsyncStorage.getItem('activeSOSRoom').then(storedRoom => {
        if (storedRoom) {
           newSocket.emit('join_sos_room', storedRoom);
        }
      }).catch(()=>{});`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch applied successfully.');
