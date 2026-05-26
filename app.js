const express = require('express');


const app = express();
const http = require('http');
const {Server} = require('socket.io');

const port = process.env.PORT || 5000;


const server = http.createServer(app);
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

const calculateKilometers = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Dünyanın yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');    
});


io.on('connection', (socket) => {
    
    console.log('a user connected: ' + socket.id);

    socket.on('connect_sos', (data) => {
        let user = {
            id: socket.id,
            name : data.name,
            plate : data.plate || '',
            phone : data.phone || '',
            lat : data.lat,
            lon : data.lon,
            activeRoom: null
        }
        users.push(user);
        io.emit('all_users_update', users);
    });

    socket.on("location_update", (data) => {
        let user = users.find(u => u.id === data.id);

        if(user) {
            user.lat = data.lat;
            user.lon = data.lon;
            io.emit('all_users_update', users);
        }
    });

    socket.on('live_location', (data) => {
        let user = users.find(u => u.id === data.id);
        if(user) {
            user.lat = data.lat;
            user.lon = data.lon;
            io.emit('all_users_update', users);
        }
        
        users.forEach(u => {
            if(u.id != data.id) {
              

                let km = calculateKilometers(data.lat, data.lon, u.lat, u.lon); 

                if(km <= 5) {
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

    socket.on('sos_trigger', () => {

        let user = users.find(u => u.id === socket.id);

        if(!user) return;

        let lat = user.lat;
        let lon = user.lon;

        const roomName = "sos_room_" + socket.id;
        user.activeRoom = roomName;
        socket.join(roomName);
        io.emit('all_users_update', users);
        
        
        users.forEach(u => {

            let km = calculateKilometers(lat, lon, u.lat, u.lon);
            if(km <= 5 && u.id !== socket.id){
                io.to(u.id).emit('sos_alert', {
                    from: users.find(us => us.id === socket.id).name,
                    lat: lat,
                    lon: lon,
                    distance: km,
                    roomName,
                });
            }

        })

        
    });


    socket.on('end_sos', (roomName) => {
        io.emit('sos_ended', { room: roomName });
        
        users.forEach(u => {
            if(u.activeRoom === roomName) {
                u.activeRoom = null;
            }
        });
        
        io.in(roomName).socketsLeave(roomName);
        io.emit('all_users_update', users);
    });

    socket.on('join_sos_room', (room) => {
        socket.join(room);
        let user = users.find(u => u.id === socket.id);
        if(user) {
            user.activeRoom = room;
            io.emit('all_users_update', users);
        }
    });

    socket.on('leave_sos_room', (room) => {
        socket.leave(room);
        let user = users.find(u => u.id === socket.id);
        if(user && user.activeRoom === room) {
            user.activeRoom = null;
            io.emit('all_users_update', users);
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
        });
    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.id);
        users = users.filter(u => u.id !== socket.id);
        io.emit('all_users_update', users);
    });

} );

