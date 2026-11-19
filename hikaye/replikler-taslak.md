# Mezuniyet.exe Yanıt Vermiyor — Replik Taslağı

Kaynak: `incil.md`. Seslendirilen her satır `KİŞİ: metin` biçiminde. Kod: `build.js` (bu metnin birebir aynısı; değişiklik önce burada yapılır).

## Ayarlanabilir sabitler (build.js'in başında da aynı adla)

```
BASLIK      = 'Mezuniyet.exe Yanıt Vermiyor'
S1_CEVRE    = 5     // Referans Kapısı: Ç ≥ S1_CEVRE
S1_GORUNUR  = 3     //                  ve G ≥ S1_GORUNUR
G_ESIK      = 3     // S2 / S3 için görünürlük eşiği
Y_ESIK      = 5     // S3 / S4 için yetkinlik eşiği
S4_G_MAX    = 2, S4_C_MAX = 3
SON_SORU    = 4 seçenek (Yetenek / Çevre / Şans / Baba)
```

Kararların `c` dizisindeki sırası: `0 K1 · 1 K2 · 2 K3 · 3 K4 · 4 NABIZ1 · 5 K5 · 6 K6 · 7 NABIZ2`.
Nabızlar sonucu değiştirmez; yalnızca hemen sonraki tek replik (Tolga / Asuman) çoğunluk cevabına göre seçilir.

Kişiler: ANLATICI (A), DENİZ (D), OZAN (O), BUSE (B), TOLGA (T), ASUMAN (S).

---

## Başlık kartı
Windows donma penceresi: **"Mezuniyet.exe yanıt vermiyor."** [Bekle] [Programı kapat] → imleç "Bekle".

## M0 · Açılış montajı (15 sn, sessiz)
`Hello, World!` (1. sınıf, mutlu Deniz) → `Segmentation fault (core dumped)` (2. sınıf, yüzde kahve) → Balcalı yokuşu, "41°C · hissedilen 47" (3. sınıf).

---

## PERDE 1 · 3. SINIF · STAJ
Kart altı: "Staj zorunludur. Ücret: —"

A: Çukurova, haziran. Bilgisayar mühendisliği üçüncü sınıf öğrencisi Deniz, yokuşu çıkarken staj yeri arıyor. Yokuş da onu arıyor.
D: Staj zorunlu: kırk iş günü, defter, imza, kaşe. Bir de birinin beni kabul etmesi lazım. O kısım yönetmelikte yazmıyor.
O: Ben staja başvurmadım. Önce şu algoritmayı O(n log n)'e indireceğim. İyi iş kendini gösterir, değil mi?
B: Deniz! Bu Selin Hanım, İK'dan. Bu kantinci Hüseyin Abi, oğlu yazılımcı. Hepsiyle staj fuarında tanıştım. Sen neredeydin?
D: Fuar mı vardı? Ben o gün staj defterimin kapağını kaplıyordum. Şeffaf naylonla. Çok güzel oldu, gerçekten.
T: Abi benim CV klasörüm iki megabayt, caps klasörüm dört gigabayt. Hayatta öncelikler var abi.
D: Benim de caps klasörüm var, ama adı "Staj Belgeleri". Annem açmasın diye. Annem açmıyor; staj belgesi de yok.
A: Bu sırada Asuman da staj yerini bulmuştu. Daha doğrusu, staj yeri yirmi iki yıldır onu bekliyordu.
S: İlk günüm! Kimse beni tanımıyordu. Sadece güvenlik "hoş geldiniz Asuman Hanım" dedi. Bir de genel müdür. Bir de herkes.
A: Deniz'in ise önünde üç kapı var. Hangisini çalacağına bu akşam salon karar verecek.

### K1 · Deniz stajını nerede yapıyor?
- **Tanıdık torpili** — Babanın askerlik arkadaşının yeğeninin şirketi: Yıldızlar Holding. (Ç+2)
- **Ücretsiz startup** — Maaş yok, vizyon var. Bir de armut koltuk. (Y+2, Ç+1)
- **Kendi projen** — Patron sensin. Defteri imzalayacak kimse de yok. (Y+3)

**K1-A (Yıldızlar Holding, bodrum; koridor sonunda cam oda)**
A: Yıldızlar Holding, bodrum kat. Deniz'e bir masa verildi, bilgisayar verilmedi. Fotokopi makinesi zaten oradaydı.
D: Kırk gün fotokopi çektim. Ama çay ocağında herkes adımı biliyor; Sevgi Abla kimin kaç şekerli içtiğini bana devretti.
S: Fotokopi mi? Ben hiç çekmedim. Herhalde sıra bana gelmedi. Çok öğretici olmuştur, değil mi?

