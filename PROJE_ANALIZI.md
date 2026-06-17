# TaksiSOS Proje Analizi ve Geliştirme Önerileri

TaksiSOS, acil durumlarda kullanıcıların birbirleriyle hızlıca iletişime geçmesini sağlayan gerçek zamanlı, konum tabanlı bir yardımlaşma uygulamasıdır. Proje, Node.js, Express, Socket.io ve React Native / Expo teknolojileri üzerine inşa edilmiş. 

## 1. Mevcut Mimari Analizi

Mevcut proje yapısında bazı temel sistemler ve potansiyel darboğazlar şunlardır:

### Güçlü Yönler:
- **Gerçek Zamanlı İletişim:** `Socket.io` kullanımı, konum güncellemeleri ve sohbet odaları için doğru ve hızlı bir çözüm.
- **Odaklı Kapsam:** Sadece 5 km yarıçapındaki kişilere bildirim gitmesi ve dinamik SOS odalarının (Room) oluşturulması oldukça pratik bir acil durum senaryosu.
- **Platform Bağımsızlığı:** React Native ve Expo kullanılarak hem iOS hem Android için tek kod tabanından çözüm sunulması.

### Potansiyel Darboğazlar ve Gelişim Alanları:
> [!WARNING]
> **Ölçeklenebilirlik (Scalability):** Kullanıcı listesi (`let users = []`) sadece sunucunun RAM'inde tutuluyor. Sunucu çökerse veya yeniden başlarsa tüm veri kaybolur. Ayrıca uygulamanız büyüdüğünde ve birden fazla Node.js sunucusu çalıştırmanız gerektiğinde (Load Balancing), sunucular birbirlerinin hafızasındaki kullanıcıları göremez.

> [!WARNING]
> **Performans (O(N) Karmaşıklığı):** `app.js` içerisindeki `live_location` olayında her bir konum güncellemesi geldiğinde `users.forEach(...)` yapılarak sistemdeki *tüm* kullanıcılar ile mesafe hesaplanıyor. 10.000 aktif kullanıcınız olduğunda, tek bir kişinin adım atması 10.000 işlem yapılması demek. Bu, Node.js'in Event Loop'unu çok hızlı tıkayacaktır.

> [!CAUTION]
> **Arka Plan Bildirimleri:** `Socket.io` sadece uygulama açıkken çalışır. Bir kullanıcı uygulamayı arka plana atıp telefonunu cebine koyduğunda bağlantı kopabilir. Çevredeki 5km'lik alanda bir SOS tetiklendiğinde kapalı telefonlara bildirim gitmeyecektir.

> [!TIP]
> **Sesli Mesajlaşma:** Ses verisi şu an dosyalar/bloblar halinde `Socket.io` üzerinden yollanıyor. Acil durumlarda telsiz (walkie-talkie) gibi anında kesintisiz iletişim çok daha etkilidir.

---

## 2. Projeyi Bir Üst Seviyeye Çıkaracak Open Source GitHub Repoları

Bu projeyi amatör / MVP (Minimum Viable Product) seviyesinden çıkarıp, binlerce kişinin sorunsuz kullanabileceği "Production-Ready" (canlıya hazır) bir sisteme dönüştürmek için aşağıdaki Açık Kaynak (Open Source) kütüphaneleri projeye entegre edebilirsiniz:

### 1. Konum İşlemleri ve Ölçeklenebilirlik İçin: Redis
Mevcut RAM'deki dizi ve `forEach` döngüsü yerine Redis Geospatial veritabanı kullanılmalıdır.

