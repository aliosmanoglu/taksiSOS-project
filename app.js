const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const cors = require('cors');
const { Expo } = require('expo-server-sdk');
const fs = require('fs');
const path = require('path');

// Geçici ses dosyaları için klasör oluştur
const tempAudioDir = path.join(__dirname, 'temp_audio');
if (!fs.existsSync(tempAudioDir)) {
    fs.mkdirSync(tempAudioDir, { recursive: true });
}

// Initialize Expo Push Client
const expo = new Expo();

// Initialize Firebase Admin SDK
let serviceAccount;
try {
    if (process.env.FIREBASE_CREDENTIALS) {
        // Eğer sunucuda (Render) environment variable olarak tanımlandıysa:
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
        // Lokal geliştirme için dosya okunur:
        serviceAccount = require('./firebase-service-account.json');
    }
    initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
} catch (error) {
    console.error("Firebase başlatılırken bir hata oluştu. Kimlik bilgileri eksik olabilir:", error);
}

const port = process.env.PORT || 5000;

const server = http.createServer(app);
const db = getFirestore();
const bucket = getStorage().bucket();

// Yeni PTT mimarisi için kilit ve akış durumları
let channelStates = {}; // Örn: { "room_id": { isChannelActive: true, activeSpeakerId: "socket_id", tempFileName: "..." } }
let writeStreams = {}; // { "socket_id": WriteStream }

app.use(cors());
app.use(express.json());

let activeArchives = {};

