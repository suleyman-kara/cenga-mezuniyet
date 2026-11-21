# Mezuniyet.exe — LinkedIn gönderileri

Bağlantılar:
- Açılış sayfası: https://cenga-mezuniyet.pages.dev/
- Tek kişilik demo: https://cenga-mezuniyet.pages.dev/oyun/?demo=1
- Videolar: `tanitim/linkedin-16x9.mp4` (1920×1080, 75 sn), `tanitim/linkedin-kare.mp4` (1080×1080, akışta daha büyük görünür; LinkedIn için önerilen)

Sabit bilgiler doldu: oyunu **Süleyman Kara** geliştirdi, fikir **CENGA**'dan; etkinlikte **20 kişi** canlı oynayıp oy verdi; hikâye ve karakterler **tamamen kurgu**; seslendirme **yapay zekâ (Gemini TTS)**. İletişim: suleymankara600@gmail.com · https://www.linkedin.com/in/suleymankara/ · https://github.com/suleyman-kara

Köşeli parantezli yerler (`[...]`) hâlâ sizin dolduracağınız ya da sileceğiniz yerler. Etiketlenecek kişileri gönderiyi yazarken `@` ile seçin.

---

## Paylaşmadan önce kontrol listesi

- [x] **Gerçek kişiler:** Geçerli değil. Hikâye, karakterler ve olaylar tamamen kurgu; gerçek bir kişiye gönderme yok.
- [ ] **Yapay zekâ seslendirmesi:** Gönderide seslendirmenin yapay zekâ (Gemini TTS) ile üretildiği yazıyor (aşağıdaki taslaklarda var; silmeyin). Açılış sayfasının altında da yazıyor.
- [ ] Gönderide adı geçen/etiketlenen herkes etiketlenmeyi kabul etti.
- [ ] Videonun ve açılış sayfasındaki görsellerin kurum/şirket adlarıyla (Yıldızlar Holding, Kuzey Yazılım… hepsi kurgu) gerçek bir şirketi çağrıştırmadığını bir kez daha gözden geçirdim.
- [x] Açılış sayfası dolduruldu: iletişim (e-posta, LinkedIn, GitHub; Instagram bilerek boş), "20 kişi" kutusu ve alt bilgide "Geliştiren: Süleyman Kara · Fikir: CENGA".
- [ ] Oyundaki "Bu ne?" penceresinin bağlantısı (`oyun/index.html` içinde `DEMO_BAGLANTI`) istenirse açılış sayfasına yönlendirildi.
- [ ] Demo bağlantısını telefonda bir kez açıp denedim (sesi aç, ilk kararda seçeneğe dokun).
- [ ] LinkedIn bağlantı önizlemesi doğru: https://www.linkedin.com/post-inspector/ adresine açılış sayfasını yapıştırıp görseli kontrol et (önbelleği de yeniler).
- [ ] Video yüklerken altyazı istenirse: oyundaki replikler ekranda zaten yazılı; ayrıca .srt gerekmez.

---

## Taslak 1 — Hikâye anlatan (Türkçe)

> Projeksiyonda bir Windows hata penceresi: "Mezuniyet.exe yanıt vermiyor."
>
> 20 Kasım'daki CENGA sosyal etkinliğinde salona bir hikâye izletmedik; salona bir hikâye oynattık.
>
> Kahramanımız Deniz, bilgisayar mühendisliği öğrencisi. Dolmuşta ayakta staj arıyor (kapasite on dört kişi, şoföre göre bu bir öneri). Sonra mezun oluyor ve Türkiye'de iş arıyor. Torpil mi, ücretsiz startup mı? LinkedIn'e düzgün profil fotoğrafı mı, dürümlü fotoğraf mı? Bu kararları biz vermedik: salon verdi.
>
> Her karar anında perdede bir QR çıktı. Herkes telefonundan okuttu, 30 saniyede oy verdi, çubuklar canlı doldu ve "SALON KARAR VERDİ!" yazısıyla hikâye o yöne dallandı. 6 karar, 5 farklı son, yaklaşık 20 dakika. Etkinlikte 20 kişi canlı oynadı; bizim salon [son adı] sonuna ulaştı. 😅
>
> Arkasında bir oyun motoru, gerçek zamanlı oylama, telefondan kumanda ve yapay zekâyla seslendirilmiş 146 replik var. Fikir CENGA'dan geldi; oyunu ben geliştirdim[, süre: ör. üç haftada].
>
> Kaçıranlar için tek kişilik demo açık; kararları siz veriyorsunuz:
> 👉 https://cenga-mezuniyet.pages.dev
>
> Fikir ve etkinlik için CENGA'ya teşekkürler[: @CENGA sayfası ve etiketlemek istediğiniz kişiler; izinlerini aldıktan sonra ekleyin, yoksa bu kısmı silin].
>
> Not: Hikâye, karakterler ve olaylar tamamen kurgudur; seslendirmeler yapay zekâ (Gemini TTS) ile üretilmiştir.
>
> #CENGA #bilgisayarmühendisliği #öğrencikulübü #interaktifhikaye #oyungeliştirme [#üniversiteadı]

## Taslak 2 — Kısa ve teknik (Türkçe)

> CENGA'nın fikriyle, kulübün etkinliği için salonun telefonla oy verdiği interaktif bir animasyon oyunu geliştirdim: "Mezuniyet.exe yanıt vermiyor."
>
> 🎬 Projeksiyonda kendi kendine akan, seslendirilmiş bir hikâye
> 📱 Karar anında QR → telefondan oy → çubuklar canlı dolar
> 🌳 6 karar, 5 son
> 👥 Etkinlikte 20 kişi canlı oynadı
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
> Hikâye tamamen kurgudur. [@CENGA ve etiketlenecek kişiler; izin aldıktan sonra] · #webdev #firebase #javascript #gamedev #CENGA

