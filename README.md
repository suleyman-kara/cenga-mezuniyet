# Mezuniyet.exe Yanıt Vermiyor — CENGA interaktif oyun

Projektörde kendi kendine akan, kararlarını salonun telefonla verdiği interaktif animasyon oyunu.
CENGA sosyal etkinliği için yapıldı (20 Kasım 2026). Karar anında ekranda QR çıkar; seyirciler okutup 30 saniyede oy verir,
çoğunluğun seçtiği yoldan hikâye devam eder.

## Canlı adresler

| Adres | Ne |
|---|---|
| https://cenga-mezuniyet.pages.dev/ | açılış sayfası (`site/vitrin/`) |
| https://cenga-mezuniyet.pages.dev/oyun/ | oyun (sunum dizüstünde açılır, canlı oylama) |
| https://cenga-mezuniyet.pages.dev/oyun/?demo=1 | tek kişilik demo (Firebase ve QR yok, seçeneğe tıklanır) |
| https://cenga-mezuniyet.pages.dev/v/ | seyircinin oy sayfası (QR buraya `?s=<oturum>` ile gelir) |
| https://cenga-mezuniyet.pages.dev/k/ | sunucunun telefon kumandası (U tuşundaki QR ile eşleşir) |

## Sunucu için hızlı başlangıç

Ayrıntılı sunum notu ve prova listesi: **[`oyun/KULLANIM.md`](oyun/KULLANIM.md)**.

1. Etkinlikten önce bir kez iyi internette `/oyun/` adresini aç, sağ altta "✓ Çevrimdışı oynamaya hazır" yazısını bekle.
2. Sol altta "● Canlı oylama hazır" yazısını gör; **U** ile telefon kumandasını eşle (projektör salona açılmadan).
3. **F** ile tam ekran, boşlukla başlat; oyun kendi akar.

| Tuş | İş |
|---|---|
| Boşluk / → / tıklama | ileri (oylamada: oylamayı hemen bitir) |
| ← | geri |
| 1–4 | oylamada o seçeneği kazandır |
| P | duraklat / devam (telefonlardaki oylama da durur) |
| F | tam ekran |
| U / Shift+U | kumanda QR'ını göster/gizle / kumandayı sıfırla |
| O · M · R · K | otomatik akış · ses · baştan · ekran kaydı |

## Dizinler

| Yol | İçerik |
|---|---|
| `oyun/` | Mezuniyet.exe: tek dosyalık motor + hikâye (`index.html`), sesler (`ses/*.wav`, repoda), `oylama/` (firebase/ kopyaları), `sw.js`, `KULLANIM.md`, `baslat.bat` (yerel yedek sunucu) |
| `firebase/` | gerçek zamanlı oylama: `firestore.rules`, oy sayfası `public/v/`, kumanda `public/k/`, oylama kaynağı `src/`, testler — bkz. [`firebase/README.md`](firebase/README.md) |
| `ortak/` | hikâyeden bağımsız Salon çalışma zamanı (`salon.js`, `salon.css`) ve ortak `sw.js` (`oyun/sw.js` bunun kopyası) |
| `site/` | Cloudflare Pages derlemesi `build.mjs` (→ `dist/`) ve testleri `test/` |
| `site/vitrin/` | açılış sayfası (sitenin kökü; `og.jpg`, önizleme videosu, görseller) |
| `tanitim/` | LinkedIn videoları ve gönderi taslağı; `video_kaydet.js` videoları, `og_uret.js` OG görselini üretir |
| `hikaye/` | hikâye incili, karar ağacı, replik taslakları, son dağılımı doğrulaması |
| kök betikler | `replik_cikar.js`, `ses_uret_gemini.py`, `ses_toplu_gemini.py`, `ses_denetle.py` (seslendirme); `metin_kontrol.js` (metin dondurma); `cdp.js`, `kaydet.js`, `kirp.py`, `sayfala.py`, `video_sure_duzelt.py` (ekran görüntüsü ve kayıt) |

