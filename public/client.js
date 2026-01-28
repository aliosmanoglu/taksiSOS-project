const socket = io();

let aktifSosOdasi = null;
let mediaRecorder;
let audioChunks = [];



export const SocketServisi = {

    girisYap: (data) => {
        socket.emit("connect_sos", data);
    },

    sosGonder: () => {
        socket.emit("sos_trigger");


        aktifSosOdasi = "sos_room_" + socket.id;

        let takipInterval = null;

        if(takipInterval) clearInterval(takipInterval);
        
        

        takipInterval = setInterval(() => {
            
            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition((position) => {
                    let lat = position.coords.latitude;
                    let lon = position.coords.longitude; 
                    socket.emit("live_location", {
                        id : socket.id,
                        lat: lat,
                        lon: lon
                    });     
                    
                    console.log("KONUM : ",lat,lon);
                    
                })
            }

            
        }, 1000);
    },

    odayaKatil: (oda) => {
        console.log("ODA KATIL KONTROL");
        

        if(oda) {
            aktifSosOdasi = oda;
            
            socket.emit("join_sos_room", aktifSosOdasi);
        } 
    },

    sesKaydiBaslat: async () => {
       if (!navigator.mediaDevices) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = []; // Diziyi sıfırla

        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

        mediaRecorder.onstop = () => {
            // Kodek (codecs=opus) eklemek ses kalitesini ve uyumluluğu artırır
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
            
            if (aktifSosOdasi) {
                console.log("Ses gönderiliyor, Oda:", aktifSosOdasi);
                socket.emit('voice_message', {
                    room: aktifSosOdasi, 
                    audio: audioBlob
                });
            } else {
                console.error("Hata: Aktif oda yok, ses gönderilemedi.");
            }
        };
        
        mediaRecorder.start();
    
    },

    sesKayitDurdur : () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();

        }   
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
    },
    sesDinle: (callback) => {
        socket.on('play_voice', (audioBuffer) => {
            console.log("🔊 Ses paketi geldi, işleniyor...");

            try {
                // 1. Buffer'ı Blob'a çevir
                const blob = new Blob([audioBuffer], { type: 'audio/webm;codecs=opus' });
                
                
                const audioUrl = URL.createObjectURL(blob);
                
                const audio = new Audio(audioUrl);
                
                audio.play()
                    .then(() => {
                        console.log("Ses çalınıyor.");
                        if (callback) callback(); 
                    })
                    .catch(e => {
                        console.error("Ses çalma hatası :", e);
                    });

            } catch (err) {
                console.error("Ses işleme hatası:", err);
            }
        });
    }

}