**K1-B (loft ofis, armut koltuklar)**
D: Üçüncü gün production'a kod attım. Beşinci gün production'ı ben düşürdüm. Kimse kızmadı, çünkü kimse fark etmedi.
A: Şirketin CTO'su onun adını öğrendi. CTO aynı zamanda kurucu, muhasebeci ve armut koltuğun tek sahibiydi.
D: Maaş yerine binde iki hisse verdiler. Şirketin değeri şu an sıfır. Binde ikisini hesapladım, yine sıfır çıktı. Tutarlı.

**K1-C (ev, vantilatör, gece)**
D: Kendi projemi yazdım: kampüste gölgeli otopark bulan bir uygulama. Çalışıyor. Bende çalışıyor.
D: Kırk iş günü boyunca patron da bendim, stajyer de. Patron olarak stajyerden çok memnunum. Stajyer olarak zam istiyorum.
A: Staj defterini annesine imzalatmayı düşündü. Annesinin kaşesi yoktu.

**Koridor, eylül (ortak)** — panel: bu akşamki CENGA afişine benzeyen afiş.
B: Cuma akşamı söyleşi var: bir şirketten mühendis gelecek, sonunda pizza. Gel, en kötü ihtimalle pizza yersin.

### K2 · Buse seni söyleşiye çağırıyor. Ne yapıyorsun?
- **Git, tanış** — Konuşmacıya soru sor. Evet, sesli. (G+1, Ç+2)
- **Seriyi bozma** — Leetcode serisi 247 gün. Bu akşam 248 olacak. (Y+1)
- **Pizza gelince kaç** — Etkinliğe değil, ikrama katılım. (Ç+1)

**K2-A** — panel: kartvizit "Kaan Er · Engineering Manager · Kuzey Yazılım"
D: Soru sordum. Sesim titredi, soru da biraz saçmaydı. Çıkışta adımı söyledim, akşam LinkedIn'den ekledim. İstek hâlâ beklemede.
B: Gördün mü? Saçma soru diye bir şey yok, hatırlanan soru var. Seninki çok hatırlanacak, inan bana.
A: Bağlantı isteği üç ay beklemede kaldı. Konuşmacı soruyu hatırladı. Soranı hatırlamadı, ama soruyu hatırladı.

**K2-B** — panel: Leetcode "Gün 248" + Buse'nin hikâyesi "Kaan Bey'e teşekkürler!"
D: İki yüz kırk sekizinci gün, Hard soru, kabul edildi. Kutlayacak kimse yoktu; herkes söyleşiden sonra konuşmacıyla yemeğe gitmişti.
A: Gecenin sonunda Deniz'in serisi iki yüz kırk sekiz gündü. Buse'nin rehberi iki kişi büyümüştü.
O: İki yüz kırk sekiz mi? Benim serim altı yüz on gün. Söyleşiye ben de gitmedim. Gitmeyenler kulübüyüz, toplanmıyoruz.

**K2-C** — panel: yağlı kartvizit
D: Son beş dakikaya girdim. Pizza kuyruğunda arkamdaki adam "sucuklu kaldı mı" dedi. Konuşmacıymış. Sucukluyu ona verdim.
A: Konuşmacı ona kartını uzattı. Kartın üstünde bir yağ lekesi, altında bir telefon numarası vardı. İkisi de kalıcıydı.
B: Konuşmacıyla pizza paylaşmışsın! Ben bir saat soru sordum, sen bir dilimle geçtin. Strateji değil ama işe yarıyor.

**Kahve makinesi (ortak)** — yakasında "Selin · İK · Kuzey Yazılım" kartı olan kadın. Anlatıcı yorum yapmaz.
B: Bu makine hep şekerli veriyor, değil mi? Ben Buse, bilgisayar üçüncü sınıf. Siz de mi şekersiz seviyorsunuz?
A: Yaz bitti. Deniz'in staj defterinde kırk iş günü vardı. Kırkının karşısında da aynı kelime yazıyordu: gözlem.

---

## PERDE 2 · 4. SINIF · BİTİRME VE GÖRÜNÜRLÜK
Kart altı (Jira kartı): "BITIRME-1 · Mezun ol · Öncelik: Yüksek · Atanan: Sen · Son tarih: Dün"
Açılış paneli (sessiz): "Buse, Kuzey Yazılım'da gönüllü etkinlik asistanı olarak başladı. (Ücretsiz)"

A: Dördüncü sınıf. Herkes bitirme projesine bir isim buldu. Projeyi bulmak sonraya kaldı.
D: Benimki SerinYol: kampüste gölgeden gölgeye en kısa rotayı buluyor. Balcalı yokuşunu iki derece serin çıkıyorsunuz.
O: Ben bir derleyici yazdım, kendi dilim için. Dilin adı yok, dokümantasyonu yok, kullanıcısı yok. Ama çok hızlı.
T: Ben raporu yazdım abi. Proje henüz yok ama rapor çok güzel; içindekiler tablosu otomatik.
S: Projemi şirketteki herkese sundum, hepsi ayakta alkışladı! Sonra öğrendim, salonda sandalye yokmuş. Yine de çok duygusaldı.
A: SerinYol çalışıyor, en azından Deniz'in bilgisayarında. Şimdi dünyada birinin bundan haberi olması lazım.

