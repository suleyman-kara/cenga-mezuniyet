# Yeni etkinlik, yeni oyun — Salon altyapısıyla

Mezuniyet.exe için kurulan altyapı (projektörde akan, salonun telefonla oy verdiği oyun) hikâyeden ayrılıp
`ortak/salon.js` olarak çıkarıldı. Yeni bir **etkileşimli** salon oyunu bunun üzerine birkaç yüz satırla kurulabilir.

> **Bilgi yarışması için bu altyapıyı kullanmayın:** kulübün zaten kendi Kahoot benzeri yarışma yazılımı var.
> Salon; hikâye, karar, tartışma ve simülasyon gibi "salon birlikte karar verir" oyunları içindir.

```
ortak/                  ASIL dosyalar (hikâyeden bağımsız)
  salon.js  salon.css   Salon çalışma zamanı: oylama bağlantısı, oturum, QR, durum yazısı, kumanda, çevrimdışı önbellek
  sw.js                 çevrimdışı önbellek (her oyun klasörü kendi kapsamında; oyun/sw.js bunun kopyası)
firebase/               Firestore kuralları, telefon oy sayfası /v/, kumanda sayfası /k/, oylama kaynağı (src/), testler
oyun/                   Mezuniyet.exe (Salon'u kullanmaz, aşağıya bakın)
site/build.mjs          Cloudflare Pages derlemesi → dist/ (her oyun + manifest + _headers)
```

Oyun klasörleri **derlemesiz** çalışır ve kendi kopyalarını taşır (`<oyun>/oylama/`, `<oyun>/ortak/`, `<oyun>/sw.js`):
klasör tek başına sunulabilir, Service Worker kapsamı klasörle sınırlıdır. Kopyalar asıllarıyla **bayt bayt aynı** olmalı;
`node site/build.mjs` farklıysa durur ve hangi dosyayı nereye kopyalayacağınızı yazar.

---

## 1. Yeni oyun klasörü

Örnek ad: `kod-mahkemesi`.

```bash
mkdir -p kod-mahkemesi/oylama kod-mahkemesi/ortak
cp firebase/vote-core.js firebase/qr-svg.js firebase/vendor/qr.js firebase/src/firebase-source.js firebase-config.js kod-mahkemesi/oylama/
cp ortak/salon.js ortak/salon.css kod-mahkemesi/ortak/
cp ortak/sw.js kod-mahkemesi/sw.js
```

Sonra `kod-mahkemesi/index.html` yazın (aşağıdaki iskelet) ve `site/build.mjs`'e iki şey ekleyin:

1. `OYUNLAR` listesine bir satır:
   ```js
   { klasor: 'kod-mahkemesi', dahil: ['index.html', 'sw.js', 'oylama/', 'ortak/'] },
   ```
   (`'klasör/'` bütün ağaç, `'ses/*.wav'` bir klasördeki uzantılılar; listede olmayan hiçbir şey yayımlanmaz,
   `uzunOnbellek: ['ses/*']` ile büyük dosyalara 30 günlük önbellek başlığı verilir.)
2. `SENKRON_CIFTLERI` listesine kopyalar (`[kopya, asıl]`):
   ```js
   ['kod-mahkemesi/sw.js', 'ortak/sw.js'],
   ['kod-mahkemesi/ortak/salon.js', 'ortak/salon.js'],
   ['kod-mahkemesi/ortak/salon.css', 'ortak/salon.css'],
   ['kod-mahkemesi/oylama/vote-core.js', 'firebase/vote-core.js'],
   ['kod-mahkemesi/oylama/qr-svg.js', 'firebase/qr-svg.js'],
   ['kod-mahkemesi/oylama/qr.js', 'firebase/vendor/qr.js'],
   ['kod-mahkemesi/oylama/firebase-source.js', 'firebase/src/firebase-source.js'],
   ['kod-mahkemesi/oylama/firebase-config.js', 'firebase-config.js'],
   ```

Ortak bir dosyayı değiştirdiyseniz kopyalarını da güncelleyin (ör. `cp ortak/sw.js oyun/sw.js`,
`cp firebase/src/firebase-source.js firebase/src/mock-source.js oyun/oylama/`); derleme ve
`firebase/test/unit/oylama-kopya.test.js` farkı yakalar.

## 2. En küçük iskelet

