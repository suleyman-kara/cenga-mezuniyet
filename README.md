# Mezuniyet.exe — CENGA interaktif oyun

Salonun telefonla oy verdiği, kendi kendine akan interaktif animasyon oyunu (CENGA sosyal etkinliği, 20 Kasım 2026).

- `oyun/` — tek dosyalık oyun motoru ve hikâye (`index.html`)
- `firebase/` — gerçek zamanlı oylama: Firestore kuralları, oy sayfası, testler (TDD)
- `hikaye/` — hikâye incili, karar ağacı, son dağılımı
- `site/` — Cloudflare Pages derlemesi (`node site/build.mjs` → `dist/`: oyun + çevrimdışı önbellek manifesti + oy sayfası); Cloudflare Pages GitHub'a bağlı: her push'ta derler (ayarlar: derleme komutu `node site/build.mjs`, çıktı klasörü `dist`, `NODE_VERSION=22`)
- kökteki betikler — replik çıkarma, seslendirme (Gemini TTS), metin dondurma, ekran görüntüsü ve kayıt araçları

Ses dosyaları (`*.wav`) ve API anahtarları repoya girmez.