*   **Repo:** [redis/node-redis](https://github.com/redis/node-redis) & [socketio/socket.io-redis-adapter](https://github.com/socketio/socket.io-redis-adapter)
*   **Ne İşe Yarar:** Redis'in `GEOADD` ve `GEORADIUS` (veya `GEOSEARCH`) komutları C diliyle yazılmış, son derece optimize edilmiş algoritmalar kullanır. Kendiniz Haversine formülü ile döngü kurmak yerine Redis'e "bana 5km çevredeki kullanıcıları bul" dersiniz ve milisaniyeler içinde sonucu alırsınız.
*   **Avantajı:** `socket.io-redis-adapter` sayesinde uygulamanız 1 sunucudan 10 sunucuya çıksa bile sorunsuz çalışır.

### 2. Arka Plan Push Bildirimleri (Push Notifications): Firebase
Uygulama kapalıyken SOS bildirimlerini ulaştırmak acil durum uygulamaları için hayatidir.

*   **Repo (Backend):** [firebase/firebase-admin-node](https://github.com/firebase/firebase-admin-node)
*   **Repo (Frontend):** [invertase/react-native-firebase](https://github.com/invertase/react-native-firebase) (Eğer expo kullanıyorsanız `expo-notifications` da alternatif olabilir ancak Firebase endüstri standardıdır).
*   **Ne İşe Yarar:** Birisi SOS başlattığında, Redis üzerinden 5km'deki cihazların Token'larını bulup onlara anlık Push Notification gönderir. Telefon sessizde bile olsa yüksek sesle alarm çaldıracak şekilde yapılandırılabilir (Critical Alerts).

### 3. Kalıcı Veri ve Geçmiş İçin: PostgreSQL & PostGIS
Acil durum kayıtları, kullanıcı profilleri ve şikayet mekanizmaları için verilerin kalıcı olması gerekir.

*   **Repo:** [postgis/postgis](https://github.com/postgis/postgis) (PostgreSQL Uzantısı) 
*   **Ne İşe Yarar:** Konum tabanlı veritabanlarında endüstri standardıdır. Olayların (SOS durumlarının) nerede, ne zaman, kimler arasında gerçekleştiğini coğrafi koordinatlarıyla kalıcı olarak saklar. İleride "Geçmişte hangi bölgelerde daha çok SOS verildi" gibi analizler (Heatmap) yapmanızı sağlar.

### 4. Gelişmiş Harita Deneyimi: Mapbox Maps
`react-native-maps` varsayılan harita deneyimi sunar, ancak acil durumlar için özel haritalar daha etkilidir.

*   **Repo:** [rnmapbox/maps](https://github.com/rnmapbox/maps)
*   **Ne İşe Yarar:** Mapbox'ın açık kaynaklı React Native eklentisi. Acil yardım isteyene giden yolun (Routing/Navigation) turn-by-turn harita üzerinde çizilmesi, sokak görünümleri ve özel "karanlık acil durum" temaları yapmanızı sağlar.

### 5. Anlık Telsiz (Walkie-Talkie) Deneyimi: LiveKit veya Mediasoup (WebRTC)
Sesli mesajların inmesini beklemek acil bir durumda vakit kaybıdır.

*   **Repo:** [livekit/client-sdk-react-native](https://github.com/livekit/client-sdk-react-native) veya [versatica/mediasoup](https://github.com/versatica/mediasoup)
*   **Ne İşe Yarar:** WebRTC teknolojisi kullanarak "bas-konuş" telsiz sistemi veya anlık VoIP sesli aramalar yapmanızı olanak tanır. Gecikme (latency) 50-100 milisaniye civarındadır.

### 6. Gelişmiş JavaScript Konum Kütüphanesi: Turf.js
Eğer uzaklık dışında coğrafi hesaplamalara ihtiyaç duyarsanız (örneğin kullanıcı belirli bir tehlikeli alan poligonunun içine girdi mi?).

*   **Repo:** [Turfjs/turf](https://github.com/Turfjs/turf)
*   **Ne İşe Yarar:** Geofencing (Sanal çit), iki nokta arası orta nokta bulma, alan hesaplama gibi tüm coğrafi ihtiyaçlarınızı hızlıca çözen harika bir açık kaynak kütüphanedir.

---

### Arka Planda Konum Alma Notu
Redis, arka planda konum alma işlemini tek başına yapmaz. Arka planda konum almak için mobil uygulama (Frontend) tarafında `expo-location` ile **TaskManager (Background Location)** kullanılmalıdır. 
Telefon arka plandayken işletim sistemi `Socket.io` bağlantısını kestiği için arka plan konum güncellemeleri standart bir `HTTP POST` isteğiyle Node.js sunucusuna iletilmelidir. Sunucu bunu Redis'e yazar. 
Eğer SOS tetiklenirse, Node.js Redis'ten kapalı olan cihazları tespit edip **Firebase (FCM)** ile uyandırma bildirimi (Push Notification) gönderir.
