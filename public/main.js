// Logic dosyasını içeri aktar
import { SocketServisi } from './client.js';

// --- ELEMENTLERİ SEÇ (index.html ID'leri ile uyumlu) ---
const btnConnect = document.getElementById('btn-connect'); // Düzeldi
const btnSOS = document.getElementById('btn-sos');         // Düzeldi
const loginPanel = document.getElementById('login-panel'); // Düzeldi
const sosPanel = document.getElementById('sos-panel');     // Düzeldi
const logDiv = document.getElementById('logs');            // Düzeldi

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
});