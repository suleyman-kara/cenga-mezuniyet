# Yeni etkinlik, yeni oyun — Salon altyapısıyla

Mezuniyet.exe için kurulan altyapı (salonun telefonla oy verdiği, projektörde akan oyun) artık başka oyunlarda da kullanılabilir.
Hazır örnek: **Salon Yarışması** (`yarisma/`) — canlı bilgi yarışması: lobi + QR, soru, geri sayım, canlı çubuklar,
doğru cevap, sıralama, final podyumu. Yayında: `https://cenga-mezuniyet.pages.dev/yarisma/`.

```
ortak/                  ASIL dosyalar (hikâyeden bağımsız)
  salon.js  salon.css   Salon çalışma zamanı: oylama bağlantısı, oturum, QR, durum yazısı, kumanda, çevrimdışı önbellek
  puan.js               yarışma puanı (hızlı doğru = çok puan), sıralama, soru dosyası denetimi
  sw.js                 çevrimdışı önbellek (her oyun klasörü kendi kapsamında)
firebase/               Firestore kuralları, telefon oy sayfası /v/, kumanda sayfası /k/, oylama kaynağı (src/), testler
yarisma/                örnek oyun (ŞABLON): index.html + sorular.js + kopyalar (oylama/, ortak/, sw.js)
oyun/                   Mezuniyet.exe (Salon'u kullanmaz, aşağıya bakın)
site/build.mjs          Cloudflare Pages derlemesi → dist/ (her oyun + manifest + _headers)
```

Oyun klasörleri **derlemesiz** çalışır ve kendi kopyalarını taşır (`yarisma/oylama/`, `yarisma/ortak/`, `yarisma/sw.js`):
klasör tek başına sunulabilir, Service Worker kapsamı klasörle sınırlıdır. Kopyalar asıllarıyla **bayt bayt aynı** olmalı;
`node site/build.mjs` farklıysa durur ve hangi dosyayı nereye kopyalayacağınızı yazar.

---

## 1. Sadece soruları değiştirmek (en sık durum)

1. `yarisma/sorular.js` dosyasını açın. Her soru:
   ```js
   { soru: 'İkili sistemde 1010 kaçtır?', secenekler: ['8', '10', '12', '1010'], dogru: 1, sure: 15, aciklama: '...', etiket: 'Isınma' }
   ```
   - `dogru` **0'dan başlar** (0 = ilk seçenek). Yazmazsanız soru **anket** olur (puan yok, "salon böyle düşünüyor").
   - 2–4 seçenek; soru en çok 140, seçenek en çok 60 karakter (arka sıradan okunsun diye). `sure` 5–120 sn.
   - Başlık, alt başlık ve `ayarlar` (varsayılan süre, sıralama ekranı, canlı çubuklar, puan tabanı/tavanı) aynı dosyada.
2. Denetleyin: `node --test site/test/puan.test.mjs` (dosya hatalıysa sayfa da projektörde hatayı soru numarasıyla gösterir).
3. Deneyin: `yarisma/index.html?sahte=1&sure=6` (aşağıda "Test").
4. Push → Cloudflare Pages derler (aşağıda "Yayın").

## 2. Yeni bir oyun yapmak (şablondan)

```bash
cp -r yarisma tahmin            # yeni klasör; goruntuler/ silinebilir
```
1. `tahmin/index.html` içinde oyun mantığını değiştirin. Salon'u başlatan blok aynı kalabilir; `anahtar: 'tahmin'` yapın
   (localStorage ve oturum belgesindeki `oyun` alanı bununla ayrışır).
2. `site/build.mjs`:
   - `OYUNLAR` listesine bir satır: `{ klasor: 'tahmin', dahil: ['index.html', 'sorular.js', 'sw.js', 'oylama/', 'ortak/'] }`
     (`'klasör/'` bütün ağaç, `'ses/*.wav'` bir klasördeki uzantılılar; listede olmayan hiçbir şey yayımlanmaz).
   - `SENKRON_CIFTLERI` listesine `tahmin/…` kopyalarını ekleyin (yarisma satırlarını kopyalayıp adı değiştirin).
3. `node site/build.mjs && node --test 'site/test/*.test.mjs'`.
4. İsterseniz `site/test/e2e-yarisma.mjs`'i kopyalayıp yeni oyuna uyarlayın.

