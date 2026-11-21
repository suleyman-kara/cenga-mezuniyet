# Mezuniyet.exe — LinkedIn gönderileri ve kulüplere demo

Bağlantılar:
- Açılış sayfası: https://cenga-mezuniyet.pages.dev/
- Tek kişilik demo: https://cenga-mezuniyet.pages.dev/oyun/?demo=1
- Videolar: `tanitim/linkedin-16x9.mp4` (1920×1080, 75 sn), `tanitim/linkedin-kare.mp4` (1080×1080, akışta daha büyük görünür; LinkedIn için önerilen)

Köşeli parantezli yerler (`[...]`) sizin dolduracağınız yerler. Etiketlenecek kişileri gönderiyi yazarken `@` ile seçin.

---

## Paylaşmadan önce kontrol listesi

- [ ] **Gerçek kişiler:** Karakterlerde ya da esprilerde tanıdık birine (hoca, arkadaş, kulüp üyesi, kantinci, bölüm çalışanı…) gönderme varsa o kişiden **açık izin alındı**. İzin yoksa o sahne videodan/görsellerden çıkarıldı ya da isim değiştirildi.
- [ ] **Yapay zekâ seslendirmesi:** Gönderide seslendirmenin yapay zekâ (Gemini TTS) ile üretildiği yazıyor (aşağıdaki taslaklarda var; silmeyin). Açılış sayfasının altında da yazıyor.
- [ ] Gönderide adı geçen/etiketlenen herkes etiketlenmeyi kabul etti.
- [ ] Videonun ve açılış sayfasındaki görsellerin kurum/şirket adlarıyla (Yıldızlar Holding, Kuzey Yazılım… hepsi kurgu) gerçek bir şirketi çağrıştırmadığını bir kez daha gözden geçirdim.
- [ ] Açılış sayfasındaki yer tutucular dolduruldu ya da bilerek boş bırakıldı: `site/vitrin/index.html` sonundaki `ILETISIM`, `SALON_SAYISI`, `HAZIRLAYANLAR` sabitleri (boş olanlar sayfada görünmez).
- [ ] Oyundaki "Bu ne?" penceresinin bağlantısı (`oyun/index.html` içinde `DEMO_BAGLANTI`) istenirse açılış sayfasına yönlendirildi.
- [ ] Demo bağlantısını telefonda bir kez açıp denedim (sesi aç, ilk kararda seçeneğe dokun).
- [ ] LinkedIn bağlantı önizlemesi doğru: https://www.linkedin.com/post-inspector/ adresine açılış sayfasını yapıştırıp görseli kontrol et (önbelleği de yeniler).
- [ ] Video yüklerken altyazı istenirse: oyundaki replikler ekranda zaten yazılı; ayrıca .srt gerekmez.

---

## Taslak 1 — Hikâye anlatan (Türkçe)

> Projeksiyonda bir Windows hata penceresi: "Mezuniyet.exe yanıt vermiyor."
>
> 20 Kasım'da [CENGA etkinliğinin adı]'nda salona bir hikâye izletmedik; salona bir hikâye oynattık.
>
> Kahramanımız Deniz, bilgisayar mühendisliği öğrencisi. Dolmuşta ayakta staj arıyor (kapasite on dört kişi, şoföre göre bu bir öneri). Sonra mezun oluyor ve Türkiye'de iş arıyor. Torpil mi, ücretsiz startup mı? LinkedIn'e düzgün profil fotoğrafı mı, dürümlü fotoğraf mı? Bu kararları biz vermedik: salon verdi.
>
> Her karar anında perdede bir QR çıktı. Herkes telefonundan okuttu, 30 saniyede oy verdi, çubuklar canlı doldu ve "SALON KARAR VERDİ!" yazısıyla hikâye o yöne dallandı. 6 karar, 5 farklı son, yaklaşık 20 dakika. Bizim salon [son adı] sonuna ulaştı. 😅
>
> Arkasında bir oyun motoru, gerçek zamanlı oylama, telefondan kumanda ve yapay zekâyla seslendirilmiş 146 replik var. Hepsini [kaç] kişilik ekip olarak [süre] içinde kurduk.
>
> Kaçıranlar için tek kişilik demo açık; kararları siz veriyorsunuz:
> 👉 https://cenga-mezuniyet.pages.dev
>
> Emeği geçen herkese teşekkürler: [@isim], [@isim], [@isim].
> Kulübünüzün etkinliği için benzerini düşünüyorsanız yazın, konuşalım.
>
> Not: Karakterler kurgudur, seslendirmeler yapay zekâ (Gemini TTS) ile üretilmiştir.
>
> #CENGA #bilgisayarmühendisliği #öğrencikulübü #interaktifhikaye #oyungeliştirme [#üniversiteadı]

