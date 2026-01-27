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
let marker = null;  // Kırmızı iğne

function haritayiBaslat(lat, lon) {
    // Harita kutusunu görünür yap
    mapDiv.style.display = 'block';

    // Eğer harita daha önce başlatılmamışsa başlat
    if (!myMap) {
        myMap = L.map('map').setView([lat, lon], 15); // 15 = Zoom seviyesi

        // Harita resimlerini (tiles) OpenStreetMap'ten çek
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(myMap);

        // İğneyi ekle
        marker = L.marker([lat, lon]).addTo(myMap);
        marker.bindPopup("Mağdur Burada!").openPopup();
    } 
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
    });
}

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
    
    if (marker && myMap) {
        // İğnenin yerini değiştir
        const yeniKonum = [veri.lat, veri.lon];
        marker.setLatLng(yeniKonum);
        
        // Haritayı da iğneye odakla (Pan yap)
        myMap.panTo(yeniKonum);
        
        console.log("Harita güncellendi:", yeniKonum);
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