Ortak dosyayı değiştirdiyseniz (ör. `ortak/salon.js`) kopyalarını güncelleyin:
```bash
cp ortak/salon.js ortak/salon.css ortak/puan.js yarisma/ortak/ && cp ortak/sw.js oyun/sw.js && cp ortak/sw.js yarisma/sw.js
cp firebase/src/firebase-source.js oyun/oylama/ && cp firebase/src/firebase-source.js yarisma/oylama/
```

## 3. Salon API (ortak/salon.js)

Sayfaya sırayla: `oylama/vote-core.js`, `oylama/qr.js`, `oylama/qr-svg.js`, `oylama/firebase-config.js`, `ortak/puan.js` (isteğe bağlı),
`ortak/salon.js` ve `<link rel="stylesheet" href="ortak/salon.css">`.

```js
const salon = Salon.baslat({
  oyunAdi: 'Tahmin Gecesi', anahtar: 'tahmin', takmaAd: true,     // takmaAd: telefon takma ad sorar, oyuncu listesi gelir
  sahteOyuncu: 28,                                                 // ?sahte=1'de sanal seyirci
  kumanda: { ileri, geri, duraklat: evet => …, ses, oto, kazan: i => …, bitir },   // telefon kumandası komutları
  durum: () => ({ pos, toplam, faz, duraklat, oto, sessiz, kim, metin, karar: { q, o, c, kalan, acik } | null, sonraki }),
});
const { kip, sid, oyUrl } = await salon.hazir;   // kip: 'canli' | 'sahte' | 'demo' | 'cevrimdisi'
```

