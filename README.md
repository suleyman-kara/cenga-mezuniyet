# Mezuniyet.exe — CENGA interaktif oyun

Salonun telefonla oy verdiği, kendi kendine akan interaktif animasyon oyunu (CENGA sosyal etkinliği, 20 Kasım 2026).

- `oyun/` — tek dosyalık oyun motoru ve hikâye (`index.html`)
- `ortak/` — hikâyeden bağımsız Salon çalışma zamanı (`salon.js` + `salon.css`: oylama, oturum, QR, kumanda, çevrimdışı önbellek) ve ortak `sw.js` (`oyun/sw.js` bunun kopyası); yeni etkileşimli oyunlar için
- **Başka etkinlik için yeni oyun: [`YENI-OYUN.md`](YENI-OYUN.md)** (bilgi yarışması için değil: kulübün kendi Kahoot benzeri aracı var)
- `firebase/` — gerçek zamanlı oylama: Firestore kuralları, oy sayfası, testler (TDD)
- `hikaye/` — hikâye incili, karar ağacı, son dağılımı
- `site/` — Cloudflare Pages derlemesi (`node site/build.mjs` → `dist/`: oyunlar (`OYUNLAR` listesi; şimdilik /oyun/) + her birinin çevrimdışı önbellek manifesti + oy sayfası); Cloudflare Pages GitHub'a bağlı: her push'ta derler (ayarlar: derleme komutu `node site/build.mjs`, çıktı klasörü `dist`, `NODE_VERSION=22`)
- `site/vitrin/` — açılış sayfası (cenga-mezuniyet.pages.dev kökü; OG görseli `og.jpg`, `node tanitim/og_uret.js` ile üretilir)
- `tanitim/` — LinkedIn videoları (`node tanitim/video_kaydet.js` yeniden üretir), gönderi taslakları ve demo senaryosu (`linkedin-gonderi.md`)
- kökteki betikler — replik çıkarma, seslendirme (Gemini TTS), metin dondurma, ekran görüntüsü ve kayıt araçları

Ses dosyaları (`*.wav`) ve API anahtarları repoya girmez.