## Taslak 2 — Kısa ve teknik (Türkçe)

> Bir öğrenci kulübü etkinliği için salonun telefonla oy verdiği interaktif bir animasyon oyunu yaptık: "Mezuniyet.exe yanıt vermiyor."
>
> 🎬 Projeksiyonda kendi kendine akan, seslendirilmiş bir hikâye
> 📱 Karar anında QR → telefondan oy → çubuklar canlı dolar
> 🌳 6 karar, 5 son
>
> Teknik taraf:
> • Tek dosyalık oyun motoru (HTML/CSS/JS, çatı ve derleme yok)
> • Firebase Firestore ile gerçek zamanlı oylama; Cloud Functions yok, sayımı sunum bilgisayarı yapıyor
> • Service Worker ile çevrimdışı önbellek: internet giderse oyun akmaya devam ediyor
> • Sunucu için telefon kumandası
> • 146 replik Gemini TTS ile seslendirildi (yapay zekâ seslendirmesi)
> • Cloudflare Pages'te yayında
>
> Demo (tek kişilik, kararları siz veriyorsunuz): https://cenga-mezuniyet.pages.dev
>
> [@ekip arkadaşları] · #webdev #firebase #javascript #gamedev #CENGA

## Draft 3 — English

> "Mezuniyet.exe is not responding." (Mezuniyet = graduation, in Turkish.)
>
> For our computer engineering club's social night on 20 November, we built an interactive animated story that the whole room played together. It follows Deniz, a CS student hunting for an internship and then a job in Turkey, with plenty of dark humour about what happens after graduation.
>
> At each decision point a QR code appeared on the projector. The audience scanned it, voted on their phones within 30 seconds, watched the bars fill live, and the story branched with "THE ROOM HAS DECIDED!". 6 decisions, 5 endings, ~20 minutes.
>
> Under the hood: a single-file game engine (plain HTML/CSS/JS), real-time voting on Firebase Firestore with no Cloud Functions (the presenter's laptop does the counting), an offline cache via Service Worker, a phone remote for the presenter, and 146 lines voiced with AI text-to-speech (Gemini TTS).
>
> The story is in Turkish, but there is a single-player demo where you make the choices: https://cenga-mezuniyet.pages.dev
>
> Thanks to [@names]. If your club or community wants something like this for an event, get in touch.
>
> #studentclubs #interactivestorytelling #webdev #firebase #gamedev

**Hashtag havuzu:** #CENGA #bilgisayarmühendisliği #yazılım #öğrencikulübü #kariyer #mezuniyet #interaktifhikaye #oyungeliştirme #webdev #javascript #firebase #gamedev #yapayzeka [#üniversite] [#şehir]

**Paylaşım ipuçları:** Videoyu (kare olanı) doğrudan LinkedIn'e yükleyin; bağlantıyı gönderi metnine koyun. Kapak karesi olarak 8. saniyedeki dolmuş sahnesini ya da 26. saniyedeki "SALON KARAR VERDİ!" karesini seçin. LinkedIn videoları sessiz başlatır; ekrandaki yazılar sessizken de hikâyeyi anlatır.

---

## Diğer kulüplere: e-posta / DM şablonu

**Konu:** Etkinliğiniz için salonun telefonla oynadığı interaktif bir oyun

> Merhaba [kulüp adı] ekibi,
>
> Biz [üniversite] CENGA'dan [adınız]. 20 Kasım'daki etkinliğimizde salonun telefonla oy verdiği interaktif bir animasyon oyunu oynattık: "Mezuniyet.exe yanıt vermiyor." Projeksiyonda hikâye akıyor, karar anlarında herkes QR'ı okutup oy veriyor, hikâye salonun kararıyla dallanıyor. Uygulama indirmek ya da hesap açmak gerekmiyor.
>
> Kısa özet: https://cenga-mezuniyet.pages.dev (oradan tek kişilik demoyu da oynayabilirsiniz)
>
> Benzerini sizin etkinliğiniz için yapabiliriz: bu oyunu kendi bölümünüze ve iç şakalarınıza uyarlayabilir ya da sıfırdan yeni bir interaktif oyun kurabiliriz. İsterseniz 15 dakikalık bir görüntülü görüşmede canlı gösterelim; siz de telefonlarınızla oy verin.
>
> Uygun olduğunuz bir zaman var mı?
>
> [Ad Soyad] · [iletişim]

**Kısa DM sürümü:**

> Selam! CENGA'dan [ad]. Etkinliğimizde salonun telefonla oy verip yön verdiği bir hikâye oyunu yaptık; özeti ve demosu burada: https://cenga-mezuniyet.pages.dev. Sizin etkinliğiniz için de uyarlayabiliriz; 15 dakikalık bir canlı gösterim ister misiniz?

---

## 5 dakikalık canlı demo senaryosu (başka bir kulübe gösterirken)

**Hazırlık (görüşmeden önce):**
- Dizüstünde Chrome/Edge'de iki sekme açık:
  1. **Canlı oylama:** `https://cenga-mezuniyet.pages.dev/oyun/?yeni=1` (yeni oturum, gerçek QR; karşı taraf kendi telefonuyla oy verebilir). Sol altta "● Canlı oylama hazır" yazısını gör.
  2. **B planı:** `https://cenga-mezuniyet.pages.dev/oyun/?sahte=1` (internet/Firebase sorunu olursa sahte oy çubukları).
- Kendi telefonun elinde (kumanda için). Ses açık; görüntülü görüşmede "bilgisayar sesini paylaş" seçili.
- Açılış sayfası (`https://cenga-mezuniyet.pages.dev`) üçüncü sekmede.

| Süre | Ne gösterilir | Ne söylenir |
|---|---|---|
| 0:00–0:30 | Açılış sayfası: hero ve önizleme videosu | "Etkinlikte salon bunu projeksiyonda izledi; ama izlemedi, oynadı." |
| 0:30–1:15 | 1. sekme. **U** → köşede kumanda QR'ı; kendi telefonunla okut ("✓ Kumanda bağlandı"). **F** ile tam ekran, boşlukla başlat. Başlık penceresinde imleç "Bekle"ye gider. | "Sunucu sahnede dolaşırken her şeyi telefondan yönetiyor." Kumandadan **İleri ▶** ile 2–3 repliği geç (dolmuş, Ozan, Buse). |
| 1:15–2:45 | İlk **karar anı** gelene kadar ileri. QR perdede. Karşı tarafa: "Telefonunuzla okutun, oy verin." Çubuklar canlı dolar; süre bitince ya da kumandadan **Oylamayı bitir** ile "SALON KARAR VERDİ!" | "Uygulama yok, hesap yok. 30 saniye. Oyunu süre bitene kadar değiştirebilirsiniz. Oy gelmezse ya da berabere kalırsa kura." |
| 2:45–3:30 | Kararın sonucu olan sahneyi göster (ör. Yıldızlar Holding bodrum katı). Sonra kumandadan **⏸ Duraklat**. | "Her karar sonraki sahneleri ve sonu değiştiriyor: 6 karar, 5 son. Hikâye bizim bölümün iç şakalarıyla dolu; sizinkine uyarlanabilir." |
| 3:30–4:15 | Yeni sekmede `…/oyun/?demo=1` (telefonda da açılabilir). Bir seçeneğe tıkla. | "Paylaşım için tek kişilik demo: herkes kendi kararını veriyor." |
| 4:15–5:00 | Açılış sayfasında **Teknik** ve **Kulübünüz için** bölümleri. | "Tek dosya oyun motoru, Firestore ile gerçek zamanlı oylama, Cloud Functions yok, çevrimdışı önbellek, AI seslendirme. Sizin etkinliğiniz için ne yapabileceğimizi konuşalım." |

**Sorun olursa:**
- Canlı oylama bağlanmadıysa 2. sekmeye (`?sahte=1`) geç: çubuklar kendiliğinden dolar; **1–4** tuşlarıyla istediğin seçeneği kazandır.
- Doğrudan ilk karara atlamak için (sahte oylarla): `…/oyun/?sahte=1&yol=&adim=12&ses=1` açılır, ilk tıklamada akış başlar.
- Telefon kumandası yalnızca canlı bağlantıda çalışır; sahte kipte klavyeyi kullan (boşluk: ileri, ←: geri, P: duraklat, M: ses).
- Oylama sırasında ekrana tıklamak oylamayı erken bitirir.