Oyun klasörleri derlemesiz çalışır ve ortak dosyaların kopyasını taşır; kopyalar asıllarıyla bayt bayt aynı olmalı
(`node site/build.mjs` farklıysa durur ve ne kopyalanacağını yazar).

## Yayın

- **Cloudflare Pages** GitHub'a bağlı, her push'ta derler. Ayarlar: derleme komutu `node site/build.mjs`,
  çıktı klasörü `dist`, ortam değişkeni `NODE_VERSION=22`. Yeni oyun yayımlamak = `site/build.mjs` içindeki `OYUNLAR`'a bir satır.
- **Firestore kuralları** otomatik yayımlanmaz: `firebase/firestore.rules` değişince konsolda Firestore > Rules'a yapıştırın
  ya da `cd firebase && npx firebase deploy --only firestore:rules`. Eski kurallarla kumanda "permission-denied" alır.
- **Firebase Auth**: Authentication > Settings > Authorized domains listesinde `cenga-mezuniyet.pages.dev` olmalı (anonim giriş açık).

## Çevrimdışı önbellek

Derleme her oyun için `manifest.json` (dosya başına sha256 özeti ve boyut) üretir; `sw.js` bunu okuyup bütün dosyaları önbelleğe alır.
Yeni sürümde yalnız özeti değişen dosyalar yeniden iner, hepsi inmeden etkin sürüm değişmez; açık sunum kendiliğinden yenilenmez.
İnternet yalnız canlı oylama için gerekir. `?sw=0` önbelleği kapatır.

## Geliştirme ve testler

```bash
cd firebase && npm ci && npm test          # birim + Firestore kural + entegrasyon testleri (emülatör için Java gerekir)
node site/build.mjs                        # dist/ üretir
node --test 'site/test/*.test.mjs'         # derleme testleri
node site/test/e2e-offline.mjs             # çevrimdışı önbellek uçtan uca (Playwright + Chromium)
```

Tarayıcıda (yerel sunucu, ör. `oyun/baslat.bat` ya da `npx serve -l 8765 oyun`):
`oyun/index.html?test=1` bütün yolları dener, `?sahte=1` sahte oylarla prova, `?vitrin=1` bütün sahneleri gösterir.
Aynı testler GitHub Actions'ta (`.github/workflows/testler.yml`) her push'ta çalışır.

## Seslendirme

1. Metin değiştiyse `node replik_cikar.js <oyun>` replik listesini (`<oyun>/ses/replikler.json`) yeniden çıkarır.
2. GitHub Actions > **seslendirme** (`.github/workflows/ses.yml`) elle çalıştırılır: `ornek` her karakterden tek replik, `tam` hepsi.
   Gemini TTS ile üretir, `ses_denetle.py` şüpheli dosyaları ayıklar, sonuç `ses` dalına gönderilir; oradan `oyun/ses/`'e alınır.
3. Anahtar GitHub'da `GEMINI_API_KEY` sırrındadır. Yerelde ortam değişkeni ya da `gemini_key.txt` kullanılır;
   **anahtarlar asla commit edilmez** (`.gitignore` engeller).
4. Dondurulmuş metin kontrolü: `node metin_kontrol.js <oyun>` (önce bir kez `--dondur`); metin değişirse ses eşleşmesi kopar.

Oyunun sesleri (`oyun/ses/*.wav`) bilerek repoda tutulur ki oyun her bilgisayarda doğrudan çalışsın. Diğer `*.wav`/`*.mp4`
çıktıları yok sayılır; istisnalar `tanitim/*.mp4` ve `site/vitrin/onizleme.mp4`.

## Yeni oyun

Başka bir etkinlik için aynı altyapıyla yeni etkileşimli oyun: **[`YENI-OYUN.md`](YENI-OYUN.md)**
(bilgi yarışması için değil; kulübün kendi Kahoot benzeri aracı var).
