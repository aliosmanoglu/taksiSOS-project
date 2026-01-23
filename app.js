const express = require('express');


const app = express();
const http = require('http');
const {Server} = require('socket.io');

const port = process.env.PORT || 3000;


const server = http.createServer(app);
const io = new Server(server);

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
    return R * c; // Sonuç km döner
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
            lat : data.lat,
            lon : data.lon
        }
        users.push(user);
    });

    socket.on('live_location', (data) => {
        
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

        users.forEach(u => {
            let km = calculateKilometers(lat, lon, u.lat, u.lon);

            if(km <= 5 && u.id !== socket.id){
                io.to(u.id).emit('sos_alert', {
                    from: users.find(us => us.id === socket.id).name,
                    lat: lat,
                    lon: lon,
                    distance: km
                });
            }

        })
    });

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.id);
        users = users.filter(u => u.id !== socket.id);
    });

} );