### K3 · SerinYol dünyaya nasıl çıkıyor?
- **Demo videoyla paylaş** — Doksan saniyelik video. Arkada epik müzik, önde Balcalı yokuşu. (G+2, Y+1)
- **Sessizce GitHub'a koy** — README dosyası: "TODO: README yaz." (Y+2)
- **Hackathon'a götür** — 48 saat, sınırsız enerji içeceği, sıfır uyku. (G+1, Ç+1, Y+1)

**K3-A** — LinkedIn gönderisi, 214 beğeni; "Halam: Maşallah", "İK Uzmanı · Akdeniz Teknoloji: Tebrikler!" (DM: görüldü)
D: Paylaşımı yaptım, telefonu ters çevirdim. Yarım saat sonra baktım: halam beğenmiş, bir de bir İK uzmanı. Ona mesaj attım. Görüldü.
A: Aynı gün Ozan kırk iki commit attı.
B: Videonu ben de paylaştım! İki yüz on dört beğeninin otuzu benim çevremden. Merak etme, sana fatura etmeyeceğim.

**K3-B** — repo "serinyol · ★ 1" → ★ 0
D: Kodu GitHub'a koydum. Bir yıldız geldi. Profiline baktım, bot. Ertesi gün bot da yıldızı geri aldı.
O: README yazmamışsın. Ben de yazmadım. Kodu okuyan anlar. Şimdiye kadar okuyan çıkmadı ama anlardı.
D: README'ye sonunda bir satır yazdım: "Kurulum için bana yazın." Kimse yazmadı. Demek ki herkes kurabiliyor.

