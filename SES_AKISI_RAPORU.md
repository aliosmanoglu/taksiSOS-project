# Taksi SOS - Ses Akışı (Push-To-Talk) Analiz Raporu

Mevcut projede ses akışı (Push-To-Talk / Bas-Konuş mimarisi) iki yönlü olarak (Mobil İstemci ve Node.js Sunucu) **Socket.io** üzerinden yönetilmektedir. Sistemin adım adım çalışma mantığı şu şekildedir:

## 1. Ses Gönderim Süreci (Mobil Uygulama -> Sunucu)

Ses kaydı, `taxi-sos-mobile/hooks/usePTT.ts` dosyasında `react-native-live-audio-stream` kütüphanesi kullanılarak gerçekleştirilir.

*   **İzin İsteme (`request_talk`):** Kullanıcı "Bas-Konuş" butonuna bastığında sunucuya `request_talk` eventi gönderilir. 
*   **Kanal Kontrolü (Backend):** Sunucu (`app.js`), kanalın (SOS odasının) başka biri tarafından kullanılıp kullanılmadığını kontrol eder (`channelStates`).
    *   Kanal meşgulse `talk_rejected` döner.
    *   Kanal boşsa, konuşmacı için kanalı kilitler. Sunucuda `temp_audio/` klasöründe o anki konuşma için geçici bir `.raw` dosyası (`fs.createWriteStream`) oluşturur.
    *   Kullanıcıya `talk_granted` (konuşabilirsin) onayı gönderirken, odadaki diğer kullanıcılara `channel_locked` (kanal kilitlendi, başkası konuşuyor) bilgisini iletir.
*   **Canlı Ses Akışı (`audio_chunk`):** Konuşma izni alındığında mikrofondan alınan ses verileri (base64 formatında küçük parçalar/chunk halinde) anlık olarak `audio_chunk` eventi ile sunucuya iletilir.
*   **Sunucuya Kayıt (Backend):** Sunucu gelen bu base64 parçalarını Buffer'a çevirerek anlık olarak `temp_audio` altındaki geçici `.raw` dosyasına yazar (append işlemi).

## 2. Canlı Ses Dinleme (Sunucu -> Mobil Uygulama)

*   **Parçaların İletimi:** Sunucu, konuşmacıdan gelen her `audio_chunk` parçasını anında odadaki diğer dinleyicilere `receive_audio_chunk` eventi ile yayınlar (broadcast).
*   **Eksik/Geliştirilecek Kısım:** Şu an `taxi-sos-mobile/app/index.tsx` içindeki `receive_audio_chunk` dinleyicisinde canlı ses parçalarının (chunk'ların) anlık oynatılması **henüz tam uygulanmamıştır**. Kod içerisinde *"Şimdilik expo-av ile tam chunk streaming desteklenmediğinden... İleride buraya react-native-live-audio-stream oynatıcısı eklenebilir."* şeklinde bir not düşülmüştür. Yani sesler anlık olarak diğer cihazlara gitse de şu an real-time olarak hoparlörden duyulmamaktadır.

## 3. Ses Kaydının Tamamlanması ve Arşivlenmesi

*   **Konuşmayı Bitirme (`stop_talk`):** Kullanıcı butondan elini çektiğinde mikrofondan kayıt durdurulur ve sunucuya `stop_talk` eventi gider.
*   **Sunucu İşlemleri (Backend):**
    1.  Geçici dosyaya yazma işlemini (`writeStream`) bitirir.
    2.  Kanalın kilidini açar ve herkese `channel_released` sinyali gönderir.
    3.  `temp_audio` içindeki tamamlanmış `.raw` formatındaki ses dosyasını **Firebase Storage**'a (`voice_messages/` dizinine) yükler ve dosyayı herkese açık (public) hale getirir.
    4.  Dosyanın Storage URL'ini ve meta verilerini **Firestore** veritabanına (`voice_messages` koleksiyonuna) kaydeder. Aynı zamanda aktif SOS odasının geçmişine (arşivine) ekler.
    5.  Odada bulunan tüm kullanıcılara `chat_message` eventi ile sesin kalıcı dinleme linkini (Storage URL) gönderir.
    6.  **Çöp Toplama (Garbage Collection):** Sunucu diskinde yer kaplamaması için geçici `.raw` dosyasını `temp_audio` klasöründen siler.
*   **Oynatma:** Sohbet ekranına düşen bu kalıcı link üzerinden, kullanıcılar gönderilmiş olan ses kaydını (bir sesli mesaj gibi) başından sonuna kadar oynatabilirler.

## Ekstra: Eski Tip `voice_message` Sistemi

Ayrıca `app.js` ve `index.tsx` içerisinde eski (veya alternatif) bir `voice_message` yapısı da bulunmaktadır. Bu yapıda:
- Ses bütün bir base64 dosyası olarak sunucuya tek seferde gönderiliyor.
- Sunucu `play_voice` eventi üzerinden bunu diğerlerine iletiyor. 
- Mobil cihazlar (index.tsx içindeki `play_voice` dinleyicisinde) bu dosyayı `.m4a` formatında telefonlarına indirip `expo-av` (Audio.Sound) modülü ile otomatik olarak çalıyorlar.

---
**ÖZET:** Projede PTT (Bas-Konuş) için anlık stream (akış) altyapısı Backend tarafında başarılı bir şekilde kurgulanmış ve Firebase Storage ile entegre edilmiştir. Ancak Frontend (mobil) tarafında gelen anlık ses parçalarını (canlı sesi) real-time hoparlörden oynatma adımı henüz tamamlanmamıştır. Bunun yerine konuşma bitince kaydedilen dosya URL'i chat ekranına gönderilmektedir.
