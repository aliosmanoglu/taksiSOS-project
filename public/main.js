// Logic dosyasını içeri aktar
import { SocketServisi } from './client.js';

// --- ELEMENTLERİ SEÇ (index.html ID'leri ile uyumlu) ---
const btnConnect = document.getElementById('btn-connect'); // Düzeldi
const btnSOS = document.getElementById('btn-sos');         // Düzeldi
const loginPanel = document.getElementById('login-panel'); // Düzeldi
const sosPanel = document.getElementById('sos-panel');     // Düzeldi
const logDiv = document.getElementById('logs');            // Düzeldi
const mapDiv = document.getElementById('map');
const btnPTT = document.getElementById('btn-ptt');

let myMap = null;   // Harita objesi
let markerSource = null;  // OpenLayers Vektör Kaynağı

function haritayiBaslat(lat, lon) {
    // Harita kutusunu görünür yap
    mapDiv.style.display = 'block';

    // Eğer harita daha önce başlatılmamışsa başlat
    if (!myMap) {
        markerSource = new ol.source.Vector();
        const markerLayer = new ol.layer.Vector({
            source: markerSource
        });

        myMap = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({ source: new ol.source.OSM() }),
                markerLayer
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([lon, lat]),
                zoom: 15
            })
        });

        // İğneyi ekle
        const feature = new ol.Feature({ geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])) });
        feature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({color: 'red'}),
                stroke: new ol.style.Stroke({color: 'white', width: 2})
            })
        }));
        markerSource.addFeature(feature);
    } 

    // OpenLayers haritası görünmezden görünüre (display:block) geçerken boyut günceller
    setTimeout(() => {
        if (myMap) {
            myMap.updateSize();
        }
    }, 100);
}


// Yardımcı Fonksiyon: Ekrana yazı basma
function ekranaYaz(mesaj, tip = 'normal') {
    let renk = tip === 'hata' ? 'red' : 'green';
    logDiv.innerHTML += `<p style="color:${renk}; margin: 5px 0;">${mesaj}</p>`;
}

// --- 1. GİRİŞ BUTONU OLAYI ---
if (btnConnect) {
    btnConnect.addEventListener('click', () => {
        // HTML'den verileri al
        const nameInput = document.getElementById('name');
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon'); // HTML'de id="lon" yapmıştık

        if (!nameInput.value) {
            alert("Lütfen bir isim girin!");
            return;
        }

        const veri = {
            name: nameInput.value,
            lat: parseFloat(latInput.value),
            lon: parseFloat(lonInput.value)
        };

        // Servisi çağır
        SocketServisi.girisYap(veri);

        // Ekranı değiştir
        loginPanel.style.display = 'none';
        sosPanel.style.display = 'block';
        
        ekranaYaz(`✅ ${veri.name} olarak bağlanıldı.`);
        
        // BAĞLANIR BAĞLANMAZ HARİTAYI GÖSTER (İptal edildi, sadece SOS durumunda açılacak)
        // haritayiBaslat(veri.lat, veri.lon);
    });
}

// --- 2. SOS BUTONU OLAYI ---
if (btnSOS) {
   btnSOS.addEventListener('click', () => {
        
        // 1. SOS Başlat (Oda ID'si client.js içinde otomatik set edilir)
        SocketServisi.sosGonder(); 

        // 2. Görünümü Değiştir
        btnSOS.innerText = "SİNYAL AKTİF...";
        btnSOS.disabled = true;
        // ... (Renk değişimleri vs.) ...
        
        // 3. Telsiz Panelini Aç (Mağdur için hemen görünür)
        document.getElementById('voice-panel').style.display = 'block';
        
        // 4. Haritayı başlat
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        haritayiBaslat(parseFloat(latInput.value), parseFloat(lonInput.value));
        
        // 5. SOS Bitir butonunu göster (Kuran kişi kendisi)
        const btnEndSos = document.getElementById('btn-end-sos');
        if (btnEndSos) {
            btnEndSos.style.display = 'inline-block';
        }
    });
}

// SOS Bitir Butonuna Tıklanma Olayı
const btnEndSos = document.getElementById('btn-end-sos');
if (btnEndSos) {
    btnEndSos.addEventListener('click', () => {
        SocketServisi.sosBitir();
    });
}

SocketServisi.sosBittiDinle((data) => {
    // Oda kapandığında:
    document.getElementById('voice-panel').style.display = 'none';
    mapDiv.style.display = 'none';
    if(btnEndSos) btnEndSos.style.display = 'none';
    
    // SOS Butonunu eski haline getir
    if(btnSOS) {
        btnSOS.innerText = "S O S";
        btnSOS.disabled = false;
        // Opsiyonel olarak CSS sınıfını eski hale getirebiliriz
    }
    
    alert("ℹ️ SOS Çağrısı Sonlandırıldı.");
    ekranaYaz("ℹ️ SOS Çağrısı Sonlandırıldı.");
});

