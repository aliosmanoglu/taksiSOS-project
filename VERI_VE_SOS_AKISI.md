# TaksiSOS Veri Akışı ve SOS Süreci

Bu doküman, bir kullanıcının sisteme kayıt olmasından SOS butonuna basmasına kadar olan süreçte hangi verilerin nerede saklandığını ve arka planda hangi işlemlerin gerçekleştiğini detaylandırmaktadır.

## 1. Kayıt Olma (Registration) Aşamasında Saklanan Veriler

Kullanıcı `/api/register` uç noktasına (endpoint) kayıt bilgilerini gönderdiğinde veriler iki farklı Firebase servisinde saklanır:

### A. Firebase Storage (Görseller)
Sürücüye ait kimlik/ehliyet görseli (Base64 formatından dönüştürülerek) buluta yüklenir.
- **Yol/Klasör:** `driver_cards/{telefon_numarasi}_{zaman_damgasi}.jpg`
- Yükleme sonrası dosya herkese açık (public) hale getirilerek admin panelinden görüntülenebilmesi için bir URL (idCardUrl) oluşturulur.

### B. Firebase Firestore (Veritabanı)
Görsel yüklendikten sonra kullanıcının metin verileri `users` koleksiyonunda saklanır.
- **Doküman Kimliği (Document ID):** Kullanıcının telefon numarası (boşluksuz).
- **Saklanan Alanlar:**
  - `name`: Ad Soyad
  - `phone`: Telefon Numarası
  - `plate`: Taksi Plakası
  - `password`: Güvenlik için `bcrypt` ile şifrelenmiş (hash) parola
  - `pushToken`: Expo Push Notification jetonu (cihaza bildirim gönderebilmek için)
  - `idCardUrl`: Storage'a yüklenen görselin URL'si
  - `status`: Başlangıçta `'pending'` (admin onayını bekliyor)
  - `tokenVersion`: Oturum yönetimi için JWT versiyonu (Varsayılan: 1)
  - `createdAt`: Kayıt tarihi (zaman damgası)

## 2. Uygulamaya Bağlanma (Socket Connection) Aşamasında Saklanan Veriler

Kullanıcı uygulamaya giriş yapıp Socket bağlantısı kurduğunda (`connect_sos` olayı), Node.js sunucusunun belleğinde (RAM) geçici olarak bazı veriler tutulur. Sunucu çökerse veya yeniden başlarsa bu veriler sıfırlanır.

- **`users` Dizisi:** Anlık olarak uygulaması açık ve aktif olan tüm kullanıcıları barındırır.
  - Saklananlar: `id` (Socket ID), `uid` (Firebase Auth ID), `name`, `plate`, `phone`, `lat` (Enlem), `lon` (Boylam), `pushToken`, `activeRoom` (Varsa aktif SOS odası)
- **`registeredDevices` Dizisi:** Uygulamayı arka plana atan veya kapatan cihazlara Push bildirim gönderebilmek için son bilinen konumları ve cihaz jetonlarını saklar.

## 3. SOS Butonuna Basıldığında Arka Planda Neler Oluyor?

Kullanıcı uygulamadan **SOS** butonuna bastığında sunucuya `sos_trigger` sinyali gönderilir. Bu aşamada sunucu şu işlemleri sırasıyla gerçekleştirir:

### Adım 1: Kullanıcının Tespiti ve Oda (Room) Oluşturulması
- Sunucu `users` dizisinden SOS sinyalini gönderen kişiyi Socket ID'sine göre bulur.
- Olayı yalıtmak için kişiye özel benzersiz bir oda oluşturulur: `sos_room_{telefon_numarasi}`.
- Kullanıcı otomatik olarak bu odaya alınır (`socket.join`) ve `activeRoom` değişkeni güncellenir.

### Adım 2: SOS Arşivinin Başlatılması
Acil durum sona erdikten sonra raporlama yapabilmek için sunucu belleğindeki `activeArchives` objesine yeni bir kayıt açılır.
- **Arşivlenen Veriler:** Oda adı, Başlangıç zamanı, Yardım isteyen kişinin profili (`creator`), Yardıma gelenlerin listesi (`helpers`), Yazışmalar/Sesli Mesajlar (`messages`) ve Olaydaki kişilerin saniye saniye konum geçmişi (`locationHistory`).

### Adım 3: Çevredeki Aktif Kullanıcılara Anlık Bildirim (Socket)
- Sunucu `users` dizisini döngüye alarak SOS sahibinin konumu ile diğer aktif kullanıcıların konumu arasındaki mesafeyi (`calculateKilometers`) ölçer.
- Sadece uygulaması o an AÇIK olan diğer taksicilere `sos_alert` sinyali ve mesafe bilgisi anlık olarak iletilir.

### Adım 4: Arka Plandaki Kullanıcılara Push Bildirim Gönderimi
- Uygulaması arka planda olan cihazlara ulaşmak için `registeredDevices` dizisi taranır.
- Mesafe hesaplaması tekrar yapılır ve Expo Push API kullanılarak Apple (APNs) veya Google (FCM) sunucularına şu başlıkla bildirim gönderilir:
  > *"🚨 ACİL YARDIM ÇAĞRISI! {Kullanıcı Adı} isimli kullanıcıdan bir SOS çağrısı aldınız (X km)"*

### Adım 5: Yardıma Katılma (Join SOS)
- Çevredeki bir kullanıcı gelen bildirime tıklayıp yardıma gitmek istediğinde `join_sos` sinyali gönderir ve `sos_room_{telefon_numarasi}` odasına katılır. 
- Bu odaya giren herkes birbirinin canlı konumunu, yazılı ve PTT (Push-to-Talk) sesli mesajlarını anlık olarak görmeye başlar. Odadaki her hareket (konum, mesaj) `activeArchives` içerisine kaydedilir.
