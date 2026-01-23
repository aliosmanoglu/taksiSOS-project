const socket = io();


export const SocketServisi = {

    girisYap: (data) => {
        socket.emit("connect_sos", data);
    },

    sosGonder: () => {
        socket.emit("sos_trigger");
    },

    alarmDinle: (func) => {
        socket.on("sos_alert", (data) => {
            func(data);
        }); 
    }   

}
