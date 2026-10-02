// Bu dosya, TAKSI SOS için hazırlanan resmi sözleşme/metin belgelerinden üretilmiştir.
// İçerik değişikliği gerektiğinde kaynak .docx dosyaları güncellenip yeniden üretilmelidir.

export type LegalDocumentId = 'kullanim-kosullari' | 'uyelik-sozlesmesi' | 'kvkk-aydinlatma' | 'kvkk-acik-riza' | 'ticari-ileti-onayi';

export type LegalDocument = {
  id: LegalDocumentId;
  title: string;
  buttonText: string;
  required: boolean;
  body: string;
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'kullanim-kosullari',
    title: 'Kullanım Koşulları',
    buttonText: `Kullanım Koşulları'nı Okudum ve Kabul Ediyorum`,
    required: true,
    body: `TAKSİ SOS KULLANIM KOŞULLARI
Yürürlük Tarihi: 22/09/2026
1. TARAFLAR VE KAPSAM
1.1. İşbu Kullanım Koşulları; Ümraniye / İstanbul adresinde mukim Ali Haydar Osmanoğlu (işbu Kullanım Koşulları’nın yürürlüğe girdiği tarihte bir ticaret şirketi henüz kurulmamışsa, Uygulamayı gerçek kişi sıfatıyla işleten kişi; varsa MERSİS/ticaret sicil numarası madde 29’da belirtilir) tarafından işletilen TaksiSOS isimli mobil uygulama ile uygulama üzerinden sunulan hizmetlerden yararlanan kullanıcılar arasındaki hukuki ilişkiyi düzenlemektedir.
1.2. İşbu Kullanım Koşulları’nda Ali Haydar Osmanoğlu kısaca “Şirket”, TaksiSOS isimli mobil uygulama “Uygulama”, Uygulamaya üye olan taksi sürücüleri “Kullanıcı”, Uygulama üzerinden sunulan bildirim, konum paylaşımı, takip ve diğer fonksiyonlar ise birlikte “Hizmetler” olarak anılacaktır.
1.3. Kullanıcının Uygulamaya üye olması, hesabını aktive etmesi veya Hizmetlerden yararlanması, işbu Kullanım Koşulları’nı okuyarak kabul ettiği anlamına gelir.
1.4. Kullanıcı, işbu Kullanım Koşulları’nı kabul etmemesi hâlinde Uygulamaya üye olmamalı ve Hizmetleri kullanmamalıdır.
2. UYGULAMANIN AMACI VE HİZMETİN NİTELİĞİ
2.1. Uygulama; taksi sürücülerinin yolculuk sırasında kendilerini risk altında hissetmeleri veya fiilî ve yakın bir tehlikeyle karşılaşmaları hâlinde, sınırlı sayıdaki doğrulanmış Kullanıcıya bildirim gönderilmesini, sürücünün konumunun belirli süreyle takip edilmesini ve resmî acil yardım kanallarına daha hızlı ulaşılmasını kolaylaştırmayı amaçlayan dijital bir güvenlik destek sistemidir.
2.2. Uygulama bir kolluk kuvveti, özel güvenlik hizmeti, acil çağrı merkezi, ambulans hizmeti, kurtarma ekibi veya profesyonel müdahale hizmeti değildir.
2.3. Şirket; herhangi bir olayın önlenmesini, saldırının sona erdirilmesini, şüpheli kişinin yakalanmasını, diğer Kullanıcıların olay yerine ulaşmasını veya kolluk kuvvetlerinin belirli bir süre içerisinde müdahalede bulunmasını garanti etmez.
2.4. Uygulama, 112 Acil Çağrı Merkezi’nin veya diğer resmî acil yardım kanallarının alternatifi değildir. Kullanıcı, yakın ve ciddi bir tehlike hâlinde öncelikle kendi güvenliğini sağlamalı ve mümkün olan en kısa sürede 112 Acil Çağrı Merkezi ile iletişime geçmelidir.
2.5. Uygulamanın 112 veya başka bir kamu kurumu sistemiyle doğrudan entegrasyonu bulunmadığı sürece, Uygulama üzerinden oluşturulan bir bildirimin kolluk kuvvetlerine veya başka bir kamu kurumuna kendiliğinden iletildiği kabul edilemez.
3. TANIMLAR
İşbu Kullanım Koşulları kapsamında;
Hesap: Kullanıcının Uygulamadan yararlanmak amacıyla oluşturduğu kişisel kullanıcı hesabını,
Doğrulanmış Kullanıcı: Kimlik, iletişim, taksi sürücülüğü, plaka, ruhsat, durak, çalışma kartı veya Şirket tarafından talep edilen diğer bilgiler üzerinden üyeliği doğrulanmış Kullanıcıyı,
Risk Bildirimi: Kullanıcının henüz fiilî bir saldırıyla karşılaşmadığı ancak yolcu davranışları veya yolculuk şartları nedeniyle güvenliğine ilişkin makul bir endişe duyduğu hâllerde oluşturduğu bildirimi,
Acil SOS Bildirimi: Kullanıcının saldırı, tehdit, gasp, silah görülmesi, araçtan çıkmasının engellenmesi veya benzeri fiilî, yakın ve ciddi bir tehlikeyle karşılaştığı hâllerde oluşturduğu acil durum bildirimini,
Canlı Konum: Kullanıcının mobil cihazından alınan ve alarm süresince yetkilendirilmiş diğer Kullanıcılara veya acil durum kişilerine gösterilebilen konum bilgisini,
Acil Durum Kişisi: Kullanıcının isteğe bağlı olarak belirlediği ve bir Risk Bildirimi veya Acil SOS Bildirimi hâlinde kendisine bilgi verilmesini istediği üçüncü bir gerçek kişiyi,
Olay Kaydı: Oluşturulan bildirimin zamanı, türü, süresi, konumu, bildirimi alan kullanıcılar, gerçekleştirilen işlemler ve Kullanıcı tarafından girilen açıklamalardan oluşan kaydı,
Yolcu: Kullanıcının taksi taşımacılığı hizmetinden yararlanan veya araç içerisinde bulunan gerçek kişiyi,
ifade eder.
4. ÜYELİK ŞARTLARI
4.1. Uygulamaya yalnızca on sekiz yaşını doldurmuş, fiil ehliyetine sahip ve yürürlükteki mevzuat uyarınca taksi sürücülüğü yapmaya yetkili kişiler üye olabilir.
4.2. Kullanıcı, üyelik sırasında kendisinden talep edilen bilgileri doğru, güncel ve eksiksiz olarak vermekle yükümlüdür.
4.3. Şirket, üyelik başvurusu sırasında veya üyeliğin devamı süresince aşağıdaki bilgi ve belgelerin sunulmasını talep edebilir:
a. Kimlik ve iletişim bilgileri,
b. Sürücü belgesi,
c. Taksi kullanım kartı veya toplu taşıma aracı kullanım belgesi,
d. Taksi plakası, ruhsatı veya araç bilgileri,
e. Taksi durağı, kooperatif, filo veya bağlı olunan meslek kuruluşu bilgileri,
f. Kullanıcının taksi sürücülüğü yapmaya yetkili olduğunu gösteren diğer bilgi ve belgeler.
4.4. Şirket, üyelik başvurusunu kabul veya reddetme, ek belge talep etme ve sunulan belgelerin doğruluğunu ilgili kurum, kuruluş, durak, kooperatif veya filo işletmesinden teyit etme hakkına sahiptir.
4.5. Kullanıcının taksi sürücülüğü yetkisinin sona ermesi, askıya alınması veya üyelik şartlarını kaybetmesi hâlinde Kullanıcı bu durumu derhâl Şirkete bildirmekle yükümlüdür.
4.6. Üyelik, Kullanıcıya özeldir. Hesap ve üyelik hakları üçüncü kişilere devredilemez, kiralanamaz veya kullandırılamaz.
5. HESAP GÜVENLİĞİ
5.1. Kullanıcı; şifre, doğrulama kodu, cihaz erişimi ve diğer hesap güvenliği bilgilerinin gizliliğini korumakla yükümlüdür.
5.2. Kullanıcı, hesabının yetkisiz kişilerce kullanıldığını veya hesap güvenliğinin ihlal edildiğini fark etmesi hâlinde durumu derhâl Şirkete bildirmelidir.
5.3. Kullanıcının kendi kusuruyla hesap bilgilerini üçüncü kişilerle paylaşması veya cihaz güvenliğini sağlamaması nedeniyle meydana gelen işlemlerden Kullanıcı sorumludur.
5.4. Şirket; şüpheli oturum, olağan dışı konum hareketi, tekrarlanan yanlış alarm veya hesap paylaşımı tespit etmesi hâlinde ek kimlik doğrulaması isteyebilir, hesabı geçici olarak sınırlandırabilir veya askıya alabilir.
6. KONUM İZNİ VE KONUM PAYLAŞIMI
6.1. Uygulamanın temel güvenlik fonksiyonlarının çalışabilmesi için Kullanıcının mobil cihazının konum özelliğini etkinleştirmesi ve Uygulamaya gerekli konum izinlerini vermesi gerekebilir.
6.2. Konum izninin kapatılması, internet bağlantısının bulunmaması, cihazın kapalı olması, GPS sinyalinin alınamaması, işletim sistemi kısıtlamaları veya teknik arızalar nedeniyle Uygulamanın bildirim ve konum paylaşımı fonksiyonları çalışmayabilir veya hatalı çalışabilir.
6.3. Şirket, Uygulamanın amacı için gerekli olmadığı sürece Kullanıcının konumunu diğer Kullanıcılara sürekli olarak göstermez.
6.4. Canlı Konum, kural olarak yalnızca Risk Bildirimi veya Acil SOS Bildirimi aktif olduğu süre boyunca ve sistem tarafından yetkilendirilen sınırlı sayıdaki Doğrulanmış Kullanıcıyla paylaşılır.
6.5. Alarm sona erdiğinde diğer Kullanıcıların Canlı Konuma erişimi sonlandırılır. Olay kayıtlarının hukuki yükümlülükler, güvenlik incelemesi, uyuşmazlıkların çözümü veya bir hakkın tesisi, kullanılması ya da korunması amacıyla saklanması hâlleri saklıdır.
6.6. Konum bilgisinin gösterileceği Kullanıcılar; bildirimi oluşturan Kullanıcıya olan mesafe, sürüş yönü, müsaitlik durumu, alarmın niteliği, teknik kapasite ve güvenlik kriterleri dikkate alınarak sistem tarafından belirlenebilir.
6.7. Kullanıcı, başka bir Kullanıcının konum bilgisini yalnızca ilgili alarmın güvenlik amacı kapsamında kullanabilir. Konum bilgisinin kopyalanması, üçüncü kişilerle paylaşılması, sosyal medyada yayımlanması, ticari amaçla kullanılması veya alarm amacı dışında takip faaliyetine dönüştürülmesi yasaktır.
7. RİSK BİLDİRİMİ
7.1. Risk Bildirimi; henüz fiilî bir saldırı veya kesin bir acil durum bulunmamakla birlikte, yolcunun davranışları, güzergâh talepleri, tehditkâr söylemleri veya yolculuğun şartları nedeniyle Kullanıcının güvenliğine ilişkin makul ve ciddi bir endişe duyması hâlinde kullanılabilir.
7.2. Risk Bildirimi oluşturulduğunda Kullanıcının Canlı Konumu sistem tarafından takip edilebilir ve yakın çevrede bulunan sınırlı sayıdaki Doğrulanmış Kullanıcıya bilgi verilebilir.
7.3. Risk Bildirimi, diğer Kullanıcılar bakımından olay yerine gitme, yolcuyu takip etme, aracı durdurma veya fiziksel müdahalede bulunma çağrısı niteliğinde değildir.
7.4. Risk Bildirimi alan Kullanıcılar, güvenli sürüş kurallarına uymalı, herhangi bir takip veya müdahale faaliyetinde bulunmamalı ve gerekli gördükleri takdirde resmî acil yardım kanallarına bilgi vermelidir.
7.5. Bildirimi oluşturan Kullanıcı, tehlike endişesinin sona ermesi hâlinde Risk Bildirimini gecikmeksizin kapatmalıdır.
8. ACİL SOS BİLDİRİMİ
8.1. Acil SOS Bildirimi; fiziksel saldırı, ciddi tehdit, gasp, hürriyetten yoksun bırakılma, silah görülmesi, aracın zorla yönlendirilmesi veya Kullanıcının can ve vücut bütünlüğü bakımından yakın ve ciddi tehlike oluşturan benzeri durumlarda kullanılmalıdır.
8.2. Acil SOS Bildirimi oluşturulduğunda Kullanıcının Canlı Konumu, alarmın niteliğine göre daha geniş ancak yine de sınırlandırılmış bir çevredeki Doğrulanmış Kullanıcılarla paylaşılabilir.
8.3. Uygulama, Acil SOS Bildirimi sırasında Kullanıcıya 112’yi arama, önceden belirlediği acil durum kişisine bilgi gönderme veya güvenli sürüş talimatlarını görüntüleme imkânı sunabilir.
8.4. Kullanıcı, mümkün olduğu ölçüde kendi güvenliğini tehlikeye atmadan ve trafik kurallarını ihlal etmeden hareket etmelidir.
8.5. Acil SOS Bildiriminin oluşturulması, Şirketin veya diğer Kullanıcıların olayın gerçekliğini doğruladığı anlamına gelmez.
8.6. Acil durumun sona ermesi hâlinde Kullanıcı alarmı kapatmalı veya Uygulama üzerinden durum güncellemesi yapmalıdır.
9. DİĞER KULLANICILARIN MÜDAHALE SINIRI
9.1. Uygulama ve Uygulama üyeliği, Kullanıcılara kolluk görevlisi, özel güvenlik görevlisi veya kamu görevlisi sıfatı kazandırmaz.
9.2. Bir Risk Bildirimi veya Acil SOS Bildirimi alan Kullanıcı, kural olarak olay yerine yaklaşmamalı, şüpheli kişiyi veya aracı takip etmemeli ve fiziksel müdahalede bulunmamalıdır.
9.3. Kullanıcıların;
a. Toplu şekilde olay yerine gitmeleri,
b. Taksi veya başka bir aracın yolunu kesmeleri,
c. Bir kişiyi sorgulamaları, aramaları veya alıkoymaları,
d. Şüpheli kişiyi araçla takip etmeleri veya sıkıştırmaları,
e. Tehdit, hakaret, cebir veya silah kullanmaları,
f. Kişilerin görüntülerini çekerek sosyal medyada yayımlamaları,
g. Kendi güvenliklerini, yolcuları veya üçüncü kişileri tehlikeye düşürecek şekilde hareket etmeleri
yasaktır.
9.4. Uygulama üzerinden gönderilen bildirimler, Kullanıcılara mevzuatta öngörülen sınırların ötesinde herhangi bir yakalama, arama, takip veya zor kullanma yetkisi vermez.
9.5. Kullanıcılar, yalnızca gerçekleşmekte olan ve yakın bir saldırı karşısında, olayın şartlarının gerektirdiği ölçüde ve kanuni sınırlar içerisinde hareket edebilir. Bu değerlendirmenin ve gerçekleştirilen her türlü fiilin hukuki ve cezai sorumluluğu ilgili Kullanıcıya aittir.
9.6. Kullanıcıların önceliği, güvenli bir mesafede kalmak ve resmî acil yardım birimlerine doğru bilgi aktarmaktır.
10. 112 VE RESMÎ MAKAMLARLA İLETİŞİM
10.1. Kullanıcı, ciddi ve yakın bir tehlikeyle karşılaşması hâlinde mümkün olan en kısa sürede 112 Acil Çağrı Merkezi ile iletişime geçmelidir.
10.2. Uygulamada yer alan “112’yi Ara” veya benzeri bir buton, yalnızca kullanıcının mobil cihazının arama fonksiyonunu çalıştırabilir. Bu butonun seçilmesi tek başına çağrının kurulduğu veya yardım talebinin resmî makamlara ulaştığı anlamına gelmez.
10.3. Kullanıcı, 112 görüşmesi sırasında olayın yeri, niteliği, araç plakası, güzergâhı ve mevcut tehlike hakkında doğru bilgi vermekle sorumludur.
10.4. Şirket, yetkili kamu kurumları tarafından usulüne uygun şekilde talep edilmesi hâlinde, yürürlükteki mevzuat çerçevesinde olay ve hesap kayıtlarını ilgili makamlarla paylaşabilir.
10.5. Şirketin herhangi bir kamu kurumuyla resmî iş birliği veya entegrasyonu bulunmadığı sürece Uygulamanın kamu destekli, resmî veya kolluk kuvvetleri tarafından işletilen bir sistem olduğu ileri sürülemez.
11. KULLANICININ YÜKÜMLÜLÜKLERİ
11.1. Kullanıcı, Uygulamayı yalnızca hukuka uygun ve işbu Kullanım Koşulları’nda belirtilen amaçlar kapsamında kullanacağını kabul eder.
11.2. Kullanıcı;
a. Üyelik bilgilerinin doğru ve güncel olmasını sağlamak,
b. Risk ve SOS bildirimlerini yalnızca gerçek veya makul şekilde algılanan güvenlik risklerinde kullanmak,
c. Yanlışlıkla oluşturduğu bildirimi gecikmeksizin kapatmak,
d. Bildirime konu olay hakkında doğru ve ölçülü bilgi vermek,
e. Diğer Kullanıcıların ve yolcuların kişisel verilerini korumak,
f. Trafik kurallarına ve mesleki yükümlülüklerine uymak,
g. Uygulamayı kullanırken kendi güvenliğini ve üçüncü kişilerin güvenliğini gözetmek,
h. Şirket tarafından iletilen güvenlik uyarılarına uymak
zorundadır.
11.3. Kullanıcı, Uygulamayı kullanırken yolcuya veya üçüncü kişilere ilişkin gereksiz kimlik, sağlık, iletişim, özel hayat, görüntü veya benzeri bilgileri sisteme girmemelidir.
11.4. Kullanıcı, olay açıklamalarında hakaret, tehdit, ayrımcı ifade, doğrulanmamış suç isnadı veya kişilik haklarını ihlal edici içerik kullanamaz.
11.5. Kullanıcı, mobil cihazını sürüş güvenliğini tehlikeye düşürecek şekilde kullanamaz. Bildirim işlemlerinin mümkün olduğunca araç güvenli şekilde durdurulduktan sonra veya sesli/tek dokunuşlu fonksiyonlarla gerçekleştirilmesi gerekir.
12. YASAKLI KULLANIMLAR
12.1. Aşağıdaki eylemler yasaktır:
a. Şaka, deneme, rekabet, ticari anlaşmazlık, kişisel husumet veya başka bir amaçla gerçeğe aykırı alarm oluşturulması,
b. Başka bir sürücünün veya yolcunun korkutulması, baskı altına alınması veya itibarsızlaştırılması amacıyla bildirim gönderilmesi,
c. Kullanıcıların organize edilerek olay yerine yönlendirilmesi,
d. Yolcular hakkında kara liste, puanlama veya sürekli risk profili oluşturulması,
e. Yolcu fotoğrafı, kimlik bilgisi veya iletişim bilgisinin diğer Kullanıcılara dağıtılması,
f. Canlı konum bilgilerinin alarm amacı dışında kullanılması,
g. Başka bir Kullanıcının hesabının kullanılması veya hesabın üçüncü kişilere kullandırılması,
h. Uygulamanın işleyişini bozacak yazılım, robot, otomasyon veya kötü amaçlı kod kullanılması,
i. Uygulamanın kaynak kodunun çözülmeye, kopyalanmaya veya tersine mühendislik yoluyla incelenmeye çalışılması,
j. Uygulama aracılığıyla hukuka aykırı içerik oluşturulması veya paylaşılması,
k. Şirket, diğer Kullanıcılar, yolcular veya üçüncü kişiler hakkında hukuka aykırı veri toplanması.
12.2. Şirket, yasaklı kullanım şüphesi bulunan işlemleri inceleyebilir ve gerekli görmesi hâlinde ilgili hesabı geçici olarak sınırlandırabilir.
13. YANLIŞ ALARM VE KÖTÜYE KULLANIM
13.1. Teknik hata, dikkatsizlik veya yanlış dokunma nedeniyle oluşturulan bildirim, Kullanıcı tarafından mümkün olan en kısa sürede iptal edilmelidir.
13.2. Kullanıcı, yanlışlıkla oluşturduğu bildirimin diğer Kullanıcılar veya Şirket tarafından gerçek bir acil durum olarak değerlendirilebileceğini kabul eder.
13.3. Kasıtlı olarak gerçeğe aykırı bildirim oluşturulması, Uygulamanın kötüye kullanılması niteliğindedir.
13.4. Şirket; gerçeğe aykırı, tekrarlanan, kötü niyetli veya üçüncü kişilerin haklarını ihlal eden bildirimler bakımından Kullanıcıdan açıklama isteyebilir, hesabı geçici olarak askıya alabilir veya üyeliği sona erdirebilir.
13.5. Gerçeğe aykırı bildirim nedeniyle Şirketin, diğer Kullanıcıların, yolcuların, kamu kurumlarının veya üçüncü kişilerin zarara uğraması hâlinde, bildirimi oluşturan Kullanıcı kusuru oranında sorumlu tutulabilir.
13.6. Kullanıcının yanlış veya kötü niyetli ihbarı nedeniyle doğabilecek cezai, idari ve hukuki sorumluluk Kullanıcıya aittir.
14. YOLCULARA İLİŞKİN BİLGİLER
14.1. Uygulamanın temel amacı yolcuların kimliğini tespit etmek veya yolcular hakkında veri tabanı oluşturmaktır değildir.
14.2. Kullanıcı, bir güvenlik bildiriminde olayın anlaşılması için zorunlu olmadığı sürece yolcunun adını, telefon numarasını, kimlik bilgilerini, fotoğrafını, adresini veya diğer kişisel bilgilerini sisteme girmemelidir.
14.3. Uygulama üzerinden yolculara kalıcı puan verilmesi, yolcuların “tehlikeli”, “suçlu”, “şüpheli” veya benzeri ifadelerle listelenmesi ve bu bilgilerin diğer Kullanıcılar arasında yayılması yasaktır.
14.4. Kullanıcı, yolcuya ilişkin bilgileri yalnızca somut olayın bildirilmesi, resmî makamlara başvuru yapılması veya bir hakkın tesisi, kullanılması ya da korunması için gerekli olduğu ölçüde paylaşabilir.
14.5. Yolcuya ilişkin bilgi ve içeriklerin sosyal medya, mesajlaşma grupları veya üçüncü taraf platformlarda paylaşılması Kullanıcının kendi sorumluluğundadır ve Uygulamanın kullanım amacı dışındadır.
15. SES, GÖRÜNTÜ VE ORTAM KAYITLARI
15.1. Uygulamada açıkça sunulmadığı sürece Uygulama, alarm oluşturulmasıyla birlikte yolcunun veya araç içindeki kişilerin sesini ya da görüntüsünü kendiliğinden kaydetmez.
15.2. Kullanıcının kendi cihazı, araç içi kamera sistemi veya üçüncü taraf bir uygulama aracılığıyla gerçekleştirdiği ses ve görüntü kayıtlarından Şirket sorumlu değildir.
15.3. Kullanıcı, ses veya görüntü kaydı gerçekleştirirken kişisel verilerin korunması, özel hayatın gizliliği, kişiler arasındaki konuşmaların gizliliği ve ilgili diğer mevzuata uygun hareket etmekle yükümlüdür.
15.4. Kullanıcı, hukuka aykırı şekilde elde ettiği ses, görüntü veya diğer kayıtları Uygulamaya yükleyemez ve diğer Kullanıcılarla paylaşamaz.
15.5. İleride Uygulamaya ses veya görüntü kayıt özelliği eklenmesi hâlinde bu özellik için ayrıca bilgilendirme yapılabilir ve gerekli izinler alınabilir.
16. KULLANICI İÇERİKLERİ
16.1. Kullanıcının olay açıklaması, bildirim notu, destek talebi veya diğer alanlara girdiği her türlü metin, belge ve bilgi “Kullanıcı İçeriği” olarak kabul edilir.
16.2. Kullanıcı, paylaştığı Kullanıcı İçeriğinin hukuka uygun, doğru ve olayla bağlantılı olduğunu kabul eder.
16.3. Kullanıcı, üçüncü kişilerin kişilik haklarını, özel hayatını, ticari itibarını, fikrî mülkiyet haklarını veya kişisel verilerini ihlal eden içerik paylaşamaz.
16.4. Şirket, hukuka aykırı olduğu değerlendirilen, şikâyete konu edilen veya Uygulamanın amacıyla bağdaşmayan içerikleri kaldırabilir, erişime kapatabilir veya yetkili makamlara iletebilir.
16.5. Kullanıcı, paylaştığı içerik nedeniyle üçüncü kişiler tarafından ileri sürülebilecek taleplerden kendi kusuru ve hukuka aykırı fiili ölçüsünde sorumludur.
17. KİŞİSEL VERİLERİN KORUNMASI
17.1. Kullanıcıların kişisel verileri; üyeliğin kurulması, kimlik ve sürücülük bilgilerinin doğrulanması, Hizmetlerin sunulması, güvenlik bildirimlerinin oluşturulması, Canlı Konum paylaşımı, kötüye kullanımın önlenmesi, destek taleplerinin karşılanması, hukuki yükümlülüklerin yerine getirilmesi ve uyuşmazlıkların çözülmesi amaçlarıyla işlenebilir.
17.2. Kişisel verilerin işlenmesine ilişkin ayrıntılı bilgiler, Uygulama içerisinde sunulan Kullanıcı Aydınlatma Metni kapsamında açıklanmaktadır.
17.3. Açık rızaya tabi bir veri işleme faaliyetinin bulunması hâlinde, açık rıza Kullanım Koşulları’ndan ve üyelik kabulünden ayrı olarak alınır.
17.4. Kullanıcı, başka bir Kullanıcıya ait Canlı Konum veya olay bilgisine eriştiğinde, bu bilgileri yalnızca ilgili güvenlik bildiriminin amacı doğrultusunda kullanmakla yükümlüdür.
17.5. Kullanıcıların diğer Kullanıcılara ait verileri kopyalamaları, arşivlemeleri, üçüncü kişilere aktarmaları veya ticari amaçlarla kullanmaları yasaktır.
17.6. Kullanıcı, kişisel verilerinin işlenmesine ilişkin taleplerini mail adresine veya Aydınlatma Metni’nde belirtilen diğer kanallar üzerinden iletebilir.
18. ÜÇÜNCÜ TARAF HİZMETLERİ
18.1. Uygulama; harita, konum, bildirim, bulut depolama, kimlik doğrulama, analiz, hata izleme ve benzeri hizmetler için üçüncü taraf hizmet sağlayıcılardan yararlanabilir.
18.2. Üçüncü taraf hizmet sağlayıcıların kendi kullanım koşulları ve gizlilik politikaları bulunabilir.
18.3. Şirket, üçüncü taraf hizmetlerin kendi sistemlerinden kaynaklanan kesinti, hata veya erişim sorunlarından, kendi kusuru bulunmadığı ölçüde sorumlu değildir.
18.4. Uygulamada üçüncü taraf internet sitelerine veya hizmetlerine bağlantı verilmesi, Şirketin ilgili hizmeti onayladığı veya garanti ettiği anlamına gelmez.
19. HİZMETİN KESİNTİYE UĞRAMASI
19.1. Uygulama; internet bağlantısı, GPS sinyali, mobil cihaz özellikleri, pil seviyesi, işletim sistemi izinleri, sunucu kapasitesi ve üçüncü taraf hizmetler üzerinden çalışmaktadır.
19.2. Şirket, Hizmetlerin kesintisiz, hatasız, gecikmesiz veya her cihazla uyumlu şekilde çalışacağını garanti etmez.
19.3. Bakım, güncelleme, güvenlik çalışması, teknik arıza, siber saldırı, altyapı sorunu, mücbir sebep veya üçüncü taraf hizmet kesintisi nedeniyle Hizmetlere geçici olarak erişilemeyebilir.
19.4. Kullanıcı, acil durumlarda yalnızca Uygulamaya güvenmemeli; telefonla 112’yi arama, güvenli bölgeye geçme ve diğer resmî yardım yöntemlerini kullanmalıdır.
19.5. Şirket, planlı bakım ve önemli kesintiler hakkında Kullanıcıları makul ölçüde bilgilendirmeye çalışır.
20. SORUMLULUĞUN SINIRLARI
20.1. Şirket, Uygulamanın teknik olarak işletilmesinden ve kendi kontrol alanındaki güvenlik tedbirlerinin alınmasından sorumludur.
20.2. Şirket;
a. Kullanıcıların veya yolcuların hukuka aykırı fiillerinden,
b. Kullanıcıların fiziksel müdahale, takip veya zor kullanma eylemlerinden,
c. Gerçeğe aykırı veya eksik bildirimlerden,
d. Kullanıcının cihaz, internet, GPS veya işletim sistemi sorunlarından,
e. 112 veya diğer kamu birimlerinin müdahale süresinden,
f. Uygulama dışında gerçekleştirilen içerik veya veri paylaşımlarından,
g. Kullanıcıların trafik kurallarını ihlal etmelerinden
kendi kusuru bulunmadığı ölçüde sorumlu değildir.
20.3. Şirket, hiçbir koşulda Kullanıcının can ve mal güvenliğini garanti eden bir sigortacı, taşıyıcı, güvenlik görevlisi veya kurtarma hizmeti sağlayıcısı olarak kabul edilemez.
20.4. Şirketin ağır kusuru, kastı veya mevzuat gereği sınırlandırılamayan sorumlulukları saklıdır.
20.5. İşbu maddede yer alan hükümler, tüketici veya kullanıcı lehine emredici mevzuat hükümlerini ortadan kaldıracak şekilde yorumlanamaz.
21. FİKRÎ MÜLKİYET HAKLARI
21.1. Uygulamanın yazılımı, tasarımı, arayüzü, veri tabanı yapısı, markası, logosu, görselleri, metinleri, algoritmaları ve diğer tüm unsurları üzerindeki fikrî ve sınai mülkiyet hakları Şirkete veya ilgili hak sahiplerine aittir.
21.2. Kullanıcıya, Uygulamayı yalnızca kişisel ve mesleki güvenlik amacıyla kullanabilmesi için sınırlı, devredilemez ve münhasır olmayan bir kullanım hakkı tanınmaktadır.
21.3. Kullanıcı; Uygulamayı veya herhangi bir unsurunu kopyalayamaz, çoğaltamaz, değiştiremez, satamaz, kiralayamaz, lisanslayamaz, dağıtamaz veya ticari olarak kullanamaz.
21.4. İşbu Kullanım Koşulları, fikrî mülkiyet haklarının Kullanıcıya devredildiği şeklinde yorumlanamaz.
22. HESABIN ASKIYA ALINMASI VE SONA ERDİRİLMESİ
22.1. Kullanıcı, Uygulama içerisindeki hesap kapatma fonksiyonunu kullanarak üyeliğini sona erdirebilir.
22.2. Şirket aşağıdaki hâllerde hesabı geçici olarak askıya alabilir veya üyeliği sona erdirebilir:
a. Üyelik bilgilerinin gerçeğe aykırı olması,
b. Kullanıcının taksi sürücülüğü yetkisini kaybetmesi,
c. Hesabın başka kişilerce kullanılması,
d. Tekrarlanan veya kasıtlı yanlış alarm oluşturulması,
e. Fiziksel müdahale veya organize takip çağrısı yapılması,
f. Yolcular veya diğer Kullanıcılar hakkında hukuka aykırı veri paylaşılması,
g. İşbu Kullanım Koşulları’nın esaslı şekilde ihlal edilmesi,
h. Uygulama veya diğer Kullanıcıların güvenliğinin tehlikeye atılması,
i. Yetkili makamlar tarafından hesabın sınırlandırılmasının talep edilmesi.
22.3. Acil güvenlik riski bulunmayan durumlarda, Şirket hesabı kapatmadan önce Kullanıcıdan açıklama talep edebilir.
22.4. Üyeliğin sona ermesi, sona erme tarihinden önce doğmuş hukuki sorumlulukları ortadan kaldırmaz.
22.5. Üyelik sona erdikten sonra kişisel veriler, ilgili mevzuat ve saklama süreleri doğrultusunda silinir, yok edilir veya anonim hâle getirilir.
23. KULLANIM KOŞULLARINDA DEĞİŞİKLİK
23.1. Şirket; mevzuat değişiklikleri, yeni özellikler, güvenlik gereklilikleri veya Hizmetlerin geliştirilmesi nedeniyle işbu Kullanım Koşulları’nı değiştirebilir.
23.2. Esaslı değişiklikler, yürürlüğe girmeden önce Uygulama içi bildirim, kısa mesaj, e-posta veya diğer uygun yöntemlerle Kullanıcılara duyurulur.
23.3. Kullanıcı, değişiklikleri kabul etmemesi hâlinde üyeliğini sona erdirebilir.
23.4. Kullanıcının değişikliğin yürürlüğe girmesinden sonra Uygulamayı kullanmaya devam etmesi, emredici mevzuat hükümleri saklı kalmak kaydıyla güncel koşulları kabul ettiği anlamına gelir.
24. ELEKTRONİK İLETİŞİM VE BİLDİRİMLER
24.1. Şirket, üyelik, hesap güvenliği, SOS bildirimleri, sistem güncellemeleri, hukuki değişiklikler ve Hizmetlerin sunulması için gerekli bildirimleri Kullanıcıya Uygulama içi bildirim, anlık bildirim, SMS, telefon veya e-posta yoluyla gönderebilir.
24.2. Hizmetin sunulması için zorunlu bildirimler, ticari elektronik ileti niteliğinde değildir.
24.3. Reklam, kampanya ve pazarlama amaçlı ticari elektronik iletiler, gerekli olduğu ölçüde Kullanıcının ayrıca vereceği iletişim onayına dayanılarak gönderilir.
24.4. Kullanıcı, iletişim bilgilerindeki değişiklikleri hesabı üzerinden güncellemekle yükümlüdür.
25. KAYITLARIN DELİL NİTELİĞİ
25.1. Taraflar arasında doğabilecek uyuşmazlıklarda; Şirketin sistem, sunucu, işlem, alarm, konum, erişim ve iletişim kayıtları hukuka uygun şekilde elde edilmiş olmaları kaydıyla delil olarak ileri sürülebilir.
25.2. İşbu hüküm, tarafların kanunen geçerli diğer delilleri sunma hakkını ortadan kaldırmaz ve münhasır delil sözleşmesi niteliğinde değildir.
26. DEVİR
26.1. Kullanıcı, işbu Kullanım Koşulları’ndan doğan hak ve yükümlülüklerini Şirketin yazılı izni olmaksızın üçüncü kişilere devredemez.
26.2. Şirket, Uygulamanın veya faaliyetlerinin devri, birleşme, bölünme, yeniden yapılandırma veya grup içi devir hâllerinde işbu Kullanım Koşulları’nı ve ilgili hak ve yükümlülükleri, yürürlükteki mevzuata uygun olarak devredebilir.
27. BÖLÜNEBİLİRLİK VE FERAGAT
27.1. İşbu Kullanım Koşulları’nın herhangi bir hükmünün geçersiz veya uygulanamaz hâle gelmesi, diğer hükümlerin geçerliliğini etkilemez.
27.2. Geçersiz hüküm, tarafların iradesine ve hükmün ekonomik amacına en yakın geçerli düzenleme ile değiştirilmiş sayılır.
27.3. Şirketin herhangi bir hakkını kullanmaması veya geç kullanması, ilgili haktan feragat ettiği anlamına gelmez.
28. UYGULANACAK HUKUK VE UYUŞMAZLIKLARIN ÇÖZÜMÜ
28.1. İşbu Kullanım Koşulları’nın yorumlanması ve uygulanmasında Türk hukuku uygulanır.
28.2. Taraflar arasında doğabilecek uyuşmazlıklarda, görev ve yetkiye ilişkin emredici mevzuat hükümleri saklıdır.
28.3. Kullanıcının tacir veya kamu tüzel kişisi olması ve kanunen yetki sözleşmesi yapılabilmesi hâlinde, uyuşmazlıkların çözümünde İstanbul Anadolu Mahkemeleri ve İcra Daireleri yetkilidir.
28.4. Kullanıcının tüketici sıfatını taşıdığı hâllerde, tüketici hakem heyetleri ve tüketici mahkemelerine ilişkin yasal yetki kuralları uygulanır.
29. İLETİŞİM
Kullanıcı, Uygulama ve işbu Kullanım Koşulları hakkındaki soru, talep ve şikâyetlerini aşağıdaki kanallardan Şirkete iletebilir:
Şirket Unvanı / Ad Soyad: Ali Haydar Osmanoğlu
Adres: Ümraniye / İstanbul
30. YÜRÜRLÜK
30.1. İşbu Kullanım Koşulları 22/09/2026tarihinde yürürlüğe girmiştir.
30.2. Kullanıcının üyelik işlemini tamamlaması veya Uygulamayı kullanmaya başlamasıyla işbu Kullanım Koşulları Kullanıcı bakımından hüküm doğurur.
30.3. Kullanıcı, işbu Kullanım Koşulları’nı elektronik ortamda okuyabildiğini, kaydedebildiğini ve erişilebilir şekilde kendisine sunulduğunu kabul eder.`,
  },
  {
    id: 'uyelik-sozlesmesi',
    title: 'Üyelik Sözleşmesi',
    buttonText: `Üyelik Sözleşmesi'ni Okudum ve Kabul Ediyorum`,
    required: true,
    body: `TAKSİ SÜRÜCÜSÜ ÜYELİK SÖZLEŞMESİ
Yürürlük Tarihi: 22/09/2026
1. TARAFLAR
İşbu Taksi Sürücüsü Üyelik Sözleşmesi (“Sözleşme”);
Bir tarafta, Ümraniye / İstanbul adresinde mukim Ali Haydar Osmanoğlu (işbu Sözleşme’nin kurulduğu tarihte bir ticaret şirketi henüz kurulmamışsa, buraya Uygulamayı gerçek kişi sıfatıyla işleten kişinin adı ve soyadı yazılır; varsa MERSİS numarası, vergi dairesi ve vergi numarası madde 33’te belirtilir) (“Şirket”)
ile
diğer tarafta, TaksiSOS isimli mobil uygulamaya üye olmak amacıyla elektronik ortamda işbu Sözleşme’yi onaylayan taksi sürücüsü (“Üye”)
arasında elektronik ortamda kurulmuştur.
Şirket ve Üye bundan sonra ayrı ayrı “Taraf”, birlikte “Taraflar” olarak anılacaktır.
2. TANIMLAR
İşbu Sözleşme’de;
Uygulama: Şirket tarafından işletilen TaksiSOS isimli mobil uygulamayı, internet sitesini ve bunlarla bağlantılı dijital hizmetleri,
Hizmetler: Üyelik doğrulaması, Risk Bildirimi, Acil SOS Bildirimi, canlı konum paylaşımı, yakınlık eşleştirmesi, bildirim gönderimi, acil durum kişisine bilgi verilmesi ve Uygulama üzerinden sunulan diğer hizmetleri,
Üye: İşbu Sözleşme’yi kabul eden, üyelik şartlarını sağlayan ve Uygulamadan yararlanan taksi sürücüsünü,
Doğrulanmış Üye: Kimliği, iletişim bilgileri, taksi sürücülüğü yetkisi ve gerekli görülmesi hâlinde araç veya plaka bilgileri Şirket tarafından doğrulanan Üyeyi,
Üyelik Hesabı: Üyenin Uygulamaya erişmek ve Hizmetlerden yararlanmak amacıyla oluşturduğu kişisel hesabı,
Risk Bildirimi: Üyenin henüz fiilî bir saldırıyla karşılaşmadığı ancak yolcunun davranışları veya yolculuk şartları nedeniyle güvenliğine ilişkin makul bir endişe duyduğu hâllerde oluşturduğu bildirimi,
Acil SOS Bildirimi: Üyenin saldırı, ciddi tehdit, gasp, silah görülmesi, hürriyetinin sınırlandırılması, aracın zorla yönlendirilmesi veya benzeri yakın ve ciddi bir tehlikeyle karşılaşması hâlinde oluşturduğu bildirimi,
Canlı Konum: Üyenin mobil cihazından alınan ve ilgili güvenlik bildirimi süresince sınırlı sayıdaki Doğrulanmış Üyelere, acil durum kişilerine veya şartları bulunması hâlinde yetkili mercilere aktarılabilen konum bilgisini,
Acil Durum Kişisi: Üyenin isteğe bağlı olarak belirlediği ve bir Risk Bildirimi veya Acil SOS Bildirimi hâlinde kendisine bilgi verilmesini istediği üçüncü bir gerçek kişiyi,
Aktif Güvenlik Modu: Üyenin alarm oluşturmadığı dönemde, yakındaki güvenlik bildirimlerinin kendisine ulaştırılması amacıyla konumunun sistem tarafından yakınlık eşleştirmesinde kullanıldığı isteğe bağlı özelliği,
Olay Kaydı: Risk Bildirimi veya Acil SOS Bildiriminin zamanı, türü, konumu, süresi, gerçekleştirilen işlemler ve erişim kayıtlarından oluşan kayıtları,
Yolcu: Üyenin sunduğu taksi taşımacılığı hizmetinden yararlanan veya taksi içerisinde bulunan gerçek kişiyi,
Kullanım Koşulları: Uygulamanın kullanımına, bildirimlerin oluşturulmasına, yasaklı davranışlara ve Üyenin Uygulama üzerindeki yükümlülüklerine ilişkin kuralları,
Aydınlatma Metni: Üyenin kişisel verilerinin işlenmesine ilişkin olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında sunulan bilgilendirme metnini,
Açık Rıza Beyanı: Yalnızca açık rıza gerektiren ve isteğe bağlı kişisel veri işleme faaliyetleri bakımından Üyenin ayrı ayrı tercih yapabildiği metni,
ifade eder.
3. SÖZLEŞMENİN KONUSU VE AMACI
3.1. İşbu Sözleşme’nin konusu; Üyenin Uygulamaya üye olması, üyelik hesabının oluşturulması, üyelik bilgilerinin doğrulanması, Hizmetlerden yararlanması ve Tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.
3.2. Uygulama; taksi sürücülerinin yolculuk sırasında kendilerini risk altında hissetmeleri veya yakın ve ciddi bir tehlikeyle karşılaşmaları hâlinde, sınırlı sayıdaki Doğrulanmış Üyeye bildirim gönderilmesini, tehlike altında bulunan Üyenin konumunun belirli süreyle takip edilmesini ve resmî acil yardım kanallarına ulaşılmasının kolaylaştırılmasını amaçlayan dijital bir güvenlik destek sistemidir.
3.3. Uygulama;
Kolluk kuvveti,
Özel güvenlik hizmeti,
Acil çağrı merkezi,
Ambulans veya kurtarma hizmeti,
Sigorta veya güvence hizmeti,
Profesyonel müdahale veya olay yeri yönetim hizmeti
niteliğinde değildir.
3.4. Uygulama, 112 Acil Çağrı Merkezi’nin veya diğer resmî yardım kanallarının alternatifi değildir. Yakın ve ciddi bir tehlike hâlinde Üyenin öncelikle kendi güvenliğini sağlaması ve mümkün olan en kısa sürede 112 Acil Çağrı Merkezi ile iletişime geçmesi gerekir.
3.5. Uygulamanın herhangi bir kamu kurumuyla teknik entegrasyonu bulunmadığı sürece, Uygulama üzerinden oluşturulan bir bildirimin kolluk kuvvetlerine, 112 Acil Çağrı Merkezine veya başka bir kamu kurumuna kendiliğinden iletildiği kabul edilemez.
4. SÖZLEŞMENİN KURULMASI
4.1. İşbu Sözleşme, Üyenin;
Sözleşme hükümlerini elektronik ortamda görüntülemesi,
Sözleşme’ye erişme ve Sözleşme’yi kaydetme imkânının kendisine sunulması,
Gerekli üyelik bilgilerini girmesi,
“Üyelik Sözleşmesi’ni okudum ve kabul ediyorum” veya aynı anlama gelen onay kutusunu işaretlemesi,
Üyelik işlemini tamamlaması
ile elektronik ortamda kurulur.
4.2. Üye, elektronik onay işleminin ıslak imza ile kurulmuş sözleşmeler gibi kendisini bağlayacağını kabul eder.
4.3. Üyelik Sözleşmesi’nin kabulü; Aydınlatma Metni’nin onaylanması veya açık rıza verilmesi anlamına gelmez. Açık rıza gerektiren işlemler bakımından Üyenin tercihleri ayrı ekran ve onay kutuları üzerinden alınır.
4.4. Şirket, sözleşmenin kurulmasına ilişkin tarih, saat, IP adresi, cihaz bilgisi, Sözleşme sürümü ve elektronik onay kayıtlarını hukuki yükümlülükleri kapsamında saklayabilir.
4.5. Şirket, üyelik başvurusunu inceleyerek kabul veya reddetme, ek bilgi ve belge isteme ve Üyenin hesabını doğrulama tamamlanıncaya kadar sınırlama hakkına sahiptir.
5. ÜYELİK ŞARTLARI
5.1. Uygulamaya üye olabilmek için Üyenin;
On sekiz yaşını doldurmuş olması,
Fiil ehliyetine sahip olması,
Geçerli bir sürücü belgesine sahip olması,
İlgili belediye, meslek kuruluşu veya mevzuat tarafından aranan taksi sürücülüğü şartlarını sağlaması,
Taksi sürücülüğü yapmaya yetkili olması,
Kendisinden talep edilen bilgileri doğru ve eksiksiz şekilde sunması,
İşbu Sözleşme ile Kullanım Koşulları’nı kabul etmesi
gerekir.
5.2. Üye, Uygulamayı taksi sürücülüğü faaliyetiyle bağlantılı mesleki amaçlarla kullandığını kabul eder. Emredici mevzuat kapsamında farklı bir hukuki statünün bulunması hâlinde ilgili emredici hükümler saklıdır.
5.3. Üye, üyelik şartlarını kaybetmesi, sürücü belgesinin geri alınması, taksi sürücülüğü yetkisinin sona ermesi veya askıya alınması hâlinde durumu derhâl Şirkete bildirmekle yükümlüdür.
5.4. Şirket, üyeliğin devamı süresince belirli aralıklarla yeniden doğrulama yapılmasını veya güncel belge sunulmasını talep edebilir.
6. ÜYELİK BİLGİLERİNİN DOĞRULANMASI
6.1. Şirket, üyelik başvurusu sırasında veya üyeliğin devamı süresince aşağıdaki bilgi ve belgeleri talep edebilir:
Ad, soyadı ve iletişim bilgileri,
Kimlik doğrulama bilgileri,
Sürücü belgesi,
Taksi kullanım kartı veya çalışma belgesi,
Taksi plakası ve araç ruhsatı bilgileri,
Bağlı olunan taksi durağı, kooperatif, filo, esnaf odası veya ilgili meslek kuruluşu bilgileri,
Taksi sürücülüğü yetkisini gösteren diğer bilgi ve belgeler.
6.2. Üye, Şirkete sunduğu bilgi ve belgelerin doğru, güncel, eksiksiz ve kendisine ait olduğunu kabul eder.
6.3. Şirket; Üyenin açıkça bilgilendirilmesi ve gerekli hukuki şartların sağlanması kaydıyla, sunulan bilgilerin doğruluğunu ilgili taksi durağı, kooperatif, filo, belediye, meslek kuruluşu veya yetkili kurumlar nezdinde teyit edebilir.
6.4. Başkasına ait, sahte, değiştirilmiş, geçerliliğini yitirmiş veya gerçeğe aykırı bilgi ve belge kullanılması hâlinde Şirket üyelik başvurusunu reddedebilir, hesabı askıya alabilir veya üyeliği derhâl sona erdirebilir.
6.5. Üyelik başvurusunun alınması, üyeliğin kesin olarak kabul edildiği anlamına gelmez. Üyelik, Şirketin doğrulama işlemini tamamlaması ve hesabı aktive etmesiyle kesinleşir.
7. ÜYELİK HESABI VE HESAP GÜVENLİĞİ
7.1. Üyelik hesabı kişiye özeldir. Hesap üçüncü kişilere devredilemez, kiralanamaz, kullandırılamaz veya başka bir sürücüyle ortak kullanılamaz.
7.2. Her gerçek kişi, Şirket tarafından aksi kabul edilmedikçe yalnızca bir Üyelik Hesabı oluşturabilir.
7.3. Üye; şifre, tek kullanımlık doğrulama kodu, cihaz erişimi ve diğer hesap güvenliği bilgilerinin gizliliğini korumakla yükümlüdür.
7.4. Üye, hesabının yetkisiz şekilde kullanıldığını, telefonunun kaybolduğunu veya hesap bilgilerinin üçüncü kişilerin eline geçtiğini fark etmesi hâlinde Şirkete derhâl bildirimde bulunmalıdır.
7.5. Üyenin kendi kusuruyla hesap veya cihaz güvenliğini sağlamaması nedeniyle meydana gelen işlemlerden Üye sorumludur.
7.6. Şirket; hesap güvenliğinin tehlikeye girdiğini, şüpheli oturum açıldığını, farklı kişilerce kullanım yapıldığını veya olağan dışı işlem gerçekleştirildiğini tespit etmesi hâlinde;
Ek doğrulama isteyebilir,
Oturumları sonlandırabilir,
Hesabı geçici olarak sınırlandırabilir,
Şifre yenileme işlemi gerçekleştirebilir,
Güvenlik riski sona erinceye kadar Hizmetlere erişimi durdurabilir.
8. HİZMETLERİN KAPSAMI
8.1. Şirket, Uygulamanın teknik imkânları ve Üyenin üyelik paketi kapsamında aşağıdaki hizmetlerin tamamını veya bir kısmını sunabilir:
Risk Bildirimi oluşturulması,
Acil SOS Bildirimi oluşturulması,
Canlı Konum paylaşılması,
Yakındaki Doğrulanmış Üyelerin belirlenmesi,
Güvenlik bildiriminin sınırlı sayıdaki Üyelere gönderilmesi,
Acil durum kişisine bildirim gönderilmesi,
112’yi aramayı kolaylaştıran bağlantı veya buton sunulması,
Olay durumunun güncellenmesi,
Alarm geçmişinin görüntülenmesi,
Destek ve şikâyet hizmetleri,
Güvenli sürüş ve acil durum bilgilendirmeleri.
8.2. Şirket, Uygulamanın işlevlerini geliştirebilir, değiştirebilir, yeni özellikler ekleyebilir veya hukuki ve teknik nedenlerle belirli özellikleri kaldırabilir.
8.3. Sözleşmenin esaslı unsurlarını, ücretlendirmeyi veya Üyenin yükümlülüklerini etkileyen değişiklikler yürürlüğe girmeden önce Üyeye bildirilir.
8.4. Üyenin cihazının Uygulamanın güncel teknik şartlarını karşılamaması hâlinde bazı Hizmetler kullanılamayabilir.
9. KONUM TABANLI HİZMETLER
9.1. Risk Bildirimi, Acil SOS Bildirimi ve yakınlık eşleştirmesi fonksiyonlarının çalışabilmesi için Üyenin mobil cihazında konum hizmetlerinin etkinleştirilmesi ve Uygulamaya gerekli cihaz izinlerinin verilmesi gerekebilir.
9.2. Üyenin bir Risk Bildirimi veya Acil SOS Bildirimi oluşturması hâlinde Canlı Konumu, olayın niteliğine göre belirlenen sınırlı sayıdaki Doğrulanmış Üyeye gösterilebilir.
9.3. Canlı Konuma erişebilecek Üyeler;
Bildirimi oluşturan Üyeye olan mesafe,
Sürüş yönü,
Uygulama içerisindeki aktiflik durumu,
Alarm türü ve seviyesi,
Teknik kapasite,
Güvenlik ve kötüye kullanım kriterleri
dikkate alınarak sistem tarafından belirlenebilir.
9.4. Alarm kapatıldığında diğer Üyelerin Canlı Konuma erişimi sona erdirilir.
9.5. Aktif Güvenlik Modu’nun kullanılması isteğe bağlıdır. Bu modun çalışabilmesi için gerekli konum izinleri, Uygulama ayarları veya mobil cihaz ayarları üzerinden yönetilebilir.
9.6. Şirket, Üyenin alarm oluşturmadığı normal kullanım sırasında konumunu diğer Üyelere açık bir harita üzerinde göstermez.
9.7. Üye, başka bir Üyeye ait konum bilgisini yalnızca ilgili güvenlik bildiriminin amacı doğrultusunda kullanabilir.
10. RİSK BİLDİRİMİ VE ACİL SOS KULLANIMI
10.1. Risk Bildirimi, henüz fiilî saldırı bulunmamakla birlikte Üyenin güvenliğine ilişkin makul ve ciddi bir endişe duyduğu durumlarda kullanılmalıdır.
10.2. Acil SOS Bildirimi yalnızca saldırı, ciddi tehdit, gasp, silah görülmesi, zorla yönlendirme, araçtan çıkmanın engellenmesi veya benzeri yakın ve ciddi tehlikelerde kullanılmalıdır.
10.3. Üye, Risk Bildirimi ve Acil SOS Bildirimini;
Şaka veya deneme amacıyla,
Ticari rekabet amacıyla,
Başka bir sürücüyü veya yolcuyu itibarsızlaştırmak amacıyla,
Kişisel husumet nedeniyle,
Yolcudan ücret tahsil etmek veya yolcuya baskı kurmak amacıyla,
Gerçeğe aykırı olay oluşturmak amacıyla
kullanamaz.
10.4. Yanlışlıkla oluşturulan alarm, Üye tarafından mümkün olan en kısa sürede kapatılmalıdır.
10.5. Tehlikenin sona ermesi hâlinde Üye alarm durumunu güncellemeli veya bildirimi kapatmalıdır.
10.6. Üye, alarm sırasında kendi güvenliğini veya trafik güvenliğini tehlikeye düşürecek şekilde mobil cihaz kullanmamalıdır.
10.7. Acil bir durumda yalnızca Uygulamaya güvenilmemeli; şartların elverdiği ölçüde 112 Acil Çağrı Merkezi aranmalıdır.
11. BİLDİRİM ALAN ÜYELERİN YÜKÜMLÜLÜKLERİ
11.1. Risk Bildirimi veya Acil SOS Bildirimi alan Üye, bildirimin kendisine kolluk veya özel güvenlik yetkisi vermediğini kabul eder.
11.2. Bildirimi alan Üye, kural olarak;
Olay yerine yaklaşmamalı,
Taksi veya başka bir aracı takip etmemeli,
Aracın yolunu kesmemeli,
Yolcuyu sorgulamamalı veya alıkoymamalı,
Fiziksel müdahalede bulunmamalı,
Tehdit, hakaret, cebir veya silah kullanmamalı,
Kendi güvenliğini ve trafik güvenliğini tehlikeye atmamalıdır.
11.3. Bildirimi alan Üyenin önceliği güvenli mesafede kalmak ve gerekli görmesi hâlinde 112’ye doğru bilgi aktarmaktır.
11.4. Uygulama üyeliği, Üyelere mevzuatta öngörülen sınırların ötesinde yakalama, takip, arama, sorgulama veya zor kullanma yetkisi vermez.
11.5. Üyenin meşru savunma, zorunluluk hâli veya suçüstü kapsamında gerçekleştirdiğini ileri sürdüğü eylemlerin hukuka uygunluğu somut olayın şartlarına göre belirlenir. Gerçekleştirilen eylemlerin hukuki ve cezai sorumluluğu ilgili Üyeye aittir.
11.6. Üyelerin toplu şekilde olay yerine yönlendirilmesi, müdahale grubu oluşturulması veya Uygulama dışında organize edilmesi yasaktır.
12. YOLCULARA VE ÜÇÜNCÜ KİŞİLERE İLİŞKİN YÜKÜMLÜLÜKLER
12.1. Uygulamanın amacı, yolcuların kimliğini tespit etmek veya yolcular hakkında sürekli bir veri tabanı oluşturmaktır değildir.
12.2. Üye, olayın anlaşılması veya yetkili mercilere başvuru yapılması için zorunlu olmadığı sürece yolcuya ait;
Ad ve soyadı,
Telefon numarası,
Kimlik bilgisi,
Adres bilgisi,
Fotoğraf veya görüntü,
Sağlık bilgisi,
Özel hayat bilgisi
gibi verileri Uygulamaya girmemelidir.
12.3. Üye, yolcular hakkında kalıcı puanlama, kara liste, risk profili veya “tehlikeli yolcu” listesi oluşturamaz.
12.4. Üye; yolcuya, diğer Üyelere veya üçüncü kişilere ilişkin verileri sosyal medyada, mesajlaşma gruplarında veya Uygulama dışındaki başka platformlarda paylaşamaz.
12.5. Üye, olay açıklamalarında hakaret, tehdit, ayrımcı ifade, kesinleşmemiş suç isnadı veya kişilik haklarını ihlal eden ifadeler kullanamaz.
12.6. Üyenin Uygulama dışında gerçekleştirdiği ses veya görüntü kayıtları ile bunların hukuka uygunluğundan Üye sorumludur.
13. ÜYENİN GENEL YÜKÜMLÜLÜKLERİ
13.1. Üye;
Uygulamayı hukuka ve dürüstlük kurallarına uygun kullanmak,
Üyelik bilgilerini güncel tutmak,
Hesap güvenliğini sağlamak,
Uygulamanın güvenlik talimatlarına uymak,
Gerçeğe aykırı alarm oluşturmamak,
Trafik kurallarına uymak,
Diğer Üyelerin ve yolcuların kişisel verilerini korumak,
Şirketin sistemlerine zarar vermemek,
Yetkisiz erişim girişiminde bulunmamak,
Uygulamayı yasa dışı amaçlarla kullanmamak
zorundadır.
13.2. Üye, Uygulama üzerinden edindiği bilgi ve verileri ticari amaçla kullanamaz, satamaz veya üçüncü kişilere aktaramaz.
13.3. Üye, Uygulamayı kullanırken kamu düzenini, trafik güvenliğini, yolcu güvenliğini ve üçüncü kişilerin haklarını gözetmekle yükümlüdür.
13.4. Üye, Uygulamanın çalışma biçimini bozacak robot, otomasyon, zararlı yazılım, tersine mühendislik veya benzeri yöntemleri kullanamaz.
13.5. Üye, Şirketin veya diğer hak sahiplerinin fikrî ve sınai mülkiyet haklarını ihlal edemez.
14. ŞİRKETİN HAK VE YÜKÜMLÜLÜKLERİ
14.1. Şirket;
Uygulamanın teknik olarak işletilmesi,
Üyelik başvurularının değerlendirilmesi,
Üyelik doğrulama süreçlerinin yürütülmesi,
Hizmetlerin sunulması,
Güvenlik ve erişim tedbirlerinin alınması,
Kullanıcı destek taleplerinin değerlendirilmesi,
Kötüye kullanımın önlenmesine yönelik sistemlerin kurulması
için makul çabayı gösterir.
14.2. Şirket, Uygulamanın kesintisiz, hatasız, gecikmesiz veya her cihazla tam uyumlu çalışacağını garanti etmez.
14.3. Şirket, güvenlik açığı, teknik arıza, hukuki yükümlülük, bakım çalışması veya kötüye kullanım riski bulunması hâlinde Uygulamanın tamamını veya belirli özelliklerini geçici olarak durdurabilir.
14.4. Şirket, bir bildirimin doğru veya gerçek olduğunu garanti etmez. Bildirimler, bildirimi oluşturan Üyenin beyanına ve cihazdan alınan teknik verilere dayanır.
14.5. Şirket, Üyelerin olay yerine ulaşmasını, fiziksel müdahalede bulunmasını veya herhangi bir kişiyi takip etmesini istemez ve organize etmez.
14.6. Şirket, yetkili kamu makamlarından usulüne uygun bir talep gelmesi hâlinde ilgili kayıtları yürürlükteki mevzuat kapsamında paylaşabilir.
15. ÜCRETLENDİRME VE ÖDEME
15.1. Uygulamanın üyelik ve temel Hizmetleri şu an için ücretsizdir. Şirket, ileride ücretli bir üyelik veya hizmet paketi sunmak istemesi hâlinde, işbu maddenin ve madde 25’in (Sözleşme’de Değişiklik) öngördüğü usule uygun olarak Sözleşme’yi güncelleyerek yeni ücret, paket ve ödeme koşullarını Üyeye önceden bildirir ve Üyenin açık kabulüne sunar.
15.2. Ücretli bir üyelik modeli uygulanması hâlinde ücret, faturalandırma dönemi, yenileme şartları ve ödeme yöntemleri üyelik işlemi tamamlanmadan önce Üyeye gösterilir.
15.3. Ücretsiz sunulan Hizmetlerin ileride ücretli hâle getirilmesi, Üyenin ayrıca bilgilendirilmesi ve ücretli üyelik koşullarını açıkça kabul etmesiyle mümkündür. Üyenin sessiz kalması ücretli üyeliği kabul ettiği şeklinde yorumlanamaz.
15.4. Aboneliğin otomatik olarak yenileneceği bir model uygulanıyorsa bu husus, yenileme dönemi ve iptal yöntemi ödeme öncesinde açıkça gösterilir.
15.5. Şirket, üyelik ücretlerinde değişiklik yapabilir. Ücret değişikliği mevcut ücretli dönem bakımından geriye yürütülmez ve yeni döneme ilişkin ücret değişikliği yürürlüğe girmeden önce Üyeye bildirilir.
15.6. Üye, ücretli Hizmetlere ilişkin ödeme bilgilerinin doğru ve güncel olmasını sağlamakla yükümlüdür.
15.7. Ödemenin gerçekleştirilememesi hâlinde ücretli özellikler sınırlandırılabilir veya durdurulabilir. Acil güvenlik özelliklerinin ücretsiz sunulup sunulmayacağı ilgili üyelik paketinde ayrıca belirtilir.
15.8. İade, iptal ve cayma hakları Üyenin hukuki statüsüne, satın alınan hizmete ve emredici mevzuat hükümlerine göre uygulanır.
16. ÜÇÜNCÜ TARAF HİZMETLERİ
16.1. Uygulama; harita, konum, bulut bilişim, anlık bildirim, kimlik doğrulama, ödeme, analiz, iletişim ve hata izleme hizmetleri bakımından üçüncü taraf hizmet sağlayıcılardan yararlanabilir.
16.2. Üçüncü taraf hizmet sağlayıcıların kendi hizmet koşulları ve gizlilik politikaları bulunabilir.
16.3. Üyenin üçüncü taraf bir hizmeti kullanması için ayrıca hesap oluşturması veya ilgili hizmet sağlayıcının koşullarını kabul etmesi gerekebilir.
16.4. Şirket, üçüncü taraf hizmet sağlayıcının kendi sisteminden kaynaklanan kesinti, hata veya erişim sorunlarından kendi kusuru bulunmadığı ölçüde sorumlu değildir.
16.5. Uygulama üzerinden üçüncü taraf internet sitelerine bağlantı verilmesi, Şirketin ilgili hizmeti garanti ettiği veya ilgili işletmeyle ortaklık ilişkisi bulunduğu anlamına gelmez.
17. KİŞİSEL VERİLERİN KORUNMASI
17.1. Üyenin kişisel verileri, Şirket tarafından veri sorumlusu sıfatıyla, Aydınlatma Metni’nde açıklanan amaç, yöntem ve hukuki sebepler kapsamında işlenir.
17.2. Aydınlatma Metni, Üyelik Sözleşmesi’nin kurulmasından önce veya kişisel verilerin elde edilmesi sırasında Üyeye sunulur.
17.3. Açık rıza gerektiren isteğe bağlı işlemler bakımından açık rıza, Üyelik Sözleşmesi’nin kabulünden ayrı şekilde alınır.
17.4. Üyenin temel üyelik ve SOS hizmetinin sunulması için gerekli olan ve kanuni bir işleme şartına dayanan kişisel veri işleme faaliyetleri, genel bir açık rıza şartına bağlanmaz.
17.5. Üye, başka bir Üyeye ait Canlı Konum veya olay bilgisine erişmesi hâlinde bu verileri yalnızca ilgili güvenlik bildirimi amacıyla kullanacağını kabul eder.
17.6. Üye, diğer Üyelere veya yolculara ait verileri kopyalayamaz, arşivleyemez, üçüncü kişilere aktaramaz veya sosyal medyada yayımlayamaz.
17.7. Üyenin KVKK kapsamındaki hakları ve başvuru yöntemleri Aydınlatma Metni’nde açıklanmaktadır.
17.8. Kişisel verilerin yurt dışına aktarılmasının söz konusu olması hâlinde, yürürlükteki mevzuatta öngörülen aktarım şartları ve uygun güvence mekanizmaları uygulanır.
18. TİCARİ ELEKTRONİK İLETİLER
18.1. Şirket; üyeliğin kurulması, hesap güvenliği, alarm bildirimleri, teknik güncellemeler, sözleşme değişiklikleri ve Hizmetlerin sunulması için zorunlu bildirimleri Üyeye gönderebilir.
18.2. Hizmetin sunulması için gerekli operasyonel ve güvenlik bildirimleri, pazarlama iletişimi niteliğinde değildir.
18.3. Reklam, kampanya, promosyon ve pazarlama amaçlı ticari elektronik iletiler, yürürlükteki mevzuat uyarınca gerekli onayın alınması hâlinde gönderilir.
18.4. Ticari elektronik ileti onayı, işbu Sözleşme’nin kabulünden ve KVKK açık rızasından ayrı olarak alınır.
18.5. Üye, ticari elektronik ileti tercihini mevzuatta öngörülen yöntemlerle her zaman değiştirebilir.
19. FİKRÎ VE SINAİ MÜLKİYET HAKLARI
19.1. Uygulamanın;
Yazılımı,
Kaynak ve nesne kodları,
Arayüzü,
Veri tabanı yapısı,
Algoritmaları,
Marka ve logosu,
Tasarım ve görselleri,
Metinleri,
Alan adı ve diğer bütün unsurları
üzerindeki fikrî ve sınai mülkiyet hakları Şirkete veya ilgili hak sahiplerine aittir.
19.2. Üyeye, üyeliği devam ettiği sürece Uygulamayı işbu Sözleşme’ye uygun olarak kullanabilmesi için sınırlı, devredilemez, alt lisans verilemez ve münhasır olmayan bir kullanım hakkı tanınır.
19.3. Üye, Uygulamayı veya herhangi bir unsurunu;
Kopyalayamaz,
Çoğaltamaz,
Değiştiremez,
Dağıtamaz,
Satamaz veya kiralayamaz,
Tersine mühendisliğe tabi tutamaz,
Benzer bir hizmet geliştirmek amacıyla kullanamaz.
19.4. İşbu Sözleşme, herhangi bir fikrî veya sınai mülkiyet hakkının Üyeye devredildiği şeklinde yorumlanamaz.
20. HİZMET KESİNTİLERİ VE MÜCBİR SEBEP
20.1. Uygulamanın çalışması; internet bağlantısı, mobil şebeke, GPS sinyali, cihaz donanımı, işletim sistemi, batarya seviyesi, uygulama izinleri ve üçüncü taraf hizmetlere bağlıdır.
20.2. Aşağıdaki nedenlerle Hizmetler geçici veya sürekli olarak kesintiye uğrayabilir:
İnternet veya mobil şebeke kesintileri,
GPS sinyalinin alınamaması,
Üyenin cihazının kapalı veya şarjının bitmiş olması,
İşletim sistemi veya cihaz izinlerinin kapalı olması,
Sunucu veya altyapı arızaları,
Siber saldırı ve güvenlik olayları,
Bakım ve güncelleme çalışmaları,
Kamu makamlarının kararları,
Doğal afet, savaş, terör, salgın, toplumsal olay ve benzeri mücbir sebepler.
20.3. Tarafların kontrolü dışında ortaya çıkan ve yükümlülüklerin yerine getirilmesini engelleyen mücbir sebep hâllerinde, etkilenen Taraf mücbir sebebin devam ettiği süre boyunca sorumlu tutulmaz.
20.4. Üye, acil durumlarda yalnızca Uygulamaya güvenmemesi gerektiğini kabul eder.
21. SORUMLULUĞUN SINIRLANDIRILMASI
21.1. Şirket, Uygulamanın teknik olarak işletilmesinden ve kendi kontrol alanındaki makul güvenlik tedbirlerinin alınmasından sorumludur.
21.2. Şirket;
Üyelerin veya yolcuların fiillerinden,
Gerçeğe aykırı, eksik veya geç bildirimlerden,
Üyelerin fiziksel müdahale veya takip eylemlerinden,
Üyenin cihaz, internet, GPS veya batarya sorunlarından,
Üyenin cihaz izinlerini kapatmasından,
112 veya diğer kamu birimlerinin müdahale süresinden,
Üyelerin trafik kurallarına aykırı davranışlarından,
Uygulama dışında yapılan bilgi veya görüntü paylaşımlarından,
Üyenin hesap güvenliğini sağlamamasından
kendi kusuru bulunmadığı ölçüde sorumlu değildir.
21.3. Şirket; bir saldırının önleneceğini, alarmın mutlaka diğer Üyelere ulaşacağını, herhangi bir Üyenin olay yerine ulaşacağını veya yetkili makamların belirli bir sürede müdahale edeceğini garanti etmez.
21.4. Şirket, Üyenin can ve mal güvenliğini garanti eden bir sigorta, kolluk veya özel güvenlik hizmeti sağlayıcısı değildir.
21.5. Şirketin kastı, ağır kusuru veya emredici mevzuat gereği sınırlandırılması mümkün olmayan sorumlulukları saklıdır.
21.6. Üyenin işbu Sözleşme’ye veya hukuka aykırı davranışı nedeniyle Şirketin, diğer Üyelerin, yolcuların veya üçüncü kişilerin zarara uğraması hâlinde Üye, kendi kusuru ve sorumluluğu oranında meydana gelen zarardan sorumludur.
22. KÖTÜYE KULLANIM VE YAPTIRIMLAR
22.1. Aşağıdaki durumlar Uygulamanın kötüye kullanılması sayılır:
Kasıtlı olarak gerçeğe aykırı alarm oluşturulması,
Tekrarlanan ve açıklanamayan yanlış alarm kullanımı,
Yolcular hakkında kara liste oluşturulması,
Diğer Üyelerin konumlarının takip amacıyla kullanılması,
Toplu müdahale veya takip organizasyonu yapılması,
Yolcu veya Üye bilgilerinin üçüncü kişilerle paylaşılması,
Başka bir kişiye ait hesabın kullanılması,
Sahte bilgi veya belge sunulması,
Uygulamanın teknik güvenliğinin tehlikeye atılması,
Diğer Üyelere veya yolculara yönelik tehdit ve taciz gerçekleştirilmesi.
22.2. Kötüye kullanım şüphesi hâlinde Şirket;
Üyeden açıklama isteyebilir,
Belge ve doğrulama talep edebilir,
Belirli özellikleri sınırlandırabilir,
Hesabı geçici olarak askıya alabilir,
Üyeliği sona erdirebilir,
Gerekli hâllerde yetkili makamlara başvurabilir.
22.3. Acil güvenlik riski bulunan, sahte belge kullanılan veya üçüncü kişilerin can ve mal güvenliğini tehlikeye atan durumlarda Şirket, Üyeden önceden savunma istemeksizin hesabı geçici olarak askıya alabilir.
23. ÜYELİĞİN ASKIYA ALINMASI
23.1. Şirket aşağıdaki hâllerde Üyelik Hesabını geçici olarak askıya alabilir:
Üyelik bilgilerinin doğrulanamaması,
Üyelik bilgilerinin güncel olmaması,
Taksi sürücülüğü yetkisinin askıya alınması,
Hesap güvenliği riski bulunması,
Kötüye kullanım şüphesinin araştırılması,
Üyenin ödeme yükümlülüğünü yerine getirmemesi,
Teknik veya hukuki zorunluluk ortaya çıkması,
Yetkili makam talebi bulunması.
23.2. Askıya alma süresince Üye, Uygulamanın tamamına veya belirli özelliklerine erişemeyebilir.
23.3. Askıya alma nedeni ortadan kalktığında hesap yeniden aktive edilebilir.
23.4. Şirket, mümkün olan hâllerde askıya alma nedeni ve yapılması gereken işlemler hakkında Üyeyi bilgilendirir.
24. SÖZLEŞMENİN SONA ERMESİ
24.1. Üye, Uygulama içerisindeki hesap kapatma seçeneğini kullanarak üyeliğini her zaman sona erdirebilir.
24.2. Şirket aşağıdaki hâllerde Sözleşme’yi haklı nedenle sona erdirebilir:
Üyenin üyelik şartlarını kaybetmesi,
Gerçeğe aykırı bilgi veya belge sunulması,
Hesabın üçüncü kişilere kullandırılması,
Kasıtlı veya tekrarlanan yanlış alarm oluşturulması,
Organize müdahale veya takip çağrısı yapılması,
Kişisel verilerin hukuka aykırı şekilde paylaşılması,
Uygulamanın güvenliğinin tehlikeye atılması,
İşbu Sözleşme veya Kullanım Koşulları’nın esaslı şekilde ihlal edilmesi,
Üyenin Şirket, diğer Üyeler veya yolcular bakımından ciddi güvenlik riski oluşturması,
Yetkili makam tarafından üyeliğin sona erdirilmesinin talep edilmesi.
24.3. İhlalin giderilebilir olması hâlinde Şirket, Üyeye ihlali gidermesi için makul bir süre verebilir. Güvenlik riski, sahte belge veya ağır ihlal hâllerinde Sözleşme derhâl sona erdirilebilir.
24.4. Şirket, Uygulama faaliyetini tamamen sona erdirmesi hâlinde Üyelere makul süre öncesinde bildirimde bulunarak Sözleşme’yi sona erdirebilir.
24.5. Sözleşme’nin sona ermesi, sona erme tarihinden önce doğmuş hak, borç ve sorumlulukları ortadan kaldırmaz.
24.6. Sözleşme sona erdikten sonra kişisel veriler, ilgili mevzuat ve saklama süreleri doğrultusunda silinir, yok edilir veya anonim hâle getirilir.
25. SÖZLEŞME’DE DEĞİŞİKLİK
25.1. Şirket; mevzuat değişiklikleri, güvenlik gereklilikleri, teknik geliştirmeler, yeni hizmetler veya iş modelindeki değişiklikler nedeniyle işbu Sözleşme’yi güncelleyebilir.
25.2. Üyenin hak ve yükümlülüklerini esaslı şekilde etkileyen değişiklikler yürürlüğe girmeden önce Uygulama içi bildirim, e-posta, SMS veya diğer uygun yöntemlerle Üyeye bildirilir.
25.3. Değişiklik, Üyenin ayrıca kabulünü gerektiriyorsa güncel Sözleşme Üyenin elektronik onayına sunulur.
25.4. Üye, esaslı değişiklikleri kabul etmemesi hâlinde üyeliğini sona erdirebilir.
25.5. Üyenin aleyhine olan ücret değişiklikleri, kabul edilmedikçe mevcut ücretli dönem bakımından uygulanmaz.
26. TEBLİGATLAR VE İLETİŞİM
26.1. Taraflar, üyelik sırasında belirtilen iletişim bilgilerinin geçerli bildirim adresleri olduğunu kabul eder.
26.2. Şirket; üyelik, hesap güvenliği, sözleşme değişikliği, ücretlendirme, bakım ve Hizmetlere ilişkin bildirimleri;
Uygulama içi bildirim,
Anlık bildirim,
E-posta,
SMS,
KEP
yöntemlerinden biriyle gönderebilir.
26.3. Üye, iletişim bilgilerindeki değişiklikleri Uygulama üzerinden güncellemekle yükümlüdür. Güncellenmeyen iletişim bilgilerine yapılan bildirimlerden kaynaklanan sonuçlardan Şirket, kendi kusuru bulunmadığı ölçüde sorumlu değildir.
26.4. Kanunen özel bir bildirim şeklinin zorunlu olduğu hâller saklıdır.
27. ELEKTRONİK KAYITLAR VE DELİL
27.1. Taraflar arasında çıkabilecek uyuşmazlıklarda;
Üyelik ve doğrulama kayıtları,
Elektronik onay kayıtları,
Sözleşme sürüm kayıtları,
Risk ve SOS kayıtları,
Konum ve erişim kayıtları,
Sistem ve sunucu logları,
Destek ve iletişim kayıtları,
Ödeme ve fatura kayıtları
hukuka uygun şekilde elde edilmiş olmaları kaydıyla delil olarak ileri sürülebilir.
27.2. İşbu madde, tarafların kanunen geçerli diğer delilleri sunma hakkını ortadan kaldırmaz ve münhasır delil sözleşmesi niteliğinde değildir.
28. DEVİR
28.1. Üye, işbu Sözleşme’den doğan hak ve yükümlülüklerini Şirketin yazılı onayı olmaksızın üçüncü kişilere devredemez.
28.2. Şirket; birleşme, bölünme, pay devri, işletme devri, yatırım, grup içi yeniden yapılandırma veya Uygulamanın devri hâlinde işbu Sözleşme’den doğan hak ve yükümlülüklerini, yürürlükteki mevzuata uygun olarak üçüncü kişilere devredebilir.
28.3. Devir nedeniyle veri sorumlusunun değişmesi hâlinde Üyeye gerekli bilgilendirme yapılır.
29. SÖZLEŞMENİN BÜTÜNLÜĞÜ
29.1. Aşağıdaki metinler işbu Sözleşme ile birlikte uygulanır:
[UYGULAMA ADI] Kullanım Koşulları,
Taksi Sürücüsü Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni,
İsteğe bağlı işlemler için sunulan Açık Rıza Beyanları,
Uygulama içerisinde yayımlanan güvenlik kuralları.
29.2. Üyelik Sözleşmesi ile Kullanım Koşulları arasında çelişki bulunması hâlinde, üyelik ilişkisinin kuruluşu ve sona ermesi bakımından işbu Sözleşme; Uygulamanın fiilî kullanımına ilişkin konularda Kullanım Koşulları uygulanır.
29.3. Aydınlatma Metni bilgilendirme metnidir ve taraflar arasında sözleşmesel bir açık rıza oluşturmaz.
29.4. Açık rıza verilmesi veya ticari elektronik ileti onayı, üyelik sözleşmesinin kurulması için zorunlu değildir; ancak ilgili isteğe bağlı özelliklerin sunulması için gerekli olabilir.
30. BÖLÜNEBİLİRLİK VE FERAGAT
30.1. İşbu Sözleşme’nin herhangi bir hükmünün geçersiz veya uygulanamaz olması, diğer hükümlerin geçerliliğini etkilemez.
30.2. Geçersiz veya uygulanamaz hüküm, Tarafların iradesine ve hükmün ekonomik amacına en yakın geçerli düzenlemeyle değiştirilmiş kabul edilir.
30.3. Taraflardan birinin herhangi bir hakkını kullanmaması veya geç kullanması, ilgili haktan feragat ettiği anlamına gelmez.
31. UYGULANACAK HUKUK VE UYUŞMAZLIKLARIN ÇÖZÜMÜ
31.1. İşbu Sözleşme’nin kurulması, yorumlanması ve uygulanmasında Türk hukuku uygulanır.
31.2. Üyenin Uygulamayı mesleki veya ticari faaliyeti kapsamında kullanan tacir veya esnaf niteliğinde olması ve kanunen yetki sözleşmesi yapılabilmesi hâlinde, işbu Sözleşme’den doğan uyuşmazlıkların çözümünde İstanbul Anadolu Mahkemeleri ve İcra Daireleri yetkilidir.
31.3. Görev ve yetkiye ilişkin emredici mevzuat hükümleri saklıdır.
31.4. Üyenin somut olay bakımından tüketici sıfatını taşıması hâlinde, tüketici hakem heyetleri ve tüketici mahkemelerine ilişkin emredici yetki hükümleri uygulanır.
31.5. Dava şartı arabuluculuk veya diğer zorunlu alternatif uyuşmazlık çözüm yollarına ilişkin hükümler saklıdır.
32. YÜRÜRLÜK
32.1. İşbu Sözleşme, Üyenin elektronik ortamda onay vermesiyle yürürlüğe girer.
32.2. Üye;
Sözleşme’yi üyelik işleminden önce okuyabildiğini,
Sözleşme hükümleri hakkında bilgi sahibi olduğunu,
Sözleşme’yi elektronik ortamda kaydetme ve daha sonra erişme imkânının bulunduğunu,
Üyelik bilgilerinin doğru olduğunu,
Sözleşme hükümlerini özgür iradesiyle kabul ettiğini
beyan eder.
32.3. İşbu Sözleşme elektronik ortamda kurulmuş olup ayrıca ıslak imza aranmaz.
33. ŞİRKET İLETİŞİM BİLGİLERİ
Şirket Unvanı / Ad Soyad: Ali Haydar Osmanoğlu
Adres: Ümraniye / İstanbul
MERSİS Numarası (varsa): Yok
Vergi Dairesi ve Numarası (varsa): Yok
KEP Adresi (varsa): Yok
E-posta Adresi: [E-POSTA ADRESİ]
Destek Hattı: [TELEFON NUMARASI]
İnternet Sitesi: [İNTERNET SİTESİ]

ELEKTRONİK ONAY
☐ Üyelik Sözleşmesi’ni okudum ve kabul ediyorum.
☐ Kullanım Koşulları’nı okudum ve kabul ediyorum.
☐ Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni’ni okudum ve bilgi edindim.`,
  },
  {
    id: 'kvkk-aydinlatma',
    title: 'KVKK Aydınlatma Metni',
    buttonText: `KVKK Aydınlatma Metni'ni Okudum ve Anladım`,
    required: true,
    body: `KİŞİSEL VERİLERİN İŞLENMESİ HAKKINDA AYDINLATMA METNİ
Yürürlük Tarihi: 22/09/2026
1. VERİ SORUMLUSU
6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla;
Şirket Unvanı / Ad Soyad: Ali Haydar Osmanoğlu
Adres: Ümraniye / İstanbul
bilgilerine sahip Ali Haydar Osmanoğlu (“Şirket”) tarafından aşağıda açıklanan kapsamda işlenmektedir.
İşbu Aydınlatma Metni, Şirket tarafından işletilen TaksiSOS isimli mobil uygulamaya (“Uygulama”) üye olan veya üyelik başvurusunda bulunan taksi sürücülerinin kişisel verilerinin işlenmesine ilişkin bilgilendirilmesi amacıyla hazırlanmıştır.
2. UYGULAMANIN NİTELİĞİ
Uygulama; taksi sürücülerinin yolculuk sırasında kendilerini risk altında hissetmeleri veya fiilî, yakın ve ciddi bir tehlikeyle karşılaşmaları hâlinde Risk Bildirimi veya Acil SOS Bildirimi oluşturabilmelerini, sürücünün konumunun sınırlı süreyle takip edilebilmesini, yakın çevrede bulunan doğrulanmış taksi sürücülerine güvenlik bildirimi gönderilmesini ve resmî acil yardım kanallarına ulaşılmasının kolaylaştırılmasını amaçlayan dijital bir güvenlik destek sistemidir.
Uygulama; kolluk kuvveti, özel güvenlik hizmeti, acil çağrı merkezi, ambulans, kurtarma veya profesyonel müdahale hizmeti niteliğinde değildir.
3. İŞLENEN KİŞİSEL VERİLER
Uygulamaya üyelik başvurunuz, üyeliğinizin doğrulanması ve Uygulama hizmetlerinden yararlanmanız kapsamında aşağıdaki kişisel verileriniz işlenebilir:
3.1. Kimlik bilgileri
Ad, soyadı, doğum tarihi, T.C. kimlik numarası veya yabancı kimlik numarası, kimlik doğrulama bilgileri ve gerekli olması hâlinde kimlik belgesinde bulunan sınırlı bilgiler.
Kimlik belgesi görüntüsünün alınması hâlinde, doğrulama için gerekli olmayan bilgilerin maskelenmesi veya doğrulama tamamlandıktan sonra belge görüntüsünün silinmesi esastır.
3.2. İletişim bilgileri
Cep telefonu numarası, e-posta adresi, adres bilgileri ve tercih edilen iletişim kanalları.
3.3. Mesleki deneyim ve sürücülük bilgileri
Sürücü belgesi bilgileri, taksi kullanım kartı, toplu taşıma aracı kullanım belgesi, çalışma belgesi, bağlı olunan taksi durağı, kooperatif, filo, oda veya meslek kuruluşu bilgileri ile taksi sürücülüğü yetkisinin doğrulanmasına ilişkin kayıtlar.
3.4. Araç bilgileri
Taksi plakası, ruhsat bilgileri, aracın marka, model, renk ve diğer tanımlayıcı bilgileri, çalışma bölgesi, taksi durağı ve aracın kullanıcı hesabıyla eşleştirilmesine ilişkin bilgiler.
3.5. Konum ve hareket bilgileri
Uygulamanın kullanımı sırasında elde edilen kesin veya yaklaşık konum bilgisi, Risk Bildirimi veya Acil SOS Bildirimi sırasında işlenen canlı konum, alarmın başlangıç ve sona erme konumu, konumun elde edildiği tarih ve saat, konum doğruluk bilgisi ve alarm süresince oluşan sınırlı hareket bilgileri.
Üyenin isteğe bağlı Aktif Güvenlik Modu’nu kullanması hâlinde konum bilgisi, yakındaki güvenlik bildirimlerinin üyeye ulaştırılması ve güvenlik bildiriminin gönderileceği kullanıcıların belirlenmesi amacıyla yakınlık eşleştirmesinde kullanılabilir.
Üyenin herhangi bir alarm oluşturmadığı sıradaki konumu, diğer taksi sürücülerine açık şekilde gösterilmez.
3.6. Risk ve acil durum bilgileri
Risk Bildirimi veya Acil SOS Bildiriminin türü, tarihi, saati, süresi, konumu, alarm seviyesi, olay kategorisi, alarmın kapatılma şekli, Üye tarafından girilen olay açıklamaları ve olay kapsamında gerçekleştirilen işlemler.
3.7. Bildirim ve etkileşim bilgileri
Üyeye gönderilen güvenlik bildirimleri, bildirimin görüntülendiği tarih ve saat, bildirime verilen yanıt, konum görüntüleme kayıtları, alarm durum güncellemeleri ve 112’yi arama seçeneğinin kullanılıp kullanılmadığına ilişkin işlem bilgileri.
3.8. Kullanıcı işlem bilgileri
Üyelik tarihi, hesap durumu, uygulama ayarları, tercih edilen özellikler, oturum bilgileri, alarm geçmişi, destek talepleri, şikâyetler ve Uygulama içerisindeki işlem kayıtları.
3.9. İşlem güvenliği bilgileri
IP adresi, cihaz kimliği, cihaz modeli, işletim sistemi, Uygulama sürümü, oturum açma ve çıkış bilgileri, doğrulama kodu işlemleri, erişim kayıtları, hata kayıtları, sistem logları, şüpheli işlem ve kötüye kullanım tespit bilgileri.
3.10. Hukuki işlem ve uyum bilgileri
Yetkili kurum ve kuruluşlardan gelen yazılar, adli veya idari başvurular, ihtar ve ihbarnameler, şikâyetler, dava ve takip bilgileri, uyuşmazlık kayıtları ve hukuki yükümlülüklerin yerine getirilmesine ilişkin bilgiler.
3.11. Finansal bilgiler
Uygulamanın ücretli hizmet sunması hâlinde fatura bilgileri, ödeme durumu, abonelik paketi, ücret ve muhasebe kayıtları.
Banka veya kredi kartı bilgilerinin yetkili bir ödeme kuruluşu tarafından işlenmesi hâlinde söz konusu bilgiler Şirket tarafından doğrudan saklanmayabilir.
3.12. Pazarlama ve iletişim tercihleri
Ticari elektronik ileti izni, pazarlama tercihleri, kampanya ve tanıtım iletişimlerine ilişkin seçimler ile bu tercihlerin verilme veya geri alınma bilgileri.
3.13. Acil durum kişisi bilgileri
Üyenin isteğe bağlı olarak acil durum kişisi belirlemesi hâlinde bu kişinin adı, soyadı, yakınlık bilgisi ve telefon numarası işlenebilir.
Acil durum kişisine ait kişisel veriler Üye tarafından sağlandığından, Üyenin ilgili kişiyi bu paylaşım konusunda bilgilendirmesi gerekmektedir.
4. ÖZEL NİTELİKLİ KİŞİSEL VERİLER
Uygulamanın olağan kullanımı kapsamında Üyeden sağlık bilgisi, biyometrik veri, ceza mahkûmiyeti ve güvenlik tedbiri bilgisi veya diğer özel nitelikli kişisel veriler talep edilmemektedir.
Bununla birlikte Üyenin bir saldırı, yaralanma veya adli olay hakkında açıklama yapması ya da serbest metin alanlarına bilgi girmesi sonucunda özel nitelikli kişisel veriler dolaylı olarak işlenebilir.
Üyenin, olayın açıklanması için zorunlu olmayan sağlık bilgilerini, adli sicil bilgilerini veya başka kişilere ait özel nitelikli kişisel verileri Uygulamaya girmemesi gerekmektedir.
Özel nitelikli kişisel veriler, yalnızca KVKK’nın 6. maddesinde öngörülen işleme şartlarından birinin bulunması ve işlenmesinin gerekli olması hâlinde, yeterli teknik ve idari tedbirler alınarak işlenecektir.
5. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI
Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
5.1. Üyelik ve doğrulama işlemleri
Kişisel verileriniz;
Üyelik başvurunuzun alınması,
kullanıcı hesabınızın oluşturulması,
kimliğinizin ve iletişim bilgilerinizin doğrulanması,
taksi sürücülüğü yetkinizin kontrol edilmesi,
hesabınızın araç ve plaka bilgilerinizle eşleştirilmesi,
üyelik şartlarını taşıyıp taşımadığınızın belirlenmesi
amaçlarıyla işlenmektedir.
5.2. Uygulama hizmetlerinin sunulması
Kişisel verileriniz;
Risk Bildirimi ve Acil SOS Bildirimi oluşturulması,
alarm süresince canlı konumunuzun takip edilmesi,
yakın çevrede bulunan doğrulanmış sürücülerin belirlenmesi,
güvenlik bildiriminin ilgili sürücülere gönderilmesi,
alarm durumunun güncellenmesi ve sona erdirilmesi,
acil durum kişisine bildirim gönderilmesi,
112 Acil Çağrı Merkezi’ni aramanın kolaylaştırılması
amaçlarıyla işlenmektedir.
5.3. Güvenlik ve kötüye kullanımın önlenmesi
Kişisel verileriniz;
sahte hesap ve yetkisiz kullanımın önlenmesi,
gerçeğe aykırı veya kötü niyetli alarm kullanımının tespit edilmesi,
hesap ve uygulama güvenliğinin sağlanması,
konum bilgisine yetkisiz erişimin önlenmesi,
erişim ve işlem kayıtlarının tutulması,
siber güvenlik olaylarının tespit edilmesi ve önlenmesi
amaçlarıyla işlenmektedir.
5.4. Kullanıcı destek süreçleri
Kişisel verileriniz;
talep, öneri ve şikâyetlerin alınması,
destek taleplerinin sonuçlandırılması,
kullanıcıyla iletişim kurulması,
teknik sorunların ve hata kayıtlarının incelenmesi,
hizmet kalitesinin artırılması
amaçlarıyla işlenmektedir.
5.5. Hukuki yükümlülüklerin yerine getirilmesi
Kişisel verileriniz;
mevzuattan kaynaklanan yükümlülüklerin yerine getirilmesi,
yetkili kamu kurum ve kuruluşlarının taleplerinin karşılanması,
adli ve idari süreçlerin yürütülmesi,
hukuki uyuşmazlıklarda delillerin korunması,
Şirketin ve ilgili kişilerin haklarının tesisi, kullanılması veya korunması
amaçlarıyla işlenmektedir.
5.6. Finans ve muhasebe işlemleri
Ücretli hizmet sunulması hâlinde kişisel verileriniz;
ödeme ve abonelik işlemlerinin yürütülmesi,
fatura düzenlenmesi,
muhasebe ve finans süreçlerinin gerçekleştirilmesi,
mali ve vergisel yükümlülüklerin yerine getirilmesi
amaçlarıyla işlenmektedir.
5.7. Pazarlama faaliyetleri
Ayrıca gerekli açık rızanızın veya ticari elektronik ileti onayınızın bulunması hâlinde kişisel verileriniz;
kampanya ve tanıtımların iletilmesi,
pazarlama ve kullanıcı deneyimi analizlerinin yapılması,
kullanıcı tercihlerine uygun hizmet ve tekliflerin oluşturulması
amaçlarıyla işlenebilir.
Pazarlama ve reklam faaliyetleri, temel üyelik ve güvenlik hizmetlerinden ayrı olarak yürütülür.
6. KİŞİSEL VERİLERİN İŞLENMESİNİN HUKUKİ SEBEPLERİ
Kişisel verileriniz, KVKK’nın 5. ve gerektiğinde 6. maddelerinde düzenlenen aşağıdaki kişisel veri işleme şartlarına dayanılarak işlenmektedir:
6.1. Sözleşmenin kurulması veya ifası için gerekli olması
Kimlik, iletişim, mesleki yeterlilik, araç, hesap, konum, alarm ve kullanıcı işlem bilgileriniz; Üyelik Sözleşmesi’nin kurulması ve talep ettiğiniz Uygulama hizmetlerinin sunulması için gerekli olması nedeniyle işlenmektedir.
6.2. Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi
Muhasebe, fatura, başvuru, işlem ve yetkili makam taleplerine ilişkin verileriniz; Şirketin kanuni yükümlülüklerini yerine getirebilmesi amacıyla işlenmektedir.
6.3. Bir hakkın tesisi, kullanılması veya korunması için zorunlu olması
Alarm, konum, erişim, destek ve hukuki işlem kayıtlarınız; bir saldırı, tehdit, kötüye kullanım, şikâyet veya uyuşmazlık hâlinde hukuki hakların kullanılması ve korunması amacıyla işlenmektedir.
6.4. Veri sorumlusunun meşru menfaatleri için zorunlu olması
İşlem güvenliği, kötüye kullanım tespiti, performans, hata ve erişim kayıtlarınız; temel hak ve özgürlüklerinize zarar vermemek kaydıyla Uygulamanın güvenliğinin sağlanması, dolandırıcılığın ve kötüye kullanımın önlenmesi ve hizmet kalitesinin geliştirilmesine ilişkin meşru menfaatlerimiz kapsamında işlenmektedir.
6.5. Açık rıza
KVKK’da düzenlenen diğer kişisel veri işleme şartlarından herhangi birinin bulunmadığı isteğe bağlı veri işleme faaliyetleri, ayrıca alınacak açık rızanıza dayanılarak gerçekleştirilebilir.
Açık rıza gerektiren işlemler, işbu Aydınlatma Metni ve Üyelik Sözleşmesi’nden ayrı olarak sunulur. Açık rıza vermemeniz, açık rızaya bağlı olmayan temel üyelik ve güvenlik hizmetlerinden yararlanmanızı engellemez.
Mobil cihazınız üzerinden konum, bildirim, kamera veya benzeri teknik izinleri vermeniz, tek başına KVKK kapsamında açık rıza verdiğiniz anlamına gelmez.
7. KİŞİSEL VERİLERİN TOPLANMA YÖNTEMİ
Kişisel verileriniz;
Uygulama üyelik, profil ve doğrulama ekranları,
Uygulamaya yüklediğiniz bilgi ve belgeler,
telefon numarası ve e-posta doğrulama işlemleri,
mobil cihazınızın konum servisleri,
Risk Bildirimi ve Acil SOS Bildirimi işlemleri,
uygulama içi işlem ve erişim kayıtları,
anlık bildirim sistemleri,
destek, iletişim ve şikâyet kanalları,
ödeme ve faturalandırma hizmetleri,
taksi durağı, kooperatif, filo, oda, belediye veya yetkili kuruluşlar üzerinden gerçekleştirilen doğrulamalar,
yetkili kamu kurum ve kuruluşları
aracılığıyla otomatik veya kısmen otomatik yollarla ya da bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yöntemlerle toplanabilir.
Kişisel verilerin doğrudan sizden elde edilmediği hâllerde, ilgili mevzuatta öngörülen süre ve yöntemler kapsamında ayrıca bilgilendirme yapılır.
8. KİŞİSEL VERİLERİN AKTARILMASI
Kişisel verileriniz, işleme amaçlarıyla bağlantılı ve gerekli olduğu ölçüde aşağıdaki alıcı gruplarına aktarılabilir.
8.1. Doğrulanmış taksi sürücüleri
Risk Bildirimi veya Acil SOS Bildirimi oluşturmanız hâlinde;
alarm türü ve seviyesi,
alarm tarihi ve saati,
canlı konumunuz,
araç ve plaka bilgilerinizin güvenlik için gerekli bölümü,
sistem tarafından oluşturulan olay numarası,
sınırlı kullanıcı tanımlama bilginiz
yakın çevrede bulunan ve sistem tarafından belirlenen sınırlı sayıdaki doğrulanmış taksi sürücüsüne aktarılabilir.
Alarmın sona ermesiyle diğer sürücülerin canlı konumunuza erişimi kapatılır.
Yolcuya ait kimlik, iletişim veya ayrıntılı kişisel veriler kural olarak diğer taksi sürücülerine aktarılmaz.
8.2. Acil durum kişileri
Acil durum kişisi özelliğini etkinleştirmeniz hâlinde adınız, alarm bilgileriniz, taksi plakanız ve canlı konumunuz belirlediğiniz acil durum kişisine aktarılabilir.
8.3. Hizmet sağlayıcılar
Kişisel verileriniz; sunucu, bulut bilişim, veri saklama, harita, konum, anlık bildirim, yazılım geliştirme, siber güvenlik, kullanıcı doğrulama, iletişim, müşteri destek, ödeme ve faturalandırma hizmeti sunan tedarikçilere, yalnızca sundukları hizmet için gerekli olduğu ölçüde aktarılabilir.
8.4. İş ortakları ve doğrulama kuruluşları
Taksi sürücülüğü yetkinizin doğrulanması amacıyla gerekli sınırlı veriler; ilgili belediye, taksi durağı, kooperatif, filo işletmesi, esnaf odası, meslek kuruluşu veya yetkili diğer kuruluşlarla paylaşılabilir.
8.5. Yetkili kamu kurum ve kuruluşları
Kişisel verileriniz; kanuni yükümlülüklerin yerine getirilmesi, suç şüphesinin araştırılması, acil durumun yönetilmesi veya usulüne uygun taleplerin karşılanması amacıyla mahkemeler, savcılıklar, kolluk birimleri, belediyeler, düzenleyici ve denetleyici kurumlar ile diğer yetkili kamu kurum ve kuruluşlarına aktarılabilir.
Uygulamanın 112 veya başka bir kamu sistemiyle resmî ve teknik entegrasyonu bulunmadığı sürece, oluşturduğunuz alarm kayıtları kamu kurumlarına kendiliğinden aktarılmaz.
8.6. Hukuki ve mali danışmanlar
Kişisel verileriniz; hukuki uyuşmazlıkların yürütülmesi, Şirket haklarının korunması ve mali yükümlülüklerin yerine getirilmesi amacıyla avukatlar, mali müşavirler, denetçiler ve diğer profesyonel danışmanlarla paylaşılabilir.
9. ANLIK BİLDİRİMLER
Uygulama kapsamında gönderilen anlık bildirimler aşağıdaki şekilde ayrıştırılır:
Operasyonel ve güvenlik bildirimleri: Risk Bildirimi, Acil SOS Bildirimi, hesap güvenliği, doğrulama, sistem kesintisi ve Uygulama hizmetlerinin sunulması için gerekli bildirimlerdir.
Pazarlama bildirimleri: Kampanya, reklam, tanıtım ve promosyon içerikli bildirimlerdir.
Operasyonel ve güvenlik bildirimleri ile pazarlama bildirimlerine ilişkin tercihler birbirinden ayrı yönetilir. Pazarlama bildirimlerinin kabul edilmemesi, temel güvenlik bildirimlerinin alınmasını veya Uygulamanın temel hizmetlerinden yararlanılmasını engellemez.
10. KİŞİSEL VERİLERİN YURT DIŞINA AKTARILMASI
Uygulama kapsamında yurt dışında bulunan veya sunucuları yurt dışında yer alan harita, konum, bulut bilişim, anlık bildirim, hata izleme, yazılım geliştirme veya iletişim hizmeti sağlayıcılarının kullanılması hâlinde kişisel verilerinizin yurt dışına aktarılması gündeme gelebilir.
Yurt dışına kişisel veri aktarımı, KVKK’nın 9. maddesinde düzenlenen şartlardan birinin sağlanması; yeterlilik kararı, standart sözleşme, bağlayıcı şirket kuralları, onaylanmış taahhütname veya mevzuatta öngörülen diğer uygun güvence mekanizmalarının bulunması hâlinde gerçekleştirilir.
Yurt dışı aktarımının açık rızaya dayanmasının gerekli olduğu özel bir durum ortaya çıkarsa, aktarımın kapsamı, amacı, alıcısı ve muhtemel riskleri hakkında ayrıca bilgilendirme yapılarak açık rızanız ayrı şekilde alınır.
11. KİŞİSEL VERİLERİN SAKLANMASI
Kişisel verileriniz, işlendikleri amaç için gerekli olan süre boyunca ve ilgili mevzuatta öngörülen zamanaşımı ve saklama süreleriyle sınırlı olarak muhafaza edilir.
Veri kategorilerine ilişkin saklama süreleri aşağıdaki esaslara göre belirlenir:
Üyelik ve sözleşme kayıtları, üyelik süresince ve hukuki zamanaşımı süreleri boyunca,
kimlik ve sürücülük doğrulama kayıtları, doğrulamanın gerçekleştirilmesi ve üyelik şartlarının kontrolü için gerekli süre boyunca,
aktif konum bilgileri, yakınlık eşleştirmesi ve ilgili hizmetin gerçekleştirilmesi için gerekli kısa süre boyunca,
Risk Bildirimi ve Acil SOS kayıtları, olayın incelenmesi ve hukuki hakların korunması için gerekli süre boyunca,
işlem güvenliği ve erişim kayıtları, siber güvenlik ve kötüye kullanımın önlenmesi için belirlenen süre boyunca,
fatura ve muhasebe kayıtları, mali mevzuatta öngörülen süre boyunca,
hukuki uyuşmazlığa konu kayıtlar, ilgili süreç kesin olarak sonuçlanıncaya ve uygulanabilir zamanaşımı süreleri sona erinceye kadar
saklanır.
Kesin saklama süreleri, Şirketin Kişisel Veri Saklama ve İmha Politikası ile kişisel veri işleme envanterinde belirlenir.
Alarm sona erdiğinde canlı konumunuz diğer kullanıcıların erişimine kapatılır.
Saklama süresi sona eren kişisel veriler, mevzuata uygun olarak silinir, yok edilir veya anonim hâle getirilir.
12. KİŞİSEL VERİLERİN GÜVENLİĞİ
Şirket, kişisel verilerinizin hukuka aykırı olarak işlenmesini ve erişilmesini önlemek ve verilerin güvenli şekilde muhafaza edilmesini sağlamak amacıyla uygun teknik ve idari tedbirleri almaktadır.
Bu kapsamda;
kimlik ve sürücü doğrulama mekanizmalarının kullanılması,
rol ve yetki temelli erişim kontrollerinin uygulanması,
konum verilerine sınırlı ve süreli erişim sağlanması,
verilerin aktarım ve saklama sırasında şifrelenmesi,
erişim ve işlem kayıtlarının tutulması,
konum verisini görüntüleyen kullanıcıların kayıt altına alınması,
çalışan ve hizmet sağlayıcı erişimlerinin sınırlandırılması,
güvenlik testleri ve zafiyet taramalarının yapılması,
veri ihlali müdahale süreçlerinin oluşturulması,
saklama süreleri sonunda silme, yok etme veya anonimleştirme işlemlerinin gerçekleştirilmesi
gibi tedbirler uygulanır.
13. KVKK KAPSAMINDAKİ HAKLARINIZ
KVKK’nın 11. maddesi uyarınca veri sorumlusu Şirkete başvurarak;
Kişisel verilerinizin işlenip işlenmediğini öğrenme,
Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,
Kişisel verilerinizin işlenme amacını ve bu amaca uygun kullanılıp kullanılmadığını öğrenme,
Kişisel verilerinizin yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,
Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme,
KVKK’da öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme,
Düzeltme, silme veya yok etme işlemlerinin kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme,
İşlenen kişisel verilerinizin münhasıran otomatik sistemler aracılığıyla analiz edilmesi sonucunda aleyhinize bir sonucun ortaya çıkmasına itiraz etme,
Kişisel verilerinizin kanuna aykırı olarak işlenmesi nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme
haklarına sahipsiniz.
14. BAŞVURU YÖNTEMİ
KVKK kapsamındaki talep ve başvurularınızı aşağıdaki yöntem ile Şirkete iletebilirsiniz:
E-posta adresiniz üzerinden: aliguveli0gmail.com
Kayıtlı elektronik posta (KEP) adresiniz üzerinden: Yok
Başvurunuzda;
adınız ve soyadınız,
başvuru yazılı ise imzanız,
T.C. vatandaşları için T.C. kimlik numaranız; yabancılar için uyruğunuz, pasaport numaranız veya varsa kimlik numaranız,
tebligata esas adresiniz,
varsa bildirime esas e-posta adresiniz ve telefon numaranız,
talebinizin konusu,
talebinizi destekleyen bilgi ve belgeler
bulunmalıdır.
Başvurunuz, talebin niteliğine göre en kısa sürede ve en geç otuz gün içerisinde sonuçlandırılır. İşlemin ayrıca bir maliyet gerektirmesi hâlinde Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret talep edilebilir.
15. AYDINLATMA METNİ VE AÇIK RIZA İLİŞKİSİ
İşbu Aydınlatma Metni, kişisel verilerinizin işlenmesi hakkında bilgi vermek amacıyla hazırlanmış olup açık rıza beyanı niteliğinde değildir.
Aydınlatma Metni’nin tarafınıza sunulduğunun kayıt altına alınması, kişisel verilerinizin işlenmesine açık rıza verdiğiniz anlamına gelmez.
Açık rıza gerektiren isteğe bağlı veri işleme faaliyetleri bakımından tercihleriniz, belirli bir konuya ilişkin ve ayrı onay mekanizmaları üzerinden alınır.
16. AYDINLATMA METNİNDE DEĞİŞİKLİK
Uygulamanın özelliklerinde, kişisel veri işleme faaliyetlerinde veya ilgili mevzuatta değişiklik olması hâlinde işbu Aydınlatma Metni güncellenebilir.
Esaslı değişiklikler, kişisel verileriniz yeni amaçlarla işlenmeden önce Uygulama içi bildirim, e-posta, SMS veya diğer uygun iletişim kanalları üzerinden tarafınıza duyurulur.
Güncel Aydınlatma Metni’ne Uygulamanın “KVKK”, “Gizlilik” veya “Yasal Metinler” bölümünden erişebilirsiniz.
17. İLETİŞİM BİLGİLERİ
Veri Sorumlusu (Şirket Unvanı / Ad Soyad): Ali Haydar Osmanoğlu
Adres: Ümraniye / İstanbul`,
  },
  {
    id: 'kvkk-acik-riza',
    title: 'KVKK Açık Rıza Beyanı',
    buttonText: `Açık Rıza Metni'ni Okudum ve Onaylıyorum`,
    required: false,
    body: `KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AÇIK RIZA BEYANI
Yürürlük Tarihi: 22/09/2026
TaksiSOS Taksi Sürücüleri KVKK Aydınlatma Metni’ni okuduğumu ve kişisel verilerimin işlenmesi hakkında bilgilendirildiğimi kabul ederim.
Uygulamada isteğe bağlı güvenlik özelliklerini etkinleştirmem hâlinde; kesin veya yaklaşık konum bilgilerimin, konum tarih ve saat bilgilerimin, sınırlı hareket bilgilerimin, alarm ve acil durum bilgilerimin;
uygulamanın arka planda çalıştığı sırada yakınımdaki güvenlik bildirimlerinin tarafıma ulaştırılması,
güvenlik bildirimi gönderilecek yakın sürücülerin belirlenmesi,
Risk Bildirimi veya Acil SOS Bildirimi sırasında canlı konumumun doğrulanmış sürücülerle sınırlı ve geçici olarak paylaşılması,
belirlediğim acil durum kişisine alarm ve canlı konum bilgilerimin gönderilmesi
amaçlarıyla Ali Haydar Osmanoğlu tarafından işlenmesine ve belirtilen kişilerle paylaşılmasına açık rıza veriyorum.
Alarm oluşturmadığım sıradaki konumumun diğer sürücülere gösterilmeyeceğini, alarm sona erdiğinde canlı konum erişiminin kapatılacağını ve kişisel verilerimin yalnızca belirtilen güvenlik amaçlarıyla sınırlı olarak işleneceğini biliyorum.
Açık rıza vermemin zorunlu olmadığını, rıza vermemem hâlinde temel üyelik ve SOS hizmetlerinden yararlanabileceğimi; ancak arka planda konum takibi, yakındaki bildirimleri alma ve acil durum kişisine otomatik bildirim gönderme gibi isteğe bağlı özelliklerin çalışmayabileceğini biliyorum.
Verdiğim açık rızayı aliguveli0@gmail.com üzerinden her zaman geri alabileceğimi kabul ederim.
Veri Sorumlusu İletişim Bilgileri:
Şirket Unvanı / Ad Soyad: Ali Haydar Osmanoğlu
Adres: Ümraniye / İstanbul`,
  },
  {
    id: 'ticari-ileti-onayi',
    title: 'Ticari Elektronik İleti Onayı',
    buttonText: `Ticari Elektronik İleti Onayı'nı Okudum ve Onaylıyorum`,
    required: false,
    body: `TİCARİ ELEKTRONİK İLETİ ONAYI
Yürürlük Tarihi: ….../……/2026
[UYGULAMA ADI] uygulamasını işleten Ali Haydar Osmanoğlu (“Şirket”) tarafından; kampanya, promosyon, indirim, anket, tanıtım ve benzeri pazarlama amaçlı ticari elektronik iletilerin tarafıma 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat uyarınca SMS, e-posta, anlık bildirim (push) ve/veya arama yoluyla gönderilmesine açık rıza veriyorum.
Bu onay kapsamında tarafıma şu içerikler gönderilebilir:
kampanya, indirim ve fırsat duyuruları,
yeni özellik ve hizmet tanıtımları,
kullanıcı memnuniyeti ve pazar araştırması anketleri,
Şirket veya iş ortaklarına ait tanıtım içerikleri.
İşbu onay; Üyelik Sözleşmesi’nin kabulünden, Kullanım Koşulları’nın onaylanmasından ve Kişisel Verilerin İşlenmesine İlişkin Açık Rıza Beyanı’ndan bağımsız ve ayrı olarak alınmaktadır. Bu onayı vermemem, Uygulamanın temel üyelik ve SOS güvenlik hizmetlerinden yararlanmamı hiçbir şekilde engellemez; yalnızca pazarlama amaçlı ticari elektronik iletileri almamı sağlar.
Risk Bildirimi, Acil SOS Bildirimi, hesap güvenliği, sistem bakımı ve Hizmetlerin sunulması için zorunlu olan operasyonel ve güvenlik bildirimleri işbu onay kapsamında değildir; bu bildirimler ticari elektronik ileti niteliğinde olmadığından işbu onayı vermesem dahi tarafıma gönderilmeye devam eder.
Verdiğim onayı; İleti Yönetim Sistemi (İYS) üzerinden, Uygulama içerisindeki bildirim ayarlarından veya [E-POSTA ADRESİ] üzerinden Şirkete başvurarak her zaman ücretsiz şekilde geri alabileceğimi biliyorum. Onayın geri alınması, Uygulamanın diğer hizmetlerini etkilemez.
Veri Sorumlusu İletişim Bilgileri:
Şirket Unvanı / Ad Soyad: Ali Haydar Osmanoğlu
Adres: Ümraniye / İstanbul
MERSİS Numarası (varsa): Yok
Vergi Dairesi ve Numarası (varsa): Yok
KEP Adresi (varsa): Yok
E-posta Adresi: [E-POSTA ADRESİ]
Destek Hattı: [TELEFON NUMARASI]
İnternet Sitesi: [İNTERNET SİTESİ]`,
  },
];

export function getLegalDocument(id: LegalDocumentId): LegalDocument {
  const doc = LEGAL_DOCUMENTS.find(d => d.id === id);
  if (!doc) throw new Error(`Unknown legal document id: ${id}`);
  return doc;
}