// --- 3. DİNLEME (ALARM GELDİĞİNDE) ---
SocketServisi.alarmDinle((veri) => {
    // app.js'den gelen veri yapısı: { from: 'Ahmet', distance: 3.5 ... }
  const kutu = `
        <div class="alert-card">
            <strong>🚨 ACİL DURUM: ${veri.from}</strong><br>
            Mesafe: ${parseFloat(veri.distance).toFixed(2)} km ötenizde!<br>
            
            <button onclick="window.odayiAc('${veri.roomName}')" style="
                background-color: blue; 
                color: white; 
                margin-top: 10px; 
                padding: 5px 10px; 
                border-radius: 5px; 
                cursor: pointer;">
                📞 Telsize Bağlan
            </button>
        </div>`;
    
    logDiv.innerHTML += kutu;

    // Titreşim ve Harita
    if(navigator.vibrate) navigator.vibrate([500, 200, 500]);
    if(haritayiBaslat) haritayiBaslat(veri.lat, veri.lon);

});


SocketServisi.konumDinle((veri) => {
    // Sadece merkez pan yapma iptal edilmişti, artık genel çizimi 'tumKullanicilariDinle' ile yapacağız
});

SocketServisi.tumKullanicilariDinle((users) => {
    // Aktif SOS odasında kim varsa haritada göster
    if (markerSource && myMap) {
        // İstemcinin ID'sini socket nesnesinden almamız lazım ama main.js'de doğrudan socket yok.
        // O yüzden tüm markerları temizleyelim ve odada olanları çizelim.
        markerSource.clear();
        
        const aktifOda = SocketServisi.getAktifOda();
        
        // Sadece bulunduğumuz odadaki kişileri (veya kendi odamızı kurduysak) çiz
        users.forEach(u => {
            if(u.activeRoom) {
                const isCreator = aktifOda === "sos_room_" + u.id;
                
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([u.lon, u.lat]))
                });
                
                if (isCreator) {
                    feature.setStyle(new ol.style.Style({
                        text: new ol.style.Text({
                            text: '🚗\nSOS',
                            fill: new ol.style.Fill({color: 'white'}),
                            font: 'bold 12px sans-serif',
                            backgroundFill: new ol.style.Fill({color: '#ff3b30'}),
                            backgroundStroke: new ol.style.Stroke({color: 'white', width: 2}),
                            padding: [5, 5, 5, 5]
                        })
                    }));
                } else {
                    feature.setStyle(new ol.style.Style({
                        text: new ol.style.Text({
                            text: '🚕',
                            font: '24px sans-serif'
                        })
                    }));
                }
                markerSource.addFeature(feature);
            }
        });
    }
});

// --- BAS KONUŞ MEKANİZMASI ---
if (btnPTT) {
    // Mobilde ve Masaüstünde çalışması için olaylar:
    
    // 1. Basma (Kaydı Başlat)
    btnPTT.addEventListener('mousedown', () => {
        btnPTT.style.backgroundColor = "red";
        btnPTT.innerText = "KAYDEDİLİYOR... 🔴";
        SocketServisi.sesKaydiBaslat();
    });
    btnPTT.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Sayfanın kaymasını engelle
        btnPTT.style.backgroundColor = "red";
        btnPTT.innerText = "KAYDEDİLİYOR... 🔴";
        SocketServisi.sesKaydiBaslat();
    });

    // 2. Bırakma (Kaydı Bitir ve Gönder)
    const kaydiBitir = () => {
        btnPTT.style.backgroundColor = "#333";
        btnPTT.innerText = "BAS KONUŞ (Basılı Tut) 🎙️";
        SocketServisi.sesKayitDurdur();
    };

    btnPTT.addEventListener('mouseup', kaydiBitir);
    btnPTT.addEventListener('mouseleave', kaydiBitir); // Butondan dışarı kayarsa
    btnPTT.addEventListener('touchend', kaydiBitir);
}

SocketServisi.sesDinle(() => {
    // Callback fonksiyonu: Ses çalmaya başladığında burası çalışır
    
    const voicePanel = document.getElementById('voice-panel');
    const btnPTT = document.getElementById('btn-ptt');

    if (voicePanel && btnPTT) {
        // 1. Paneli Yeşil Yap (Ses geliyor efekti)
        const eskiRenk = btnPTT.style.backgroundColor;
        btnPTT.style.backgroundColor = "#28a745"; // Yeşil
        btnPTT.innerText = "🔊 SES GELİYOR...";
        
        // 2. 3 saniye sonra eski haline döndür
        setTimeout(() => {
            btnPTT.style.backgroundColor = "#333";
            btnPTT.innerText = "BAS KONUŞ (Basılı Tut) 🎙️";
        }, 3000); // Ses klibinin ortalama süresi kadar bekle
    }
});

// Yardımcı odaya katıl butonuna basınca bu çalışır
window.odayiAc = (gelenOdaIsmi) => {
    SocketServisi.odayaKatil(gelenOdaIsmi);
    
    // Telsiz panelini (Bas Konuş Butonunu) yardımcıya da göster
    document.getElementById('voice-panel').style.display = 'block';
    
    ekranaYaz("✅ Ses kanalına katıldınız. Konuşmak için butona basılı tutun.");
};