```html
<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kod Mahkemesi</title>
<link rel="stylesheet" href="ortak/salon.css">
<style>body{margin:0;background:#0a0e1a;color:#fff;font-family:system-ui,sans-serif;overflow:hidden}
#sahne{display:flex;flex-direction:column;gap:24px;padding:60px;box-sizing:border-box}#qr svg{width:260px;height:260px;background:#fff}</style>
</head><body>
<div id="sahne"><h1 id="soru">Hazır olunca Boşluk</h1><div id="secenekler"></div><div id="qr"></div></div>
<script src="oylama/vote-core.js"></script><script src="oylama/qr.js"></script><script src="oylama/qr-svg.js"></script>
<script src="oylama/firebase-config.js"></script><script src="ortak/salon.js"></script>
<script>
Salon.sahneOlcekle(document.getElementById('sahne'), 1920, 1080);
const KARARLAR = [
  { q: 'Sanık: if (x == null). Hüküm?', o: ['Suçlu', 'Suçsuz', 'Şartlı tahliye'] },
  { q: 'Savunmadan sonra hüküm?', o: ['Suçlu', 'Suçsuz', 'Şartlı tahliye'] },
];
let pos = 0, acik = null;   // acik: {k, c, kalan}
const salon = Salon.baslat({
  oyunAdi: 'Kod Mahkemesi', anahtar: 'kod-mahkemesi',
  kumanda: { ileri: () => ileri(), kazan: (i) => salon.oylama.forceWin(i) },
  durum: () => ({ pos, toplam: KARARLAR.length, faz: acik ? 'oylama' : 'bekle', metin: (KARARLAR[pos] || {}).q || '',
    karar: acik ? { q: KARARLAR[pos].q, o: KARARLAR[pos].o, c: acik.c, kalan: acik.kalan / 1000, acik: true } : null }),
});
salon.hazir.then(({ oyUrl }) => { document.getElementById('qr').innerHTML = salon.qrSvg(oyUrl); });

async function ileri() {
  if (acik || pos >= KARARLAR.length) return;
  const k = KARARLAR[pos];
  document.getElementById('soru').textContent = k.q;
  acik = { c: k.o.map(() => 0), kalan: 30000 };
  salon.oylama.onUpdate(async (u) => {
    if (!acik) return;
    acik.c = u.counts; acik.kalan = u.remainingMs;
    document.getElementById('secenekler').textContent = k.o.map((x, i) => x + ': ' + u.counts[i]).join(' · ');
    if (u.remainingMs <= 0) {
      acik = null;
      const r = await salon.oylama.close();      // {counts, winner, votes:[{uid,o,atMs}], ...}
      document.getElementById('soru').textContent = 'Karar: ' + k.o[r.winner];
      pos++; salon.kayit.yaz({ pos });
    }
  });
  salon.oylama.open({ decKey: VoteCore.makeDecKey(pos), q: k.q, options: k.o, poll: false, durMs: 30000 }); // await etmeyin
}
addEventListener('keydown', (e) => {
  if (e.key === ' ') ileri();
  else if (acik && e.key >= '1' && e.key <= '4') salon.oylama.forceWin(+e.key - 1);
  else if (e.key === 'f' || e.key === 'F') salon.tamEkran();
});
// demo kipinde (?demo=1) seyirci yok: seçeneğe tıklama salon.demoOy(i) ile tek kişinin oyu olur
</script></body></html>
```

## 3. Salon API (ortak/salon.js)

Sayfaya sırayla: `oylama/vote-core.js`, `oylama/qr.js`, `oylama/qr-svg.js`, `oylama/firebase-config.js`, `ortak/salon.js`
ve `<link rel="stylesheet" href="ortak/salon.css">`. `oylama/firebase-source.js` canlı kipte `import()` ile yüklenir (`oylamaYolu`).

```js
const salon = Salon.baslat({
  oyunAdi: 'Kod Mahkemesi',        // durum yazılarında
  anahtar: 'kod-mahkemesi',        // localStorage öneki (salon.<anahtar>.oturum / .ilerleme); oturum belgesinde "oyun"
  oylamaYolu: 'oylama/',           // firebase-source.js'in sayfaya göre yeri
  oyAdresi: 'https://cenga-mezuniyet.pages.dev',   // telefonların açacağı /v/ sayfasının kökü
  sahteSeyirci: 28,                // ?sahte=1'de sanal seyirci sayısı
  kumanda: { ileri, geri, duraklat: evet => …, ses, oto, kazan: i => …, bitir },   // telefon kumandası komutları
  durum: () => ({ pos, toplam, faz, duraklat, oto, sessiz, kim, metin, karar: { q, o, c, kalan, acik } | null, sonraki }),
  sw: true, durumKutusu: true, tuslar: true,
});
const { kip, sid, oyUrl } = await salon.hazir;   // kip: 'canli' | 'sahte' | 'demo' | 'cevrimdisi'
```