**K3-C** — jüri kartı "CTO · Lezzet Teknoloji" (S2'de tekrar görünür)
D: Sabah dörtte demo çalıştı. Jüri önünde çalışmadı. Jürideki CTO "bizde de hiç çalışmaz" dedi ve kartını verdi.
T: Ben hackathona yemek için gelmiştim abi. Kırk sekiz saatte on bir pizza. Bizim takım birinci oldu; yemekte.
A: Jürideki CTO, Deniz'in numarasını telefonuna kaydetti: "Deniz, hackathon, çalışmayan demo". Rehberinde dört yüz kişi daha vardı.

**Kariyer günü (ortak)** — panel: Yıldızlar Holding roll-up "Junior Yazılım Geliştirici · En az 5 yıl deneyim"; önünde Asuman fotoğraf çektiriyor.
O: Bir stant "kendinden bahset" dedi. GitHub linkimi söyledim. Harf harf. Sonra "biz sizi ararız" dediler. Numaramı sormadılar.
B: Ben bugün otuz kişiyle tanıştım. Sırrı basit: ikinci kez gidiyorum. İkinci kez gidince insanlar seni hatırladıklarını sanıyor.
T: Dokuz kalem, üç termos, bir stres topu. Kariyer günü benim için verimli geçti abi. Mezun olunca kalem almayacağım.
S: Standımızda junior alıyoruz! En az beş yıl deneyim. Bence çok makul; ben de beş yıldır şirkette stajyerim. Yaz tatillerinde.
D: Bir standda junior ilanı vardı: en az beş yıl deneyim. Dört yılda bitirirsem bir yıl eksik kalıyor. Uzatan arkadaşlar, sizin devriniz.

A: LinkedIn. Türkiye'nin en kalabalık motivasyon konuşması. Herkes konuşuyor, kimse dinlemiyor, herkes beğeniyor.

## M1 · LinkedIn akışı (24 sn, sessiz)
1. "Bugün stajımda bana çay ikram edildi. Bu bana liderlik hakkında 7 ders öğretti."
2. "Passionate | Visionary | AI Enthusiast | Öğrenci"
3. "3. sınıfta 4 şirket kurdum. 4'ü de kapandı. İşte öğrendiklerim:"
4. "Leetcode'da 1.000. soru! Kimse bana inanmadı (kimseye söylemedim)."
5. #OpenToWork yeşil çerçeveli 6 profil
6. "İK Uzmanı: Yorumlara CV bırakın, inceleyeceğim." · 4.812 yorum
7. "Asuman Yıldız: Bitirme projemi Yıldızlar Holding yönetim kuruluna sundum. Kendi yolumu kendim çizdim." · 1.200 beğeni
8. Flaş: "Ozan K. · —", gri avatar, 0 bağlantı → kayıp gider

T: Abi ben LinkedIn'e caps atıyorum. Kimse anlamıyor ama İK'cılar beğeniyor. Sanırım onlar da anlamıyor.
D: Herkes yeşil çerçeveyle dolaşıyor. Benim profilimde hâlâ lise mezuniyet fotoğrafım var. Cüppeli. Bıyıklı.
B: İnsanlar seninle tanışmadan önce profiline bakıyor. Profilin boşsa tanışmıyorlar. Ben öyle değilim tabii, ben herkesle tanışırım.

### K4 · Deniz'in profili nasıl olacak?
- **Düzgün profil** — Gün ışığında fotoğraf, net başlık, ayda iki paylaşım. (G+2)
- **Kod konuşsun** — Profil boş, GitHub linki yeter. Ozan gibi. (Y+1)
- **Dürümlü fotoğraf** — Elinde Adana dürüm, arkada 44 derecelik termometre. Samimi. (G+1, DÜRÜM)

**K4-A** — "Profil görüntülenmesi: 3 → 47"
D: Başlığa "Mobil geliştirici, SerinYol" yazdım. "Passionate" yazmadım. Kendimi tutmak çok zor oldu.
A: Profili bir haftada kırk yedi kişi görüntüledi. Üçü halasıydı; hala tek ama üç ayrı hesabı var.

**K4-B** — gri avatar, "Bağlantı: 12"
D: Profili boş bıraktım. Kodum her şeyi anlatıyor. Kodu açan olursa.
O: Doğru karar. Ben de öyle yaptım, iki yıldır bekliyorum. Ama doğru karar.

**K4-C** — dürümlü fotoğraf; "Profil görüntülenmesi: 3 → 31 (ikisi kebapçı)"
D: Fotoğrafı yükledim. Annem aradı: "Oğlum, İK bunu görünce aç olduğunu düşünür." Açtım zaten, o yüzden dürüm.
T: Abi o fotoğrafı ben çektim. Profesyonelim, caps arşivim dört gigabayt. Işık doğal, ter doğal, dürüm acılı.

---

## PERDE 3 · MEZUNİYET VE İŞ ARAMA
Kart altı: "Aranan: Junior. Deneyim: en az 5 yıl."
Tören pankartı: "Tören sponsoru: YILDIZLAR HOLDING".

A: Mezuniyet. Kepler havaya atıldı. Üçü geri gelmedi; Çukurova rüzgârı kep sever.
D: Rektör "artık hayata atılıyorsunuz" dedi. Nereye atıldığımızı söylemedi. Ben odama atıldım.
O: Bölüm birincisi olarak kürsüye çıktım. Mikrofon kapalıydı. Konuşmamı bölümün sitesine koydular. Sayfa açılmıyor.
S: Mezuniyetime babam da geldi! Kürsüde konuşma yaptı. Aslında her yıl yapıyormuş ama bu yıl bana baktı.
B: Kep atmadan önce yirmi üç kişiyle fotoğraf çektim, hepsini etiketledim. Kepim kayboldu ama rehberim kaldı.
A: Deniz ilk ilanı açtı. Her şey yazıyordu. Bir şey hariç.

### NABIZ 1 · İlanda "Maaş: Rekabetçi" yazıyor. Sence rakam ne? (sonucu değiştirmez)
- **Asgari ücret** — Rekabet, asgari ücretle.
- **Asgari artı yemek kartı** — Rekabetçi olan yemek kartı.
- **Yazsalar başvururdum** — Rakamsız sevgi olmaz.

O: Sekiz yüz kırk yedi başvuru. Hepsini Excel'de takip ediyorum. Durum sütununda tek bir cümle var: "Değerlendirmeniz sonucunda".
B: Kuzey'e üç kez başvurdum, üçünde de otomatik ret. Dördüncüde Selin Hanım'a yazdım. Mülakata çağırdılar. Sadece mülakata.
T: CV'mi yükledim abi. Yanlış dosya gitmiş: pazartesi sabahı caps'i. Ertesi gün mülakata çağırdılar.

**Tolga teklif mektubu (NABIZ 1 çoğunluğuna göre, maaş satırı bulanık)**
- (Asgari) T: Teklif geldi abi. Maaş: rekabetçi. Salon "asgari" demişti. Zarfı açmadan bilen bu kadar insan görmedim. Helal.
- (Yemek kartı) T: Teklif geldi abi. Maaş: rekabetçi. Salon "yemek kartı da vardır" demişti. Salon iyimsermiş. Yemek kartı yok.
- (Yazsalar) T: Teklif geldi abi. Maaş: rekabetçi. Salon "rakam yazsalar başvururdum" demişti. Ben başvurmadım bile, caps attım.
D: Tolga'yı tebrik ettim. Sonra kendi CV'mi açtım, sonuna bir caps eklesem mi diye düşündüm. Hâlâ düşünüyorum.

A: Mülakat mevsimi açıldı. Deniz yedi mülakata girdi. Sorular hep aynıydı, cevaplar hiç yeterli değildi.

## M3 · Mülakat soruları (~23 sn, sessiz)
1. "Kendinizi 5 yıl sonra nerede görüyorsunuz?"
2. "Bir binary tree'yi ters çevirin. Tahta yok, havada gösterin."
3. "Askerlik durumunuz?"
4. "Neden biz?" (şirket adı bulanık)
5. "Hafta sonu çalışmak hakkında ne düşünürsünüz? 'Evet' dışında bir cevap var mı?"
6. "Bu kalemi bana satın." (Tolga'nın kariyer günü kalemi)
7. "Maaş beklentiniz?" → "Bağlantı koptu"
8. "Sizi olumlu ya da olumsuz bilgilendireceğiz." · saat ilerler: 3 hafta

D: Maaş beklentimi söyleyecektim, bağlantı koptu. Tekrar bağlandım. Bu sefer onlar "biz sizi ararız" dedi.
A: Deniz'in ilk teklifi geldi: on iki aylık ücretsiz "yetenek programı". Yetenek ondan, program onlardan.
D: İş için deneyim, deneyim için iş lazım. Bu döngüyü birinci sınıfta ben de yazmıştım. Çıkış koşulunu unutmuştum.

### K5 · Deniz işi nasıl arıyor?
- **500 Kolay Başvuru** — Tek tık, beş yüz ilan. Okuyan bir algoritma. (+0)
- **Buluşma ve referans** — Buluşmalara git, insanlarla konuş, "beni önerir misin" de. (G+1, Ç+2)
- **Zaman kazan** — Yüksek lisans ya da askerlik. Belki piyasa düzelir. (Y+1)

**K5-A → M2 · 500 Kolay Başvuru (25 sn, sessiz; HUD "+0")** — sayaç 0→500, yağmur gibi ret mailleri (bkz. incil), son mail "Başvuru deneyiminizi puanlar mısınız? ★★★★★".
D: Beş yüz başvuru: dört yüz doksan iki ret, yedi sessizlik, bir anket. "Başvuru deneyiminizi puanlayın." Bir yıldız verdim.
O: Beş yüz mü? Ben bir ara ret maillerine otomatik teşekkür yanıtı yazdım. Şimdi onlar da bana otomatik teşekkür ediyor.

**K5-B (Adana'da kafe, "Yazılımcılar Buluşması · 32 katılımcı")**
D: Bir buluşmaya gittim. Konuşmak, kod yazmaktan zormuş. Üçüncü çayda biri "CV'ni at, içeriye iletirim" dedi. İletmiş. İçeride biri okumuş.
B: Gördün mü? CV'yi bir insana atınca okunuyormuş. Okunması işe alınmak demek değil ama. Bunu da dördüncü denemede öğrendim.
A: Buluşmada otuz iki kişi vardı. Otuz biri ona iş teklif etmedi. Bu, şimdiye kadarki en iyi oranıydı.

**K5-C (yüksek lisans kaydı; askerlik şubesi zarfı)**
D: Yüksek lisansa kaydoldum. Annem komşulara "master yapıyor" diyor. Ben kendime "zaman yapıyorum" diyorum.
A: Askerlik şubesi de not aldı. Acele etmiyor, bekleyebilir.
T: Yüksek lisans mı abi? Ben de düşündüm. Sonra caps sayfamın takipçisi yüz bini geçti, bıraktım. Akademi kaybetti.

---

## PERDE 4 · MEZUNİYETİN 4. AYI
Kart altı: "Bayram. Sofrada 12 kişi, 1 soru."
Sofrada sessiz balonlar: "İş ne oldu?" · "Kuzenin bankaya girdi." · "Yazılım dediğin, evden mi çalışıyorsun?" · "Almanya'ya gitsene." · "Bizim yazıcı da bozuk, bir bakarsın."

A: Bayram. Sofrada on iki kişi, bir soru. Soru her yemekte yeniden soruluyor, cevap hiç değişmiyor.
D: Evet, yazılımcıyım. Hayır, yazıcı tamir etmiyoruz. Evet, yemekten sonra bakarım.
D: Yazıcıya baktım. Kâğıt sıkışmış. Çıkardım, çalıştı. Sofrada artık mühendis olduğuma herkes ikna oldu.
S: Bizim bayram da çok kalabalık geçti! Babam bütün çalışanlara ikramiye dağıttı. Ben de aldım; ben de çalışıyorum sonuçta.

## M4 · Mezunlar grubu (24 sn, sessiz) — "CENG '27 Mezunları · 64 üye"
Almanya mavi kart · askerlik · yüksek lisans "zaman kazanıyorum" · remote dolar, stand-up gece 2 · "Leetcode grubu kuran?" (4 "ben") · Tolga caps sayfası · Buse "CV'si olan bana atsın" · "Ozan: 1.204" · "Deniz: yazıyor…" → durur.

D: Herkes bir yere gitmiş. Ben de bir şey yazacaktım. "İyiyim" yazdım, sildim. "Bakıyorum" yazdım, onu da sildim.
O: Bin iki yüz dört başvuru. Bugün bir tanesi döndü: "Pozisyon iç kaynaklardan karşılanmıştır." İç kaynak kim, merak ediyorum.
B: Deniz, grupta hiçbir şey yazmadın. Bir şey soracağım: bu ay kaç kişiyle konuştun? İnsanla diyorum, botla değil.
A: Mezuniyetin dördüncü ayı. Deniz'in son bir hamle hakkı var. Ondan sonra annesi devreye girecek.

### K6 · Deniz'in son hamlesi ne?
- **Gece gündüz Leetcode** — Medium, Hard, Hard, uykusuzluk. (Y+2)
- **Her hafta paylaş** — Ne öğrendiysen yaz. Okuyan olmasa bile. (G+2)
- **Kahve ısmarla** — Eski hocana, eski amirine, tanıdığın herkese. Kahveler senden. (Ç+2)

**K6-A** — Leetcode "Çözülen: 612"
D: Altı yüz on iki soru çözdüm. Rüyamda iki işaretçi birbirine yaklaşıyordu. Uyandım, hâlâ işsizdim. Ama O(n).
A: Bu arada annesi devreye girdi. Kuzeninin bankasından bir müdür aradı. Deniz açmadı; Hard soru çözüyordu.
O: Altı yüz on iki mi? Hoş geldin. Ben bin dört yüze geldim. Rüyamda artık işaretçiler değil, ret mailleri yaklaşıyor.

**K6-B** — gönderi "Hafta 7: Bir hatayı 3 gün aradım. Noktalı virgülmüş. Öğrendiklerim:"
D: Yedi hafta üst üste yazdım. Bir İK uzmanı yorum yaptı: "Noktalı virgül bizde de oldu." Ona mesaj attım. Görüldü. Hâlâ görüldü.
B: Yazılarını okuyorum! Geçen haftakini ekibe attım, herkes noktalı virgülü konuştu. Adını da söyledim tabii.
A: Yedinci yazının altında kırk bir beğeni vardı. Otuz dokuzunu tanımıyordu. Hiçbiri işe alım yapmıyordu, ama hepsi onun adını biliyordu.

**K6-C** — fiş "3 filtre kahve · 210 ₺"
D: Üç kişiye kahve ısmarladım, iki yüz on lira tuttu. Biri beni bir ekibe önerdi. Mülakat sözü aldım. İş değil, söz. Yine de borsadan iyi.
T: Kahveyi bana da ısmarlasaydın abi. Şirkette caps sayfasının başındayım, İK her gün uğruyor. Ben de bir tanıdığım.
B: Kahve mi ısmarladın? Sonunda! Ben bunu dört yıldır yapıyorum. Artık işim de var. Maaşım kahveye yetmiyor, o ayrı.

A: Deniz'in hikâyesi bitmek üzere. Sonu açmadan önce salona tek bir soru.

### NABIZ 2 · Bu ülkede iş bulmanın en büyük belirleyicisi ne? (sonucu değiştirmez, 4 seçenek)
- **Yetenek** — İyi olan kazanır. Eninde sonunda.
- **Çevre** — Kimi tanıdığın, ne bildiğinden önce gelir.
- **Şans** — Doğru dosya, yanlış zaman. Ya da tersi.
- **Baba** — Açıklama gerekmiyor.

---

## SONLAR (öncelik sırası; ilk tutan)

### S1 · REFERANS KAPISI (Ç ≥ 5 ve G ≥ 3) — Kuzey Yazılım, cam toplantı odası
Panel: İK ekranında aynı CV'nin üç kopyası, gönderen: "Kaan Er · Selin T. · Sevgi Abla (?)"
D: Telefon çaldı. Arayan bir zamanlar tanıştığım biriydi. "Söz veremem ama bir mülakat ayarlarım" dedi. Bu ülkede buna kapı denir.
A: Deniz'in CV'si şirkete üç farklı kişiden ulaştı. İK, CV'yi üç kez okudu. Bu bir rekordu.
D: Mülakatta Leetcode sorusu bekliyordum. "SerinYol'u anlat" dediler. İki hafta sonra teklif geldi. Maaş: rekabetçi.
A: Maaşın yarısı kiraya, dörtte biri yola gitti. Deniz ayın yirmisine kadar mühendisti. Yirmisinden sonra yine öğrenci.
B: Kuzey'e hoş geldin! Ben de dördüncü denemede girmiştim. Selin Hanım'a adını ben söyledim, ama kimseye söyleme.
**Son kartı · REFERANS KAPISI** — Çevre kapıyı aralar; içeri girmek ve içeride tutunmak yine senin işin. Görünür ol, tanış, ne yaptığını anlat. Garanti değil; ama bu ülkede onsuz kapı neredeyse hiç aralanmıyor.

### S2 · VİRAL KAZA (DÜRÜM ve G ≥ 3) — oda → telefon → İstanbul'dan görüntülü arama
Panel: caps "İK: 5 yıl deneyimli junior arıyoruz / Adana'dan başvuran aday:" · 48 bin beğeni; DM "Kurucu · Lezzet Teknoloji: Hemşehrim! Kodunu da açtım baktım, fena değil. Pazartesi başla."
D: Fotoğrafım bir caps sayfasında paylaşılmış. Altında üç bin yorum var. Hiçbiri kodumla ilgili değil.
T: Abi o caps'i ben yaptım. Bir sayfaya attım, gerisi bende değil. Komisyon da istemiyorum. Bir dürüm yeter.
A: Mesaj İstanbul'dan geldi. Gönderenin şirketi yemek teknolojisi yapıyordu. Kendisi Adanalıydı. Gerisi coğrafya.
D: Mülakatın ilk sorusu: "Acılı mı, acısız mı?" Doğru cevabı verdim. İkinci soru gelmedi.
A: Deniz İstanbul'a taşındı. Kira maaşın üçte ikisiydi. Altı ay sonra caps unutuldu, şirket küçüldü. Deniz Adana'ya döndü.
**Son kartı · VİRAL KAZA** — Şans gerçek, ama kira ödemez. Şans bile görünür olanı bulur; o fotoğrafı kimse görmeseydi kimse gülmezdi. Şans kapıyı bir kez çalar; içeride tutan yetkinlik ve çevredir.

### S3 · REMOTE DOLAR (Y ≥ 5 ve G ≥ 3) — oda, gece 02.00
Panel: "Daily Stand-up · 02:00 (GMT+3)"; köşede tırmanan kur grafiği.
D: Avrupa'dan bir şirket yazdıklarımı ve kodumu görmüş. Remote başladım. Maaş dolar, kira lira. Hayatımda ilk kez kurdan yanayım.
A: Deniz'in mesaisi gece ikide başlıyor. Annesi komşulara "bilgisayarla bir şeyler yapıyor" diyor. Gerçek bir iş bulmasını bekliyor.
O: Avrupa'dan iş mi? Benim kodum da açık. Hiç yazmadılar. Belki kodumun saat dilimi uymuyordur.
D: Stand-up'ta herkes dün ne yaptığını anlatıyor. Ben "uyudum" diyemiyorum; benim dünüm onların bugünü.
A: Üçüncü ayın sonunda şirket "yeniden yapılanma" duyurdu. Deneme süresindekiler önce gitti. Deniz son stand-up'a saat ikide bağlandı.
**Son kartı · REMOTE DOLAR** — Yetkinlik seni hazırlar, görünürlük seni bulunur kılar. Ama sınırı aşan iş, sınırı aşan riskle gelir. İşini göster, insanlarla bağını koru: bir kapı kapanınca ikincisini çoğu zaman seni hatırlayan biri aralar.

### S4 · MÜKEMMEL CV · SIFIR DÖNÜŞ (Y ≥ 5, G ≤ 2, Ç ≤ 3) — kampüs bankı, akşam
Panel: "Profil görüntülenmesi: 0"; HUD'da Y dolu, G ve Ç boş.
D: Kodum temiz, testlerim yeşil, karmaşıklığım yerinde. Bunları benden başka bilen yok. Bir de Ozan.
O: Hoş geldin. Excel'i paylaşayım mı? Durum sütunu hazır, formülü de yazdım. Hepsi aynı cümleyle doluyor zaten.
D: Ozan'a profil fotoğrafı koymayı önerdim. "Kod konuşsun" dedi. Kod konuşuyor aslında. Sadece kimse dinlemiyor.
A: İkisi akşama kadar bankta oturdu. Bu sırada bölümün en iyi iki yazılımcısını hiçbir şirket aramadı.
D: Bir gün teklif gelirse diye maaş hesabı yaptım: kira, yol, yemek. Teklif gelmedi ama hesap eksi çıktı. En azından hazırlıklıyım.
**Son kartı · MÜKEMMEL CV · SIFIR DÖNÜŞ** — Çok çalışmak olmazsa olmazdır ama yetmez. Kimse görmüyor, kimse tanımıyorsa en iyi kod bir klasörde bekler. Yaptığını göster, insanlarla tanış, stratejiyle başvur. Hiçbiri garanti değil; hiçbirini yapmamak ise garanti.

### S5 · YÜKSEK LİSANS DÖNGÜSÜ (diğer her durum) — bölüm koridoru, asistan masası
Panel: takvim 2027 → 2029 → 2033; masada "Staj Defteri" tutan yeni 3. sınıflar.
D: Yüksek lisansı bitirdim, piyasa düzelmedi. Doktoraya başladım. Hocam "piyasa düzelince çıkarsın" dedi.
A: Hocası doksanlardan beri bekliyor. Bu arada yeni bir üçüncü sınıf öğrencisi kapıyı çaldı: staj defterini imzalatacaktı.
T: Doktora mı abi? Helal. Bizim şirkette de bir doktoralı var, caps sayfasının altyazılarını düzeltiyor. Çok titiz.
D: Biraz görünürdüm, biraz tanıdık, biraz yetkin. Piyasa "biraz"ı sevmiyormuş. Ben de "biraz daha" okudum.
**Son kartı · YÜKSEK LİSANS DÖNGÜSÜ** — Zaman kazanmak strateji değildir; zamanı neye harcadığın stratejidir. Her şeyden biraz yapmak, hiçbir şey yapmamanın en yorucu hâlidir. Bir yön seç, görünür ol, insanlarla tanış. Garantisi yok; beklemenin de yok.

---

## ASUMAN FİNALİ (her sonda aynı; HUD — — —, "Soyadı ✓")
Panel: "Asuman Yıldız yeni bir pozisyona başladı: Chief Innovation Officer @ Yıldızlar Holding · 'Kendi yolumu kendim çizdim.'"
NABIZ 2 çoğunluğuna göre:
- (Yetenek) S: Salon "yetenek" demiş. Ne güzel! Ben de hep söylüyorum: yeteneğin önünde kimse duramaz. Babam da öyle der.
- (Çevre) S: Salon "çevre" demiş. Çok haklısınız! Ben de çevremi hep kendim seçtim. Genelde pazar kahvaltılarında.
- (Şans) S: Salon "şans" demiş. Ben şansa pek inanmam. Hayatımda hiç şansa ihtiyacım olmadı. Herhalde çok çalıştığım içindir.
- (Baba) S: Salon "baba" demiş. Çok tatlısınız! Babama söyleyeceğim, çok gurur duyacak.
S: Yeni pozisyonumdaki ilk işim, genç yeteneklere kapı açmak! Junior alımı başlattık. En az beş yıl deneyim arıyoruz.
(Panel: Perde 3'teki ilanın aynısı. Rakam yine yok.)

## M5 · Epilog (15 sn, sessiz)
- OZAN: "1.204. başvuruda teklif aldı. Maaş kirayı karşılamadı. Şimdi yüksek lisansta; akşamları özel ders veriyor."
- BUSE: "Dördüncü denemede Kuzey Yazılım'da. Kahve makinesi hâlâ şekerli veriyor."
- TOLGA: "Şirket maaşları üç ay geciktirdi. Caps sayfası bir gün bile gecikmedi."
- ASUMAN: "Chief Innovation Officer. Maaşı: rekabetçi. Yolunu kendi çizdi."

→ Son kartı (yukarıda) → **Final kartı (SESSİZ, seslendirilmez; `type:'final'`):** "Mezuniyet.exe yanıt veriyor." / "Bu salondan, henüz adını bilmediğin biriyle tanışmadan çıkma."

---

## Ton (kullanıcı düzeltmesi, 19 Kasım)
- İK / konuşmacı kendiliğinden dönmez: istekler "beklemede", mesajlar "görüldü". Çevre en fazla bir kapıyı aralar (mülakat sözü, CV'nin içeride okunması); Buse bile dördüncü denemede girer.
- En iyi sonlar acı-tatlı: S1 maaş ayın yirmisine kadar yeter; S2 İstanbul kirası, altı ay sonra geri dönüş; S3 deneme süresinde "yeniden yapılanma"; S4 olası maaş hesabı bile eksi; epilogda Ozan teklif alır ama kirayı karşılayamaz, Tolga'nın şirketi maaşları geciktirir.
- Asuman'ın konforu yorumsuz kontrast: bayramda babasından ikramiye, epilogda "Maaşı: rekabetçi."
- Son kartları: "olmazsa olmaz ama yetmez" tonu; vaaz yok.

## Öz-eleştiri notları
- Açıklayan cümleler atıldı: Ozan'ın commit repliğine "kimse beğenmedi" eki yok; kahve makinesi sahnesinde anlatıcı susar; "iç kaynak" ile Asuman'ın terfisi kurguyla yan yana, söylenmez.
- Eklenen tanıdık gerçekler: staj defterini naylonla kaplamak, binde iki startup hissesi, "dört yılda bitirirsem bir yıl eksik", tek hala üç hesap, ret maillerine otomatik teşekkür, mezunlar grubunda yazıp silmek, "annesi devreye girecek".
- Sesli okunuş: sembol ve kısaltmalar `oyun/okunus.js` içinde (O(n log n), CV, İK, CTO, LinkedIn, GitHub, README, production, caps, Leetcode, remote, stand-up…). Rakamlar seslendirilen metinde yazıyla.
- Zayıf olabilecek yerler: K1-C'de iki Deniz repliği art arda; S1'de Y=1 ile referans mümkün (bilinçli).