| Ne | Açıklama |
|---|---|
| `salon.kip` | Adres parametresine göre: `?sahte=1` → `sahte`, `?demo=1` → `demo`, yoksa canlı Firebase; bağlanamazsa `cevrimdisi`. Oyun kodu kipe göre dallanmak zorunda değil: dört kipte de aynı arayüz. |
| `salon.oylama.open({decKey, q, options, poll, durMs, ipucu})` | Oylamayı açar (telefonlarda soru belirir). `decKey`: `VoteCore.makeDecKey(i)`. `ipucu`: doğru cevap — **yalnız sahte seyirci için**, Firestore'a yazılmaz. |
| `salon.oylama.onUpdate(cb)` | `cb({counts, total, remainingMs, error})` ~250 ms'de bir; `remainingMs <= 0` olunca `close()` çağırın. |
| `salon.oylama.close({sonucEk})` | Her durumda çözülür: `{counts, winner, forced, total, votes:[{uid,o,atMs}], openedAtMs, closesAtMs, durMs, pauses}`. `sonucEk(sonuc)` → `{alan: değer}` sonuçla **aynı yazımda** oturuma gider (telefonlar görür; çekirdek alanlar ezilemez). |
| `forceWin(i)`, `pause()`, `resume()` | 1–4 tuşları (süre 1,5 sn'ye iner), P duraklatma (telefonlarda da durur). |
| `salon.oyuncular`, `salon.onOyuncular(cb)` | `[{uid, ad}]` — katılan telefonlar (takmaAd oturumunda). |
| `salon.oylama.updateSession(alanlar)` | Oyuna özgü oturum alanları (çekirdek alanlar yok sayılır). |
| `salon.oyUrl`, `salon.qrSvg(url?)` | Telefon oy adresi ve SVG QR (çevrimdışı/demo: `null` / boş). |
| `salon.demoOy(i)`, `salon.benimOyum()` | Demo kipinde tek oyuncunun (uid `sen`) oyu. |
| `salon.kayit.oku()/yaz(v)/sil()` | 12 saatlik ilerleme kaydı (F5/çökme sonrası "kaldığın yerden"). |
| `salon.durumYaz(metin, sinif, gizleMs)`, `salon.odak(bool)` | Sol alttaki durum yazısı; odak: durum/rozet gizlenir. |
| `salon.kumandaTus(sifirla)`, `salon.tamEkran()` | U / Shift+U ve F ile aynı. U'yu Salon kendisi dinler (`tuslar:false` ile kapatılır). |
| `Salon.sahneOlcekle(el, 1920, 1080)` | Sabit boyutlu sahneyi pencereye sığdırır. |
| `SalonPuan.turPuani(sonuc, dogru, {taban, tavan})` | Kahoot benzeri: doğruya 500–1000, hızlı olan çok (duraklatılan süre sayılmaz). `topla`, `siralama` (eşit puan aynı sıra), `gorunenAd`, `sorulariDenetle`. |

Kendiliğinden yapılanlar: oturum açma ve **F5/çökmede aynı oturumu sürdürme** (12 saat, `localStorage salon.<anahtar>.oturum`;
`?yeni=1` yeni oturum), çevrimdışı kipe düşme, durum yazısı, telefon kumandası eşleşmesi (U), Service Worker kaydı ve
"✓ Çevrimdışı oynamaya hazır" rozeti (`?sw=0` kapatır).

### Veri modeli eklemeleri (firebase/)
- Oturum belgesi: `createSession({takmaAd: true, oyun: 'yarisma'})` ek alanları. Yarışma cevapta `{dogru, sonucIcin: decKey, puan: {uid: toplam}}` yazar.
- `sessions/{sid}/players/{uid} = {ad, at}`: ad ≤ 20 karakter, yalnız sahibi yazar, yalnız host listeler, silinemez,
  **yalnız `takmaAd: true` oturumda** (Mezuniyet.exe oturumlarında yazılamaz). Puanı telefon değil host hesaplar (oy belgelerinin `at` zamanından).
- Telefon sayfası `/v/` ancak oturumda `takmaAd: true` varsa takma ad kutusunu ve "✓ Doğru! · Toplam 1800 puan · 2. sıra" sonucunu gösterir.

## 4. Test

| Adres | Ne olur |
|---|---|
| `yarisma/?sahte=1` | Sanal seyirci (28 kişi) lobiye yavaş yavaş katılır, cevap verir; Firebase'e çıkılmaz. Prova için ideal. |
| `yarisma/?sahte=1&sure=6` | Bütün sorular 6 sn (hızlı prova). |
| `yarisma/?demo=1` | Tek kişilik: seçeneğe tıkla ya da 1–4; üç sanal rakip. Paylaşılabilir demo bağlantısı. |
| `yarisma/?yeni=1` | Canlı ama yeni oturum (yeni QR); kayıtlı ilerleme silinir. |
| `?sw=0` | Çevrimdışı önbelleği kapatır (sorun ayıklama). |

Yerelde: depo kökünde `npx serve -l 8765` → `http://localhost:8765/yarisma/?sahte=1`
(canlı oylama için `localhost` Firebase'in yetkili alan adlarında olmalı; sahte/demo her yerde çalışır).

Komutlar:
```bash
cd firebase && npm ci && npm test          # birim + kurallar (emülatör, Java gerekir) + entegrasyon
node --test 'site/test/*.test.mjs'          # derleme, senkron, puan, sorular.js
node site/test/e2e-offline.mjs              # çevrimdışı önbellek (iki oyun aynı alan adında)
node site/test/e2e-yarisma.mjs --goruntu    # yarışma: sahte lobi→podyum, demo, çevrimdışı; ekran görüntüleri yarisma/goruntuler/
```

## 5. Yayın

Cloudflare Pages GitHub'a bağlı: **push → `node site/build.mjs` → `dist/`** (çıktı klasörü `dist`, `NODE_VERSION=22`).
Yeni oyun `OYUNLAR`'daysa `https://cenga-mezuniyet.pages.dev/<klasor>/` adresinde yayına girer.

> **Firestore kuralları değişti (players):** `firebase/firestore.rules` yayımlanmalı — konsolda Firestore > Rules'a yapıştırın ya da
> `cd firebase && npx firebase deploy --only firestore:rules`. Eski kurallarla yarışma çalışır ama takma ad yazılamaz
> (katılımcı sayısı 0 görünür, sıralamada "Oyuncu XXXX" adları). Mezuniyet.exe etkilenmez.

## 6. Sunucu kontrol listesi (etkinlik günü)

- [ ] Bir gün önce sunum dizüstünde `…/yarisma/` aç, sağ altta **"✓ Çevrimdışı oynamaya hazır"** gör (aynı tarayıcı/profil, gizli pencere değil).
- [ ] Kuralların yayımlandığını kontrol et: bir telefonla okut, takma ad yaz → lobide adın çıkıyor mu?
- [ ] Etkinlikten önce bir kez `?yeni=1` ile aç (provadaki oturum/puanlar silinir), sonra normal adresle.
- [ ] Sol altta **"● Canlı oylama hazır"**; "Çevrimdışı" yazıyorsa Wi-Fi'ı kontrol et, F5.
- [ ] Projektörü salona açmadan **U** → kumandayı kendi telefonunla okut ("✓ Kumanda bağlandı").
- [ ] **F** tam ekran. Lobide QR'ı göster, katılımcı sayısı yükselsin; **Boşluk** ile başla.
- [ ] Salon Wi-Fi'ında telefonlar `pages.dev`'e girebiliyor mu? 2–3 telefonla ilk soruyu dene.
- [ ] Sayfa kapanır/çökerse: aynı adresi aç → aynı QR sürer; lobide "Kayıtlı yarışma… Enter: kaldığın yerden".

Tuşlar: **Boşluk/→/Enter** ileri (soru açıkken: hemen bitir) · **←** sıralamadan geri · **P** duraklat · **1–4** seçeneği zorla
(süre 1,5 sn'ye iner; puanlı soruda doğru cevap değişmez) · **O** otomatik akış · **M** ses · **F** tam ekran ·
**U / Shift+U** kumanda / sıfırla · **R R** (2 sn içinde iki kez) yarışmayı sıfırla. Projektörde tıklama yalnız lobide başlatır.

## 7. Mezuniyet.exe neden Salon'u kullanmıyor?

`oyun/index.html` aynı altyapının ilk, gömülü sürümünü taşır ve etkinlikte denenmiştir. Oylama bağlantısı hikâye motoruyla iç içe
(`startDecision` içinde bağlantı bekleme, demo kipi, `qrHazir`, kumanda durumu sahne adımlarından üretiliyor); Salon'a taşımak
davranışı değiştirme riski taşırken yeni bir şey kazandırmıyordu. Bu yüzden Salon **temiz bir çıkarım** olarak yeni oyunlarda kullanılır;
Mezuniyet.exe'de yalnız ortak kopyalar güncellendi (`oyun/sw.js` = `ortak/sw.js`: önbellek temizliği artık kapsamla sınırlı;
`oyun/oylama/firebase-source.js`: yalnız eklemeler). `index.html?test=1` → `hata:0, eksikSes:0`.

## 8. Gelecek oyun fikirleri (API'ye nasıl oturur)

- **Kod Mahkemesi** — Ekranda kısa bir kod parçası ve "sanık" (ör. `== null` karşılaştırması). Salon "suçlu / suçsuz / şartlı tahliye"
  oylar; ardından savunma (bir gönüllü konuşur) ve ikinci oylama: fikir değiştirenler sayılır. *Eşleme:* her tur iki `open()`
  (`poll: true`), `close().votes` ile aynı uid'nin iki oyu karşılaştırılır → "salonun %23'ü ikna oldu". Ek: kod bloğu için ekran parçası. Yeni altyapı gerekmez.
- **Sprint Simülatörü** — Salon bir yazılım ekibi; her "gün" bir olay kartı (prod çöktü, müşteri yeni özellik istedi…) ve 3–4 seçenek.
  Seçimler gizli değerleri (hız, teknik borç, moral) değiştirir; 10 gün sonra "sürüm çıktı mı?". *Eşleme:* Mezuniyet.exe'nin karar ağacı
  gibi ama durum tabanlı: `close().winner` → durum güncelle → sonraki kart. `durum()` kumandaya gizli değerleri de gösterebilir. Yeni altyapı gerekmez.
- **Tahmin Oyunu (sayısal kaydırıcı)** — "Bu bölümde kaç kişi Vim kullanıyor?" Telefonda kaydırıcı, en yakın tahmin kazanır.
  *Gerekenler:* oy belgesinde `o` bugün 0–3 seçenek; yeni bir oylama türü (`sessions.tip: 'sayi'`, `min/max`) ve kuralda
  `d.o is int && d.o >= session().min && d.o <= session().max`, `/v/` sayfasında kaydırıcı görünümü, host'ta `close().votes`'tan
  yakınlık puanı (`SalonPuan`'a `yakinlikPuani`). Diğer her şey (oturum, QR, kumanda, sıralama, podyum) hazır.
- **Bug Avı** — Ekranda 4 satırlık kod, "hata hangi satırda?". Yarışmanın kendisi: `sorular.js`'de seçenekler satır numaraları,
  `aciklama` doğru düzeltme. Hiç kod yazmadan bugün yapılabilir (soru metnine kısa kod yazın; uzun kod için `index.html`'e kod kutusu ekleyin).
