// Logic dosyasını içeri aktar
import { SocketServisi } from './client.js';

// --- ELEMENTLERİ SEÇ (index.html ID'leri ile uyumlu) ---
const btnConnect = document.getElementById('btn-connect'); // Düzeldi
const btnSOS = document.getElementById('btn-sos');         // Düzeldi
const loginPanel = document.getElementById('login-panel'); // Düzeldi
const sosPanel = document.getElementById('sos-panel');     // Düzeldi
const logDiv = document.getElementById('logs');            // Düzeldi
const mapDiv = document.getElementById('map');

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
        SocketServisi.sosGonder();
        ekranaYaz("⚠️ SOS sinyali gönderildi!", "hata");
    });
}

// --- 3. DİNLEME (ALARM GELDİĞİNDE) ---
SocketServisi.alarmDinle((veri) => {
    // app.js'den gelen veri yapısı: { from: 'Ahmet', distance: 3.5 ... }
    
    const kutu = `
        <div class="alert-card">
            <strong>🚨 ACİL DURUM: ${veri.from}</strong><br>
            Mesafe: ${parseFloat(veri.distance).toFixed(2)} km ötenizde!
        </div>`;
    
    logDiv.innerHTML += kutu;

    // Titreşim
    if(navigator.vibrate) navigator.vibrate([500, 200, 500]);
            haritayiBaslat(veri.lat, veri.lon); 

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
