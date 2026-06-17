const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Imports
if(!code.includes('firebase-admin/firestore')) {
    code = code.replace(
      "const { getAuth } = require('firebase-admin/auth');",
      "const { getAuth } = require('firebase-admin/auth');\nconst { getFirestore } = require('firebase-admin/firestore');\nconst cors = require('cors');"
    );
}

// 2. Setup DB and Express Route
if(!code.includes('let activeArchives')) {
    code = code.replace(
      "const server = http.createServer(app);",
      "const server = http.createServer(app);\nconst db = getFirestore();\n\napp.use(cors());\napp.use(express.json());\n\nlet activeArchives = {};\n\napp.get('/api/sos-archives', async (req, res) => {\n    try {\n        const snapshot = await db.collection('sos_archives').orderBy('startTime', 'desc').get();\n        let archives = [];\n        snapshot.forEach(doc => archives.push({ id: doc.id, ...doc.data() }));\n        res.json(archives);\n    } catch (e) {\n        res.status(500).json({ error: e.message });\n    }\n});\n"
    );
}

// 3. SOS Trigger
const triggerTarget = `        socket.join(roomName);
        io.emit('all_users_update', users);`;
const triggerReplacement = `        socket.join(roomName);
        io.emit('all_users_update', users);

        // Start Archive
        activeArchives[roomName] = {
            id: roomName + "_" + Date.now(),
            startTime: Date.now(),
            creator: { name: user.name, phone: user.phone, plate: user.plate },
            helpers: [],
            messages: [],
            location: { lat: lat, lon: lon }
        };`;
if(!code.includes('activeArchives[roomName] = {')) {
    code = code.replace(triggerTarget, triggerReplacement);
}

// 4. Join Room
const joinTarget = `            user.activeRoom = room;
            io.emit('all_users_update', users);
        }`;
const joinReplacement = `            user.activeRoom = room;
            io.emit('all_users_update', users);
            
            if (activeArchives[room] && room !== "sos_room_" + user.phone) {
                let existing = activeArchives[room].helpers.find(h => h.phone === user.phone);
                if (!existing) {
                    activeArchives[room].helpers.push({ name: user.name, phone: user.phone, plate: user.plate });
                }
            }
        }`;
if(!code.includes('activeArchives[room].helpers.push')) {
    code = code.replace(joinTarget, joinReplacement);
}

// 5. Voice Message
const voiceTarget = `            io.in(data.room).emit('chat_message', {
                id: msgId,
                type: 'audio',
                content: data.audio,
                senderName: senderName,
                senderId: socket.id,
                timestamp: Date.now(),
                duration: data.duration
            });`;
const voiceReplacement = voiceTarget + `
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
            }`;
if(code.includes(voiceTarget) && !code.includes("activeArchives[data.room].messages.push({")) {
    code = code.replace(voiceTarget, voiceReplacement);
}

// 6. End SOS
const endTarget = `        io.in(roomName).socketsLeave(roomName);
        io.emit('all_users_update', users);`;
const endReplacement = endTarget + `

        if (activeArchives[roomName]) {
            let archiveData = activeArchives[roomName];
            archiveData.endTime = Date.now();
            db.collection('sos_archives').doc(archiveData.id).set(archiveData).catch(err => console.error("Firestore save error:", err));
            delete activeArchives[roomName];
        }`;
if(!code.includes("db.collection('sos_archives').doc")) {
    code = code.replace(endTarget, endReplacement);
}

fs.writeFileSync('app.js', code);
console.log('Firebase injected successfully');
