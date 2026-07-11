# iOS Çökme (Crash) Analiz Raporu

**Tarih:** 8 Temmuz 2026
**Uygulama:** TaxiSOS (v1.2.2 / Build 24)
**Platform:** iOS 26.1 (iPhone14,7)

## 🚨 1. Çökmenin Temel Nedeni (Root Cause)
Uygulama **`SIGABRT` (Abort trap: 6)** hatası vererek çökmüş. Bu hata genellikle uygulamanın bellek yetersizliğinden ziyade, kodda "yakalanmayan bir istisna" (Uncaught Objective-C Exception) fırlatıldığında ve sistemin uygulamayı zorla kapatması gerektiğinde ortaya çıkar.

Hata, React Native'in **TurboModule (Yeni Mimari)** yapısında meydana gelmiş:
`facebook::react::ObjCTurboModule::performVoidMethodInvocation`

Bu demek oluyor ki; **JavaScript (React Native) kodundan, Native (iOS/Swift) tarafındaki bir metoda çağrı yapılmış, ancak bu metodun çalışması sırasında veya parametreler çevrilirken ölümcül bir hata oluşmuş.**

## 🔍 2. Teknik Analiz ve İpuçları
Log dosyasının derinliklerine indiğimizde (Özellikle Thread 0 ve Thread 7 numaralı iş parçacıklarında) şu detayları görüyoruz:

- **Swift Dili İzi:** Çökmeye sebep olan olay zincirinde `swift_dynamicCast`, `_debugPrint` ve `String.init(describing:)` gibi bariz **Swift** dili fonksiyonları var.
- **Tip Dönüşüm Hatası (Casting):** `swift_dynamicCast` fonksiyonunun çağrılması, JS'den Native tarafa gönderilen bir verinin (obje, string, sayı vb.) yanlış bir tipe zorlandığını gösterir. Örneğin; Native fonksiyon bir `String` beklerken, JS tarafından `null`, `undefined` veya `Number` gönderilmiş olabilir. Swift bunu `String`'e çevirmeye veya log ekrana yazdırmaya (`_debugPrint`) çalışırken çöküyor.
- **RNLiveAudioStream mi?:** Üzerinde çalıştığın `RNLiveAudioStream` kütüphanesi saf **Objective-C** ile yazılmıştır. Loglardaki bu çökme ise kesinlikle bir **Swift** kodunda yaşanıyor. 
  - Bu durum hatanın doğrudan `RNLiveAudioStream` içinden *değil*, **Expo'nun kendi modüllerinden** (`expo-av`, `expo-file-system`, vb.), Swift ile yazılmış başka bir paketten veya senin JS tarafından gönderdiğin hatalı bir parametreyi işleyemeyen Expo modül adaptöründen kaynaklandığını gösteriyor.

## 🎯 3. Çözüm İçin Yapılması Gerekenler

### 💡 En Önemli Tespit: Projede Sentry Kurulu!
Crash logunu incelerken `SentryCrash Exception Handler`, `io.sentry.app-hang-tracker` gibi iş parçacıkları tespit edilmiştir. Bu, projede halihazırda **Sentry**'nin entegre olduğunu kanıtlıyor.

1. **Sentry Paneline Girin (Kesin Çözüm):** 
   - Hiç logları deşifre etmekle uğraşmana gerek yok. Hemen [sentry.io](https://sentry.io) paneline (veya şirketinizin Sentry paneline) giriş yapın. 
   - Bu çökme TestFlight üzerinden %100 Sentry'e düşmüştür. Sentry, elindeki dSYM (sembol) dosyaları sayesinde sana hatanın **"Hangi dosyanın kaçıncı satırında"** olduğunu (Örn: `ExpoAV.swift line 45`) açıkça söyleyecektir.
   
2. **Son Eklenen JS -> Native Çağrılarını Kontrol Edin:**
   - Uygulama çöktüğünde hangi aksiyonu alıyordun? (Örneğin mikrofona izin verme, ses kaydı başlatma, dosya okuma vb.). 
   - O butona tıkladığında çalışan koda git ve Native modüle (veya Expo kütüphanesine) gönderdiğin parametreleri `console.log` ile kontrol et. Beklenmeyen bir `null` veya `undefined` değeri Swift tarafına geçiyor olabilir.

3. **Expo Modüllerini Güncelleyin:** 
   - Eğer hata Expo'nun kendi Swift kütüphanelerinden (örneğin expo-av) kaynaklanıyorsa, paket versiyonları ile React Native versiyonun (EAS SDK versiyonun) arasında bir uyuşmazlık olabilir.