## Draft 3 — English

> "Mezuniyet.exe is not responding." (Mezuniyet = graduation, in Turkish.)
>
> For CENGA's (our computer engineering club) social night on 20 November, I built an interactive animated story that the whole room played together. The idea came from CENGA; I developed the game. It follows Deniz, a CS student hunting for an internship and then a job in Turkey, with plenty of dark humour about what happens after graduation.
>
> At each decision point a QR code appeared on the projector. The audience scanned it, voted on their phones within 30 seconds, watched the bars fill live, and the story branched with "THE ROOM HAS DECIDED!". 6 decisions, 5 endings, ~20 minutes; 20 people played it live.
>
> Under the hood: a single-file game engine (plain HTML/CSS/JS), real-time voting on Firebase Firestore with no Cloud Functions (the presenter's laptop does the counting), an offline cache via Service Worker, a phone remote for the presenter, and 146 lines voiced with AI text-to-speech (Gemini TTS).
>
> The story is in Turkish, but there is a single-player demo where you make the choices: https://cenga-mezuniyet.pages.dev
>
> The story and characters are entirely fictional. Thanks to CENGA for the idea [@CENGA and anyone else you tag, with their permission].
>
> #studentclubs #interactivestorytelling #webdev #firebase #gamedev

**Hashtag havuzu:** #CENGA #bilgisayarmühendisliği #yazılım #öğrencikulübü #kariyer #mezuniyet #interaktifhikaye #oyungeliştirme #webdev #javascript #firebase #gamedev #yapayzeka [#üniversite] [#şehir]

**Paylaşım ipuçları:** Videoyu (kare olanı) doğrudan LinkedIn'e yükleyin; bağlantıyı gönderi metnine koyun. Kapak karesi olarak 8. saniyedeki dolmuş sahnesini ya da 26. saniyedeki "SALON KARAR VERDİ!" karesini seçin. LinkedIn videoları sessiz başlatır; ekrandaki yazılar sessizken de hikâyeyi anlatır.

---

## Canlı demo nasıl gösterilir (5 dakika)

**Hazırlık:**
- Dizüstünde Chrome/Edge'de iki sekme açık:
  1. **Canlı oylama:** `https://cenga-mezuniyet.pages.dev/oyun/?yeni=1` (yeni oturum, gerçek QR; izleyenler kendi telefonuyla oy verebilir). Sol altta "● Canlı oylama hazır" yazısını gör.
  2. **B planı:** `https://cenga-mezuniyet.pages.dev/oyun/?sahte=1` (internet/Firebase sorunu olursa sahte oy çubukları).
- Kendi telefonun elinde (kumanda için). Ses açık; görüntülü görüşmedeysen "bilgisayar sesini paylaş" seçili.
- Açılış sayfası (`https://cenga-mezuniyet.pages.dev`) üçüncü sekmede.

| Süre | Ne gösterilir | Ne söylenir |
|---|---|---|
| 0:00–0:30 | Açılış sayfası: hero ve önizleme videosu | "Etkinlikte salon bunu projeksiyonda izledi; ama izlemedi, oynadı." |
| 0:30–1:15 | 1. sekme. **U** → köşede kumanda QR'ı; kendi telefonunla okut ("✓ Kumanda bağlandı"). **F** ile tam ekran, boşlukla başlat. Başlık penceresinde imleç "Bekle"ye gider. | "Sunucu sahnede dolaşırken her şeyi telefondan yönetiyor." Kumandadan **İleri ▶** ile 2–3 repliği geç (dolmuş, Ozan, Buse). |
| 1:15–2:45 | İlk **karar anı** gelene kadar ileri. QR perdede. İzleyenlere: "Telefonunuzla okutun, oy verin." Çubuklar canlı dolar; süre bitince ya da kumandadan **Oylamayı bitir** ile "SALON KARAR VERDİ!" | "Uygulama yok, hesap yok. 30 saniye. Oyunu süre bitene kadar değiştirebilirsiniz. Oy gelmezse ya da berabere kalırsa kura." |
| 2:45–3:30 | Kararın sonucu olan sahneyi göster (ör. Yıldızlar Holding bodrum katı). Sonra kumandadan **⏸ Duraklat**. | "Her karar sonraki sahneleri ve sonu değiştiriyor: 6 karar, 5 son. Hikâye bizim bölümün iç şakalarıyla dolu." |
| 3:30–4:15 | Yeni sekmede `…/oyun/?demo=1` (telefonda da açılabilir). Bir seçeneğe tıkla. | "Paylaşım için tek kişilik demo: herkes kendi kararını veriyor." |
| 4:15–5:00 | Açılış sayfasında **Teknik** bölümü. | "Tek dosya oyun motoru, Firestore ile gerçek zamanlı oylama, Cloud Functions yok, çevrimdışı önbellek, AI seslendirme." |

**Sorun olursa:**
- Canlı oylama bağlanmadıysa 2. sekmeye (`?sahte=1`) geç: çubuklar kendiliğinden dolar; **1–4** tuşlarıyla istediğin seçeneği kazandır.
- Doğrudan ilk karara atlamak için (sahte oylarla): `…/oyun/?sahte=1&yol=&adim=12&ses=1` açılır, ilk tıklamada akış başlar.
- Telefon kumandası yalnızca canlı bağlantıda çalışır; sahte kipte klavyeyi kullan (boşluk: ileri, ←: geri, P: duraklat, M: ses).
- Oylama sırasında ekrana tıklamak oylamayı erken bitirir.