app.get('/api/sos-archives', async (req, res) => {
    try {
        const snapshot = await db.collection('sos_archives').orderBy('startTime', 'desc').get();
        let archives = [];
        snapshot.forEach(doc => archives.push({ id: doc.id, ...doc.data() }));
        res.json(archives);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});

app.use(express.static('public'));

let users = [

];

// Uygulamayı kapatan kişileri de hatırlamak için kalıcı (sunucu kapanana kadar) bir liste
let registeredDevices = [];

const calculateKilometers = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Dünyanın yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


io.on('connection', (socket) => {

    console.log('a user connected: ' + socket.id);

    socket.on('connect_sos', async (data) => {
        try {
            let uid = "anonymous_" + socket.id;

            // Eğer Firebase token gönderilmişse doğrula
            if (data.firebaseToken) {
                const decodedToken = await getAuth().verifyIdToken(data.firebaseToken);
                uid = decodedToken.uid;
            }

            let user = {
                id: socket.id,
                uid: uid,
                name: data.name,
                plate: data.plate || '',
                phone: data.phone || '',
                lat: data.lat,
                lon: data.lon,
                pushToken: data.pushToken || null,
                activeRoom: null
            };
            users.push(user);
            io.emit('all_users_update', users);

            // Push token varsa ve uygulamayı kapatırsa diye kalıcı listeye de ekle/güncelle
            if (data.pushToken) {
                let existingDevice = registeredDevices.find(d => d.pushToken === data.pushToken);
                if (existingDevice) {
                    existingDevice.lat = data.lat;
                    existingDevice.lon = data.lon;
                    existingDevice.name = data.name;
                } else {
                    registeredDevices.push({
                        pushToken: data.pushToken,
                        name: data.name,
                        lat: data.lat,
                        lon: data.lon
                    });
                }
            }

            // Başarılı bağlantıyı bildir
            socket.emit('connect_success');
        } catch (error) {
            console.log("Firebase yetkilendirme hatası:", error);
            socket.emit('connect_error', 'Yetkisiz giriş: Geçersiz token.');
        }
    });

    socket.on("location_update", (data) => {
        let user = users.find(u => u.id === data.id);

        if (user) {
            user.lat = data.lat;
            user.lon = data.lon;
            io.emit('all_users_update', users);

            if (user.activeRoom && activeArchives[user.activeRoom]) {
                activeArchives[user.activeRoom].locationHistory.push({
                    id: user.id,
                    name: user.name,
                    plate: user.plate,
                    lat: data.lat,
                    lon: data.lon,
                    timestamp: Date.now(),
                    isCreator: user.id === activeArchives[user.activeRoom].creator.id
                });
            }
        }
    });

    socket.on('live_location', (data) => {
        let user = users.find(u => u.id === data.id);
        if (user) {
            user.lat = data.lat;
            user.lon = data.lon;
            io.emit('all_users_update', users);

            if (user.activeRoom && activeArchives[user.activeRoom]) {
                activeArchives[user.activeRoom].locationHistory.push({
                    id: user.id,
                    name: user.name,
                    plate: user.plate,
                    lat: data.lat,
                    lon: data.lon,
                    timestamp: Date.now(),
                    isCreator: user.id === activeArchives[user.activeRoom].creator.id
                });
            }
        }

        users.forEach(u => {
            if (u.id != data.id) {


                let km = calculateKilometers(data.lat, data.lon, u.lat, u.lon);

                if (km <= 5) {
                    io.to(u.id).emit('location_update', {
                        id: data.id,
                        lat: data.lat,
                        lon: data.lon
                    });
                }
            }
        });


        socket.broadcast.emit('location_update', {
            id: socket.id,
            lat: data.lat,
            lon: data.lon
        });

    });

    socket.on('sos_trigger', async () => {

        let user = users.find(u => u.id === socket.id);

        if (!user) return;

        let lat = user.lat;
        let lon = user.lon;

        const roomName = "sos_room_" + user.phone;
        user.activeRoom = roomName;
        socket.join(roomName);
        io.emit('all_users_update', users);

        // Start Archive
        activeArchives[roomName] = {
            id: roomName + "_" + Date.now(),
            startTime: Date.now(),
            creator: { name: user.name, phone: user.phone, plate: user.plate, id: user.id },
            helpers: [],
            messages: [],
            locationHistory: [{
                id: user.id,
                name: user.name,
                plate: user.plate,
                lat: lat,
                lon: lon,
                timestamp: Date.now(),
                isCreator: true
            }],
            location: { lat: lat, lon: lon }
        };

        let pushMessages = [];

        // Sadece online olanlara soket üzerinden anlık bildirim (Uygulaması açık olanlar)
        users.forEach(u => {
            let km = calculateKilometers(lat, lon, u.lat, u.lon);
            if (km <= 5 && u.id !== socket.id) {
                io.to(u.id).emit('sos_alert', {
                    from: user.name,
                    lat: lat,
                    lon: lon,
                    distance: km,
                    roomName,
                });
            }
        });

        // Uygulaması KAPALI veya açık fark etmeksizin herkese Push Notification
        // Burada `registeredDevices` kullanıyoruz çünkü `users` dizisinden düşmüş (çıkmış) olabilirler.
        registeredDevices.forEach(device => {
            let km = calculateKilometers(lat, lon, device.lat, device.lon);
            // Kendimize push atmamak için ufak bir kontrol (aynı pushToken ise)
            if (km <= 5 && device.pushToken !== user.pushToken) {
                if (Expo.isExpoPushToken(device.pushToken)) {
                    pushMessages.push({
                        to: device.pushToken,
                        sound: 'default',
                        title: '🚨 ACİL YARDIM ÇAĞRISI!',
                        body: `${user.name} isimli kullanıcıdan bir SOS çağrısı aldınız (${km.toFixed(2)} km)`,
                        data: { roomName: roomName, lat: lat, lon: lon, type: 'sos_alert', from: user.name },
                        priority: 'high'
                    });
                }
            }
        });

        // Push bildirimlerini gönder
        if (pushMessages.length > 0) {
            let chunks = expo.chunkPushNotifications(pushMessages);
            for (let chunk of chunks) {
                try {
                    await expo.sendPushNotificationsAsync(chunk);
                } catch (error) {
                    console.error("Push Notification gönderme hatası:", error);
                }
            }
        }


    });


    socket.on('end_sos', (roomName) => {
        io.emit('sos_ended', { room: roomName });

        users.forEach(u => {
            if (u.activeRoom === roomName) {
                u.activeRoom = null;
            }
        });

        io.in(roomName).socketsLeave(roomName);
        io.emit('all_users_update', users);

        // Save archive to Firestore
        if (activeArchives[roomName]) {
            let archiveData = activeArchives[roomName];
            archiveData.endTime = Date.now();
            db.collection('sos_archives').doc(archiveData.id).set(archiveData).catch(err => console.error("Firestore save error:", err));
            delete activeArchives[roomName];
        }
    });

    socket.on('join_sos_room', (room) => {
        socket.join(room);
        let user = users.find(u => u.id === socket.id);
        if (user) {
            user.activeRoom = room;
            io.emit('all_users_update', users);

            if (activeArchives[room] && room !== "sos_room_" + user.phone) {
                let existing = activeArchives[room].helpers.find(h => h.phone === user.phone);
                if (!existing) {
                    activeArchives[room].helpers.push({ name: user.name, phone: user.phone, plate: user.plate });
                }
                activeArchives[room].locationHistory.push({
                    id: user.id,
                    name: user.name,
                    plate: user.plate,
                    lat: user.lat,
                    lon: user.lon,
                    timestamp: Date.now(),
                    isCreator: false
                });
            }
        }
    });

    socket.on('leave_sos_room', (room) => {
        socket.leave(room);
        let user = users.find(u => u.id === socket.id);
        if (user && user.activeRoom === room) {
            user.activeRoom = null;
            io.emit('all_users_update', users);
        }
    });

    socket.on('update_profile', (data) => {
        let user = users.find(u => u.id === socket.id);
        if (user) {
            user.name = data.name;
            user.plate = data.plate;
            user.phone = data.phone;
            io.emit('all_users_update', users);

            if (user.pushToken) {
                let existingDevice = registeredDevices.find(d => d.pushToken === user.pushToken);
                if (existingDevice) {
                    existingDevice.name = data.name;
                }
            }
        }
    });

    socket.on('voice_message', (data) => {
        let sender = users.find(u => u.id === socket.id);
        let senderName = sender ? sender.name : "Bir Kullanıcı";
        let msgId = Date.now().toString();

        socket.to(data.room).emit('play_voice', { audio: data.audio, senderName: senderName, id: msgId });

        io.in(data.room).emit('chat_message', {
            id: msgId,
            type: 'audio',
            content: data.audio,
            senderName: senderName,
            senderId: socket.id,
            timestamp: Date.now(),
            duration: data.duration
        });

        if (activeArchives[data.room]) {
            activeArchives[data.room].messages.push({
                id: msgId,
                type: 'audio',
                content: data.audio,
                senderName: senderName,
                senderId: socket.id,
                timestamp: Date.now(),
                duration: data.duration
            });
        }
    });

    socket.on('text_message', (data) => {
        let sender = users.find(u => u.id === socket.id);
        let senderName = sender ? sender.name : "Bir Kullanıcı";

        io.in(data.room).emit('chat_message', {
            id: Date.now().toString() + Math.random().toString(),
            type: 'text',
            content: data.text,
            senderName: senderName,
            senderId: socket.id,
            timestamp: Date.now()
        });

        if (activeArchives[data.room]) {
            activeArchives[data.room].messages.push({
                id: Date.now().toString() + Math.random().toString(),
                type: 'text',
                content: data.text,
                senderName: senderName,
                senderId: socket.id,
                timestamp: Date.now()
            });
        }
    });

    // --- NEW PTT EVENT HANDLERS ---
    socket.on('request_talk', (data) => {
        let room = data.room;
        if (!channelStates[room]) {
            channelStates[room] = { isChannelActive: false, activeSpeakerId: null, tempFileName: null };
        }

        if (channelStates[room].isChannelActive) {
            // Kanal meşgul
            socket.emit('talk_rejected', { reason: 'Channel is currently locked by another user.' });
        } else {
            // İzin ver
            channelStates[room].isChannelActive = true;
            channelStates[room].activeSpeakerId = socket.id;

            // Temp file oluştur
            const tempFileName = `temp_${room}_${socket.id}_${Date.now()}.raw`;
            const tempFilePath = path.join(tempAudioDir, tempFileName);
            channelStates[room].tempFileName = tempFilePath;
            
            writeStreams[socket.id] = fs.createWriteStream(tempFilePath, { flags: 'a' });

            // Onay gönder
            socket.emit('talk_granted');

            // Diğerlerine kanalın kilitlendiğini duyur
            let sender = users.find(u => u.id === socket.id);
            socket.to(room).emit('channel_locked', { lockedBy: sender ? sender.name : 'Bir Kullanıcı' });
        }
    });

    socket.on('audio_chunk', (data) => {
        let room = data.room;
        let chunkBase64 = data.audio; // Gelen ham base64

        if (channelStates[room] && channelStates[room].activeSpeakerId === socket.id) {
            // Base64 buffer'a çevirip diske yaz
            if (writeStreams[socket.id]) {
                const buffer = Buffer.from(chunkBase64, 'base64');
                writeStreams[socket.id].write(buffer);
            }

            // Diğer dinleyicilere stream et
            socket.to(room).emit('receive_audio_chunk', { audio: chunkBase64, senderId: socket.id });
        }
    });

    socket.on('stop_talk', async (data) => {
        let room = data.room;
        if (channelStates[room] && channelStates[room].activeSpeakerId === socket.id) {
            // Yazma işlemini bitir
            if (writeStreams[socket.id]) {
                writeStreams[socket.id].end();
                delete writeStreams[socket.id];
            }

            const tempFilePath = channelStates[room].tempFileName;
            const sender = users.find(u => u.id === socket.id);
            const senderName = sender ? sender.name : "Bir Kullanıcı";
            const msgId = Date.now().toString();

            // Kanalı serbest bırak
            channelStates[room].isChannelActive = false;
            channelStates[room].activeSpeakerId = null;
            channelStates[room].tempFileName = null;
            socket.to(room).emit('channel_released');

            // Storage Upload
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    const destination = `voice_messages/${room}/${msgId}.raw`;
                    await bucket.upload(tempFilePath, {
                        destination: destination,
                        metadata: {
                            contentType: 'audio/raw'
                        }
                    });

                    // Dosyayı public okumaya açıyoruz (veya signed url alabilirsiniz)
                    const file = bucket.file(destination);
                    await file.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

                    // Firestore'a kaydet
                    const docData = {
                        id: msgId,
                        channel_id: room,
                        sender_id: socket.id,
                        sender_name: senderName,
                        storage_url: publicUrl,
                        duration_ms: data.duration || 0,
                        created_at: new Date()
                    };
                    await db.collection('voice_messages').doc(msgId).set(docData);

                    // Arşive de ekleyelim
                    if (activeArchives[room]) {
                        activeArchives[room].messages.push({
                            id: msgId,
                            type: 'audio',
                            content: publicUrl, // artık devasa base64 değil URL gönderiyoruz
                            senderName: senderName,
                            senderId: socket.id,
                            timestamp: Date.now(),
                            duration: data.duration || 0
                        });
                    }

                    // Dinleyicilere mesajın tamamlandığını ve linkini gönder
                    io.in(room).emit('chat_message', {
                        id: msgId,
                        type: 'audio',
                        content: publicUrl, // Base64 yerine url gidiyor
                        senderName: senderName,
                        senderId: socket.id,
                        timestamp: Date.now(),
                        duration: data.duration || 0
                    });

                } catch (error) {
                    console.error("Storage upload hatası:", error);
                } finally {
                    // ÇÖP TOPLAMA (GARBAGE COLLECTION) - Render diski dolmaması için zorunlu!
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlink(tempFilePath, (err) => {
                            if (err) console.error("Temp dosya silinirken hata:", err);
                        });
                    }
                }
            }
        }
    });
    // --------------------------------

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.id);

        let user = users.find(u => u.id === socket.id);
        if (user && user.activeRoom) {
            let device = registeredDevices.find(d => d.pushToken === user.pushToken);
            if (device && device.pushToken && Expo.isExpoPushToken(device.pushToken)) {
                expo.sendPushNotificationsAsync([{
                    to: device.pushToken,
                    sound: 'default',
                    title: '🚨 DİKKAT',
                    body: 'Aktif bir SOS çağrısındayken bağlantınız koptu. Lütfen acil durum odasına geri dönün!',
                    data: { roomName: user.activeRoom, type: 'sos_alert', from: user.name, lat: user.lat, lon: user.lon },
                    priority: 'high'
                }]).catch(err => console.error("Disconnect push hatası:", err));
            }
        }

        users = users.filter(u => u.id !== socket.id);
        io.emit('all_users_update', users);
    });

});