| Ne | Açıklama |
|---|---|
| `salon.kip` | Adres parametresine göre: `?sahte=1` (ya da `?test=1`) → `sahte`, `?demo=1` → `demo`, yoksa canlı Firebase; bağlanamazsa `cevrimdisi`. Dört kipte de aynı arayüz: oyun kodu kipe göre dallanmak zorunda değil. |
| `salon.oylama.open({decKey, q, options, poll, durMs})` | Oylamayı açar (telefonlarda seçenekler belirir). `decKey`: `VoteCore.makeDecKey(i)`. `poll: true` → telefonda "Anket · sonucu değiştirmez". **await etmeyin.** |
| `salon.oylama.onUpdate(cb)` | `cb({counts, total, remainingMs, error})` ~250 ms'de bir ve her yeni oyda; `remainingMs <= 0` olunca `close()` çağırın. |
| `salon.oylama.close({sonucEk})` | Her durumda çözülür: `{counts, winner, forced, total, decKey, votes:[{uid,o,atMs}], openedAtMs, closesAtMs, durMs, pauses, error, errors}`. `sonucEk(sonuc)` → `{alan: değer}` sonuçla **aynı yazımda** oturum belgesine gider (çekirdek alanlar ezilemez). |
| `forceWin(i)`, `pause()`, `resume()` | Sunucu tuşları: `i` kazanır (süre 1,5 sn'ye iner); duraklatma telefonlarda da oyu durdurur. |
| `salon.oylama.updateSession(alanlar)` | Oyuna özgü oturum alanları (çekirdek alanlar yok sayılır); asla reddetmez. |
| `salon.oyUrl`, `salon.qrSvg(url?)` | Telefon oy adresi ve SVG QR (çevrimdışı/demo: `null` / boş). |
| `salon.demoOy(i)`, `salon.benimOyum()` | Demo kipinde tek oyuncunun (uid `sen`) oyu; üç sanal seyirci de rastgele oy verir. |
| `salon.kayit.oku()/yaz(v)/sil()` | 12 saatlik ilerleme kaydı (F5/çökme sonrası "kaldığın yerden"). |
| `salon.durumYaz(metin, sinif, gizleMs)`, `salon.odak(bool)` | Sol alttaki durum yazısı; odak: durum/rozet gizlenir. |
| `salon.kumandaTus(sifirla)`, `salon.kumandaDurum()` | U / Shift+U ile aynı (U'yu Salon kendisi dinler, `tuslar:false` kapatır); kumandaya giden normalleştirilmiş durum. |
| `salon.tamEkran()` | Tam ekran aç/kapa (F tuşuna oyun bağlar). |
| `Salon.sahneOlcekle(el, 1920, 1080)` | Sabit boyutlu sahneyi pencereye sığdırır. |

Kendiliğinden yapılanlar: oturum açma ve **F5/çökmede aynı oturumu sürdürme** (12 saat, `localStorage salon.<anahtar>.oturum`;
`?yeni=1` yeni oturum), çevrimdışı kipe düşme, durum yazısı, telefon kumandası eşleşmesi (U), Service Worker kaydı ve
"✓ Çevrimdışı oynamaya hazır" rozeti (`?sw=0` kapatır).

Telefon tarafı değişmez: seyirci QR'ı okutur, `/v/` sayfasında seçeneklere dokunur, sonucu görür. Firestore kuralları ve
`/v/` Mezuniyet.exe ile aynıdır; yeni oyun için kural yayımlamak gerekmez.

## 4. Test

| Adres | Ne olur |
|---|---|
| `<oyun>/?sahte=1` | Sanal seyirci (varsayılan 28) her oylamada rastgele oy verir; Firebase'e çıkılmaz. Prova için ideal. |
| `<oyun>/?demo=1` | Tek kişilik: seçeneğe tıkla (`salon.demoOy(i)`); üç sanal seyirci. Paylaşılabilir demo bağlantısı. |
| `<oyun>/?yeni=1` | Canlı ama yeni oturum (yeni QR). |
| `?sw=0` | Çevrimdışı önbelleği kapatır (sorun ayıklama). Derlenmemiş klasörde `manifest.json` yoktur, SW kendini kaldırır. |

Yerelde: depo kökünde `python3 -m http.server 8765` → `http://localhost:8765/kod-mahkemesi/?sahte=1`
(canlı oylama için `localhost` Firebase'in yetkili alan adlarında olmalı; sahte/demo her yerde çalışır).

Komutlar:
```bash
cd firebase && npm ci && npm test          # birim + kurallar (emülatör, Java gerekir) + entegrasyon
node site/build.mjs                         # derleme + kopya denetimi → dist/
node --test 'site/test/*.test.mjs'          # derleme testleri
node site/test/e2e-offline.mjs              # çevrimdışı önbellek uçtan uca (Playwright)
```
İsterseniz `site/test/e2e-offline.mjs`'i örnek alıp yeni oyun için Playwright ile `?sahte=1` akışını sınayan bir test ekleyin.

## 5. Yayın

Cloudflare Pages GitHub'a bağlı: **push → `node site/build.mjs` → `dist/`** (çıktı klasörü `dist`, `NODE_VERSION=22`).
Oyun `OYUNLAR`'daysa `https://cenga-mezuniyet.pages.dev/<klasor>/` adresinde yayına girer; kendi `manifest.json`'ı ve
`_headers` satırları (sw.js ve manifest her zaman ağdan) otomatik üretilir.

Etkinlik günü: bir gün önce sunum dizüstünde oyunu açıp sağ altta **"✓ Çevrimdışı oynamaya hazır"** görün; projektörü açmadan
**U** ile kumandayı kendi telefonunuzla eşleyin; sol altta **"● Canlı oylama hazır"** yazmalı; 2–3 telefonla ilk oylamayı deneyin.

## 6. Mezuniyet.exe neden Salon'u kullanmıyor?

`oyun/index.html` aynı altyapının ilk, gömülü sürümünü taşır ve etkinlikte denenmiştir. Oylama bağlantısı hikâye motoruyla iç içe
(`startDecision` içinde bağlantı bekleme, demo kipi, `qrHazir`, kumanda durumu sahne adımlarından üretiliyor); Salon'a taşımak
davranışı değiştirme riski taşırken yeni bir şey kazandırmıyordu. Bu yüzden Salon **temiz bir çıkarım** olarak yeni oyunlarda kullanılır;
Mezuniyet.exe'de yalnız ortak kopyalar güncellendi (`oyun/sw.js` = `ortak/sw.js`: önbellek temizliği artık kapsamla sınırlı;
`oyun/oylama/firebase-source.js`: yalnız eklemeler). `index.html?test=1` → `hata:0, eksikSes:0`.

## 7. Gelecek oyun fikirleri (API'ye nasıl oturur)

- **Kod Mahkemesi** — Ekranda kısa bir kod parçası ve "sanık" (ör. `== null` karşılaştırması). Salon "suçlu / suçsuz / şartlı tahliye"
  oylar; ardından savunma (bir gönüllü konuşur) ve ikinci oylama: fikir değiştirenler sayılır. *Eşleme:* her tur iki `open()`
  (`poll: true`), `close().votes` ile aynı uid'nin iki oyu karşılaştırılır → "salonun %23'ü ikna oldu". Ek: kod bloğu için ekran parçası. Yeni altyapı gerekmez.
- **Sprint Simülatörü** — Salon bir yazılım ekibi; her "gün" bir olay kartı (prod çöktü, müşteri yeni özellik istedi…) ve 3–4 seçenek.
  Seçimler gizli değerleri (hız, teknik borç, moral) değiştirir; 10 gün sonra "sürüm çıktı mı?". *Eşleme:* Mezuniyet.exe'nin karar ağacı
  gibi ama durum tabanlı: `close().winner` → durum güncelle → sonraki kart. `durum()` kumandaya gizli değerleri de gösterebilir. Yeni altyapı gerekmez.
- **Tahmin Oyunu (sayısal kaydırıcı)** — "Bu bölümde kaç kişi Vim kullanıyor?" Telefonda kaydırıcı, salonun ortalaması ve dağılımı ekranda.
  *Gerekenler:* oy belgesinde `o` bugün 0–3 seçenek; yeni bir oylama türü (`sessions.tip: 'sayi'`, `min/max`) ve kuralda
  `d.o is int && d.o >= session().min && d.o <= session().max`, `/v/` sayfasında kaydırıcı görünümü, host'ta `close().votes`'tan
  dağılım. Diğer her şey (oturum, QR, kumanda, çevrimdışı) hazır.
- **Hikâye oyunları** — Mezuniyet.exe gibi dallanan bir hikâye (staj macerası, hackathon gecesi): sahneler + kararlar; her kararda
  `open()` / `close().winner` ile dal seçilir, `salon.kayit` kaldığı yerden devam ettirir.
