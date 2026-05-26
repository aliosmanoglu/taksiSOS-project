const socket = io();

let aktifSosOdasi = null;
let mediaRecorder;
let audioChunks = [];
let takipInterval = null;



export const SocketServisi = {
    getSocketId: () => socket.id,
    getAktifOda: () => aktifSosOdasi,

    girisYap: (data) => {
        socket.emit("connect_sos", data);

        if (takipInterval) clearInterval(takipInterval);

        // Test amaçlı simülasyon değişkenleri
        let latInput = document.getElementById('lat');
        let lonInput = document.getElementById('lon');
        
        let simLat = latInput && latInput.value ? parseFloat(latInput.value) : 41.0082;
        let simLon = lonInput && lonInput.value ? parseFloat(lonInput.value) : 28.9784;

        takipInterval = setInterval(() => {
            if (simLat !== null && simLon !== null) {
                // Her 3 saniyede yaklaşık 5 metre (~0.000045 derece) ileri (Kuzey-Doğu)
                simLat += 0.000045;
                simLon += 0.000045;

                socket.emit("live_location", {
                    id: socket.id,
                    lat: simLat,
                    lon: simLon
                });

                console.log("TEST KONUMU (Hareketli) : ", simLat, simLon);
            }
        }, 3000);
    },

    sosGonder: () => {
        socket.emit("sos_trigger");
        aktifSosOdasi = "sos_room_" + socket.id;
    },

    sosBitir: () => {
        if(aktifSosOdasi) {
            socket.emit("end_sos", aktifSosOdasi);
        }
    },

    odayaKatil: (oda) => {
        console.log("ODA KATIL KONTROL");


        if (oda) {
            aktifSosOdasi = oda;

            socket.emit("join_sos_room", aktifSosOdasi);
        }
    },

    sesKaydiBaslat: async () => {
        if (!navigator.mediaDevices) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = []; // Diziyi sıfırla
        
        const startTime = Date.now(); // Kayıt başlama zamanı

        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

        mediaRecorder.onstop = () => {
            const duration = Date.now() - startTime; // Milisaniye cinsinden süre
            // Kodek (codecs=opus) eklemek ses kalitesini ve uyumluluğu artırır
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });

            if (aktifSosOdasi) {
                console.log("Ses gönderiliyor, Oda:", aktifSosOdasi);

                // BLOB'U BASE64 FORMATINA CEVIR (React Native ile uyumlu olmasi icin)
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result;
                    socket.emit('voice_message', {
                        room: aktifSosOdasi,
                        audio: base64data,
                        duration: duration
                    });
                };

            } else {
                console.error("Hata: Aktif oda yok, ses gönderilemedi.");
            }
        };

        mediaRecorder.start();

    },

    sesKayitDurdur: () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();

        }
    },

    alarmDinle: (func) => {
        socket.on("sos_alert", (data) => {
            func(data);
        });
    },

    sosBittiDinle: (func) => {
        socket.on("sos_ended", func);
    },

    konumDinle: (func) => {
        socket.on("location_update", (data) => {
            func(data);
        });
    },
    
    tumKullanicilariDinle: (func) => {
        socket.on("all_users_update", func);
    },
    
    sesDinle: (callback) => {
        socket.on('play_voice', (payload) => {
            console.log("🔊 Ses paketi geldi, çalınıyor...");

            const base64data = typeof payload === 'string' ? payload : payload.audio;
            const senderName = (typeof payload === 'object' && payload.senderName) ? payload.senderName : "BİRİSİ";

            const pttBtn = document.getElementById('btn-ptt');
            let originalColor = '';
            let originalHTML = '';

            if (pttBtn) {
                originalColor = pttBtn.style.backgroundColor;
                originalHTML = pttBtn.innerHTML;

                pttBtn.style.backgroundColor = '#28a745';
                pttBtn.style.borderColor = '#1e7e34';
                pttBtn.innerHTML = `🔊 ${senderName.toUpperCase()} KONUŞUYOR...`;
                pttBtn.disabled = true;
            }

            try {
                const audio = new Audio(base64data);

                audio.play()
                    .then(() => {
                        console.log("Ses çalınıyor.");
                        audio.onended = () => {
                            if (pttBtn) {
                                pttBtn.style.backgroundColor = originalColor;
                                pttBtn.style.borderColor = '#555';
                                pttBtn.innerHTML = originalHTML;
                                pttBtn.disabled = false;
                            }
                            if (callback) callback();
                        };
                    })
                    .catch(e => {
                        console.error("Ses çalma hatası :", e);
                        if (pttBtn) {
                            pttBtn.style.backgroundColor = originalColor;
                            pttBtn.style.borderColor = '#555';
                            pttBtn.innerHTML = originalHTML;
                            pttBtn.disabled = false;
                        }
                    });

            } catch (err) {
                console.error("Ses işleme hatası:", err);
                if (pttBtn) {
                    pttBtn.style.backgroundColor = originalColor;
                    pttBtn.style.borderColor = '#555';
                    pttBtn.innerHTML = originalHTML;
                    pttBtn.disabled = false;
                }
            }
        });
    }

}
