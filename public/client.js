const socket = io();


export const SocketServisi = {

    girisYap: (data) => {
        socket.emit("connect_sos", data);
    },

    sosGonder: () => {
        socket.emit("sos_trigger");

        let takipInterval = null;

        if(takipInterval) clearInterval(takipInterval);

        let lat = 41.0082;
        let lon = 28.9784;
        
        takipInterval = setInterval(() => {
            lat += 0.05;
            lon += 0.05;   

            socket.emit("live_location", {
                id : socket.id,
                lat: lat,
                lon: lon
            }); 
        }, 1000);
    },

    alarmDinle: (func) => {
        socket.on("sos_alert", (data) => {
            func(data);
        }); 
    },   

    konumDinle : (func) => {
        socket.on("location_update", (data) => {
            func(data);
        });
    }

}
