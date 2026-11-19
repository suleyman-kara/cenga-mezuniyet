# Sahne Sözleşmesi — Mezuniyet.exe Yanıt Vermiyor

Motor: `oyun/index.html`. Hikâye, `/* ---------- HİKÂYE` ile `/* ---------- SES` arasındadır ve **saf** olmalıdır (DOM yok, `window` yok; Node'da `replik_cikar.js` / `metin_kontrol.js` çalıştırır).
Replik yazarı yalnızca `function build(c){...}` gövdesini yazar. HİKÂYE bölümünün başındaki sabitler ve `yeni(c)` yardımcıları **değiştirilmez** (yeni sabit/yardımcı eklemek serbest).

Ekran 1920×1080. x koordinatları piksel (karakterin orta noktası). Diyalog kutusu altta (y > ~810), HUD sağ üstte, belgesel şeridi sol üstte. Paneller orta bölgede (y 120–780) durur; panel varken karakterleri kenarlara koyun (x ≤ 380 ya da x ≥ 1540).

---

## 1. Sabitler (HİKÂYE bölümünde hazır)

```js
const A='ANLATICI',D='DENİZ',O='OZAN',B='BUSE',T='TOLGA',S='ASUMAN';
const VOICE={[A]:'anlatici',[D]:'deniz',[O]:'ozan',[B]:'buse',[T]:'tolga',[S]:'asuman'};
const NDEC=6, NEND=5;            // gerçek karar sayısı (nabızlar hariç), son sayısı
hid(text), decVid(d), endVid(card) // seslendirme kimlikleri — tabandakiyle aynı
```

## 2. build(c) iskeleti

`c` = salonun seçimleri dizisi: `c[id]` → kazanan seçenek indeksi (0,1,2,3). **Kararlar ve nabızlar aynı diziyi paylaşır**, id'ler görünme sırasına göre 0'dan artar:
K1=0, K2=1, K3=2, K4=3, NABIZ1=4, K5=5, K6=6, NABIZ2=7.

```js
function build(c){
 const H=yeni(c), {s,b,D,N,M,perde,art,sifir,son,final}=H;
 s.push({k:'card',type:'title'});          // "Mezuniyet.exe yanıt vermiyor" penceresi
 M('M0',[ ...kareler... ]);                 // montaj
 perde(1,'3. SINIF','Staj zorunludur. Ücret: —','yonetmelik');
 b({who:A, bg:'yokus', yer:'Balcalı Yerleşkesi · 41°C', c:[['deniz',700,'look','inL']], text:'...'});
 ...
 const k1=D('Deniz stajını nerede yapıyor?',[['Tanıdık torpili','...'],['Ücretsiz startup','...'],['Kendi projen','...']]);
 if(k1===undefined) return s;              // ZORUNLU: cevapsız karar/nabızdan sonra hemen dön
 if(k1===0){ art(0,2,0); b({...ilk dal repliği: HUD burada "+2" uçurur...}); ... }
 ...
 const n1=N('İlanda "Maaş: Rekabetçi" yazıyor. Sence rakam ne?',[[..],[..],[..]]);
 if(n1===undefined) return s;              // nabız da aynı kural
 ...
 son(1,'Referans Kapısı','Bu ülkede en hızlı iş ilanı bir insandır. ...');   // son kartı (anlatıcı okur)
 final();                                   // "Mezuniyet.exe yanıt veriyor."
 return s;
}
```

Kurallar:
- `D(q,o)` gerçek karar ekler (`{k:'dec',id,no,d:{q,o}}`), `N(q,o)` nabız ekler (`{k:'dec',id,nabiz:1,d:{q,o}}`). İkisi de `c[id]`'yi döndürür. **undefined ise `return s;`** — motor ve `replik_cikar.js` buna dayanır (nabızlar da dallanır, bütün göndermeli replikler çıkarılır).
- Seçenek sayısı 2–4. `o=[[başlık,açıklama],...]`. Seçenek açıklaması ekranda görünür; karar sorusu + başlıkları anlatıcı okur (açıklamaları okumaz).
- Nabız sonucu hikâyeyi yalnızca **tek replikte** değiştirir (Tolga'nın teklif mektubu, Asuman'ın finali). Sayaçlara dokunmaz. Ekranda "SONUCU DEĞİŞTİRMEZ · SALONUN NABZI" yazar.
- `base` `poll:1` alanı hâlâ desteklenir (oylanır, c'ye yazılmaz) ama bu oyunda kullanmayın.

## 3. Replik (beat) alanları — `b({...})`

| alan | anlam |
|---|---|
| `who` | `A D O B T S`. Anlatıcı görünmez: köşede ● REC + belgesel şeridi. |
| `text` | Replik (90–170 karakter). `'...'` = seslendirmesiz (okunma süresi kadar bekler). |
| `bg` | Mekân kimliği (aşağıda). Önceki beat'ten **devralınır**, değişince geçiş perdesi. |
| `v` | Mekân varyantı: `'gece'`, `'aksam'`, `'pizza'`, `'asistan'`, `'lobi'` ... (aşağıda). Devralınır. |
| `yer` | Belgesel şeridi metni: `'Balcalı Yerleşkesi · 41°C'`. Verilmezse şerit kapanır. Anlatıcı sahnelerinde kullanın; diğerlerinde de olabilir. |
| `c` | Kadro: `[[karakter, x, 'poz' ya da 'poz:ifade', giriş]]`. giriş: `'inL'` soldan yürür, `'inR'` sağdan, boş = yerinde belirir. Listede olmayan karakter yürüyüp çıkar. Mekân değişince kadro sıfırlanır. |
| `cue` | Sahne içi işaretler: `[[oran(0–1, metnin neresinde), karakter\|'fx', poz\|'@x'(yürü)\|fx, enErkenMs]]`. Örn. `[.4,'deniz','facepalm']`, `[.6,'buse','@1300']`, `[.8,'fx','confetti']`, `[.3,'fx','p:dus']` (panel eylemi). |
| `panel` | `{type, id, ...}` (aşağıda). **Aynı type+id** sonraki beat'te verilirse panel yerinde kalır (yeniden açılmaz), alanları güncellenir. |
| `fx` | Beat başında efekt(ler): string ya da dizi. |
| `sakal` | `1` → Deniz sakallı (4. perde). Devralınır. |
| `hudp` | HUD profili zorla: `'deniz'\|'ozan'\|'buse'\|'tolga'\|'asuman'\|0`. Varsayılan: konuşan Asuman ise asuman profili (— — —, "Soyadı ✓"); Ozan/Buse/Tolga konuşurken kendi profili; diğer her durumda Deniz. `0` = her zaman Deniz. |
| `muzik` | Müzik zorla (aşağıda). Verilmezse perde + mekândan seçilir. |
| `hud,d0,perde` | `yeni(c)` doldurur (`hud:[g,ç,y]`); elle yazmayın. (Dikkat: `c` alanı kadrodur, çevre değil.) |

Yardımcılar (`yeni(c)` içinden):
- `art(g,c,y)` → sayaçlara ekler; **bir sonraki** beat'te HUD artışı uçar ("+2"). Dal sahnesinin ilk repliğinden hemen önce çağırın.
- `sifir()` → bir sonraki beat'te "+0" uçar, sayaçlar kıpırdamaz (500 Kolay Başvuru).
- `H.st` → `{g,c,y,durum}` anlık durum (son koşulları için). `H.st.durum=1` dürüm bayrağı.
- `perde(n, baslik, alt, altStil)` → perde açılış kartı. `altStil`: `'yonetmelik'` (resmî yazı), `'jira'` (alt = `'BITIRME-1 · Mezun ol · Öncelik: Yüksek · Atanan: Sen · Son tarih: Dün'`, " · " ile bölünür), `'ilan'` (ilan fontu), `'bayram'` (düz, sıcak).
- `son(n, baslik, ders)` → son kartı (n=1..5). Anlatıcı "başlık. ders" okur.
- `final(baslik?, alt?)` → final kartı. Varsayılan: "Mezuniyet.exe yanıt veriyor." / "Şu an elli kişilik bir salondasın. Yanındakine adını söyle."
- `M(id, kareler)` → montaj (aşağıda).

## 4. Mekânlar (`bg`)

| id | ne | varyant (`v`) |
|---|---|---|
| `yokus` | Balcalı yokuşu, güneş, hurma ağacı, sıcak hava dalgası | `aksam` |
| `koridor` | Bölüm koridoru, panolar, kapılar | `asistan` (S5: asistan masası, staj defteri tutan 3. sınıflar) |
| `cayocagi` | Çay ocağı (semaver, bardaklar, Sevgi Abla'nın tezgâhı) | — |
| `holding` | Yıldızlar Holding cam ofis; kapı üstünde YILDIZLAR HOLDING; fotokopi makinesi + koridor sonunda cam oda | `lobi` (devasa tabela, finale) |
| `startup` | Loft ofis, armut koltuklar, tuğla duvar, neon "disrupt" | — |
| `oda` | Deniz'in odası: vantilatör, masa, laptop, poster | `gece` (karanlık, ekran ışığı, ay) |
| `soylesi` | Söyleşi salonu (CENGA afişine benzeyen perde, sandalyeler) | `pizza` (pizza masası + kuyruk) |
| `kahve` | Salon dışı koridorda kahve makinesi | — |
| `lab` | Bitirme laboratuvarı | — |
| `kariyer` | Kariyer günü stantları; Yıldızlar Holding roll-up'ı | — |
| `hackathon` | Gece hackathon salonu, 04.00, enerji içeceği kutuları, jüri masası | — |
| `mezuniyet` | Açık hava tören, kürsü pankartı "Tören sponsoru: YILDIZLAR HOLDING", uçan kepler | — |
| `mulakat` | Online mülakat ekranı (görüntülü arama ızgarası) | — |
| `kafe` | Adana'da kafe, "Yazılımcılar Buluşması" | — |
| `bayram` | Bayram sofrası, kalabalık aile siluetleri | — |
| `ofis` | Kuzey Yazılım cam toplantı odası (S1) | — |
| `bank` | Kampüs bankı, akşam (S4) | — |

Yıldızlar Holding tabelası `holding`, `kariyer`, `mezuniyet`'te zaten var; Asuman başka bir mekânda konuşursa motor köşeye küçük bir YILDIZLAR HOLDING kurdelesi/rozeti ekler.

## 5. Karakterler ve pozlar

Kimlikler: `deniz`, `ozan`, `buse`, `tolga`, `asuman` (konuşan `who` otomatik eşlenir; ağız konuşurken oynar).
Yerleşim önerisi: tek kişi 960; iki kişi 620/1300; panel varken 260 ve 1660; üç kişi 420/960/1500.

Pozlar: `look` `wave` `point` `shrug` `facepalm` `think` `cheer` `clap` `shock` `sad` `worry` `panic` `phone` `laptop` (laptopta yazar) `type` `present` (eliyle gösterir) `smug` `calm` `heart` `bow` `brow` (kaş kaldırır) `sip` (elindekinden içer/yer: Deniz su şişesi, Buse kahve, Tolga simit, Asuman çay fincanı) `write` `wag` `weigh` `alarm` `sit` (oturur) `tired` (uykulu) `selfie` (Asuman/Buse fotoğraf çektirir).
İfadeler (`'poz:ifade'`): `happy` `sad` `shock` `skeptic` `smug` `stern` `worried` `tired`. Verilmezse pozdan seçilir.

## 6. Paneller (`panel:{type,id,...}`)

Ortak alanlar: `x,y` (sol üst, piksel; verilmezse varsayılan yer), `rot` (derece). Metinler kısa olsun; büyük puntoyla çizilir.

| type | alanlar | eylemler (`'p:...'`) |
|---|---|---|
| `hava` | `yer, t, his, durum` | — |
| `github` | `kul, isim, takipci, bio, avatar:'gri'\|'deniz'`, `yogun` (0–1 katkı yoğunluğu), `commit` (bugünkü sayı) | `p:yesil` grafiği doldurur |
| `repo` | `ad, yildiz, fork, readme` | `p:dus` yıldız 1→0 |
| `yaka` | `kartlar:[[ad, unvan, kurum],...]` (1–3 yaka kartı) | — |
| `klasor` | `baslik, satirlar:[[ad, boyut],...], vurgu` (vurgulanacak satır indeksi), `catlak:1` (çatlak ekran) | `p:sec:i` |
| `linkedin` | `ad, baslik, alt, foto:'asuman'\|'gri'\|'cuppe'\|'deniz'\|'durum'\|'buse'\|'ozan'`, `baglanti, gor:[eski,yeni]` (görüntülenme sayacı), `yesil:1` (#OpenToWork), `eski:{foto,baslik}` (öncesi/sonrası) | `p:say` sayacı oynat |
| `lbildirim` | `ad, foto, metin, zaman` | — |
| `lgonderi` | `ad, foto, unvan, metin, begeni, yorumlar:[[ad,metin],...]` | `p:yorum` sıradaki yorumu düşür |
| `akis` | `gonderiler:[{ad,foto,unvan,metin,begeni,yesil,flas}]`, `sure` (ms) — kayan, hızlanan LinkedIn akışı (montaj içinde) | — |
| `ilan` | `sirket, baslik, satirlar:[...], maas, rollup:1` (stant roll-up görünümü), `yayin` ("3 saat önce") | `p:maas` maaş satırını vurgula |
| `mail` | `kimden, konu, satirlar:[...]` (`'~'` ile başlayan satır bulanık çizilir), `etiket` | `p:ac` |
| `mailkutu` | `mailler:[[kimden, konu, özet],...]`, `yagmur:1` (yağmur gibi düşer) | — |
| `jira` | `sprint, atanan, gorev, kolonlar` (pano) | `p:ekle` görev kartı ekler |
| `jirakart` | `kod, baslik, oncelik, atanan, son` | — |
| `leetcode` | `gun, cozulen, zorluk, durum, alev:1` | — |
| `fotokopi` | `sayi` (sayaç yukarı akar) | — |
| `kartvizit` | `ad, unvan, sirket, yagli:1` | — |
| `insta` | `ad, metin, sahne:'soylesi'` | — |
| `defter` | `baslik, satirlar:[...], imza, not` (kenar notu, el yazısı) | `p:not` |
| `afis` | `baslik, satirlar:[...], alt` (CENGA afişine benzer) | — |
| `tablo` | `dosya, sutunlar:[...], satirlar:[[...]], toplam` (Excel) | `p:kay` satırlar kayar |
| `arama` | `ad, alt` (gelen arama ekranı) | — |
| `dosya` | `ad, alt, ikon:'pptx'\|'jpg'\|'pdf'\|'xlsx'`, `yukle:1` (yükleme çubuğu) | — |
| `fis` | `baslik, satirlar:[[kalem, tutar],...], toplam` (hesap fişi / maaş bildirimi) | — |
| `whatsapp` | `grup, uye, mesajlar:[[ad, metin],...], yaziyor:'Deniz'` (mesajlar tek tek düşer) | — |
| `davet` | `baslik, saat, alt` (takvim daveti) + köşede yükselen döviz grafiği (`doviz:1`) | — |
| `takvim` | `sayfalar:['2027','2029','2033']` (sayfalar uçar) | — |
| `caps` | `ust, alt, begeni, yorum` (dürümlü fotoğraf caps'i) | — |
| `dm` | `kimden, metin` | — |
| `kayit` | `baslik, alt, zarf:'Askerlik Şubesi'` | — |
| `etkinlik` | `baslik, yer, tarih, katilimci` (buluşma sayfası) | — |
| `cv3` | `gonderen:[...]` (İK ekranında aynı CV'nin 3 kopyası) | — |
| `balonlar` | `metinler:[...]` (sofranın üstünde art arda patlayan konuşma balonları) | — |
| `dürüm` | (tip adı `durum`) `gor:[3,31], not` dürümlü profil fotoğrafı (44°C termometre) | — |
| `kod` | `satirlar:[...], tur:'ok'\|'hata'` (terminal: Hello, World! / Segmentation fault) | — |
| `mulakat` | `kisi` (0–7 farklı görüntülü kutu), `soru, kopuk:1` ("Bağlantı koptu"), `saat` | — |
| `kolay` | `hedef:500, mailler:[...]` — 0→500 sayacı + Kolay Başvuru düğmesi + düşen ret mailleri (montaj içinde) | — |
| `epilog` | `kim:'ozan'\|'buse'\|'tolga'\|'asuman', metin` (karakter görseli + tek satır) | — |
| `pencere` | `baslik, metin` ("yanıt vermiyor" penceresi; M0'da) | `p:bekle` imleç Bekle'ye tıklar |

## 7. Efektler (`fx` ve cue `'fx'`)

`shake`, `confetti`, `flash`, `big:METİN` (dev yazı), `bubble:METİN:x:y` (konuşma balonu), `stamp:METİN:renk`, `sweat` (sıcak dalgası), `kep` (uçan kepler), `plus0` ("+0" uçar), `ding` (bildirim sesi), `click`, `whoosh`, `thud`, `zoom` (kamera yaklaşır), `p:EYLEM:arg` (panel eylemi).

## 8. Montaj — `M(id, kareler)`

Seslendirmesiz, zamanlı kare dizisi: `{k:'montage', id, frames:[...]}`. Her kare bir "mini beat"tir:
```js
{ms:2200, bg:'oda', v:'gece', c:[['deniz',960,'shock']], panel:{type:'kod',id:'k',satirlar:['Segmentation fault (core dumped)'],tur:'hata'},
  cap:'2. SINIF', alt:'alt yazı (büyük, okunur)', fx:'shake', yer:'...'}
```
- `ms` karenin süresi. `bg`/`v`/`c`/`panel` verilmezse önceki kareden devralınır; `panel:null` paneli kaldırır, `c:[]` kadroyu boşaltır.
- `cap` = sol üstte büyük bölüm etiketi (ör. "1. SINIF"), `alt` = altta sinema alt yazısı (diyalog kutusu yerine).
- HUD montajda gizlenir (montaj kendi panelini taşır); `hud:1` ile gösterilir.
- Montaj otomatik oynar ve bitince sonraki adıma geçer. Toplam süre = kare ms toplamı.

Örnekler: M0 açılış (pencere → 1./2./3. sınıf), M1 LinkedIn akışı (`akis` paneli, tek kare ~20000 ms), M2 500 Kolay Başvuru (`kolay` paneli + `fx:'plus0'`), M3 mülakat soruları (`mulakat` paneli, 8 kare × ~2500 ms), M4 mezunlar grubu (`whatsapp`), M5 epilog (`epilog` paneli, 4 kare × ~3500 ms).
Kısa seslendirmesiz panel anı (Sahne 2.1 açılışı: Buse'nin LinkedIn bildirimi 3 sn) da tek kareli montajdır: `M('B21',[{ms:3200,bg:'lab',c:[],panel:{type:'lbildirim',...}}])`.

## 9. Kartlar

- `{k:'card',type:'title'}` — Windows donma penceresi "Mezuniyet.exe yanıt vermiyor. [Bekle] [Programı kapat]"; imleç önce "Programı kapat"ın üstünde durur, sonra "Bekle"ye tıklar. (Ses kilidi için ilk tuş/tıklama burada beklenir.)
- `perde(...)` → `{k:'card',type:'act',n,title,sub,sty}`.
- `son(...)` → `{k:'card',type:'end',n,title,moral,tone:'s1'..'s5'}`.
- `final()` → `{k:'card',type:'final',title,sub}`.

## 10. HUD

Sağ üst: GÖRÜNÜRLÜK · ÇEVRE · YETKİNLİK, 10 kutuluk çubuklar (değer = dolu kutu). Artış uçuşu otomatik (`art`). Asuman konuşurken "— — —" + yeşil "Soyadı ✓". Ozan: Y dolu, G/Ç boş; Buse: Ç dolu; Tolga: üçü düşük + "Caps: 4 GB". Anlatıcı sayaçlardan bahsetmez.

## 11. Müzik (`muzik`)

`lofi` (P1: ukulele + ağustos böceği), `synth` (P2), `toren`, `gergin` (P3 ilanlar), `melankoli`, `bayram` (bağlama + lo-fi), `s1` sıcak akustik, `s2` elektro-saz, `s3` gece chill-synth, `s4` yalnız piyano, `s5` müzik kutusu (aynı 4 nota), `epilog`, `none`.
Varsayılan: P1 `lofi`, P2 `synth`, P3 `mezuniyet`→`toren`, `oda`→`melankoli`, diğer P3 `gergin`, P4 `bayram`→`bayram`, diğer P4 `melankoli`. Son sahnelerinde `muzik:'s1'..'s5'` verin.

## 12. Oynatma

Varsayılan otomatik akış: replik sesi bitince (ses yoksa okuma süresi ≈ 14 karakter/sn, en az 3,5 sn) geçer; montajlar kendi süresince; oylama 30 sn, sonuç ~5 sn. Tuşlar: BOŞLUK/→ ilerle, ← geri, 1–4 kazananı zorla, R baştan, O otomatik aç/kapa, M ses, F tam ekran, K kayıt.
URL: `?test=1` öz sınama, `?vitrin=1` bütün mekân/panel/poz vitrini, `?yol=0,1,2&adim=14` doğrudan adıma git.

---

## DEĞİŞİKLİK (motor tamamlandıktan sonra)

- HİKÂYE bölümü artık `hikaye/build.js`'in birebir kopyasıdır (yazarın `yeni(c)`'si dahil; motorun ayrı bir `yeni`si yok). Hikâye güncellenince index.html'de `/* ---------- HİKÂYE` ile `/* ---------- SES` arası build.js ile değiştirilir; sonra `node hikaye/dogrula.js oyun/index.html`.
- HUD sayaçları beat'te `sayac:{g,c,y,durum}` alanından okunur (eski `hud:[g,ç,y]` de desteklenir). `d0` dizi (`[g,ç,y]`) ya da 1 olabilir; hepsi 0 ise "+0" uçar, artışlar sayaç farkından otomatik uçar.
- `final()` alt metninin varsayılanı yok; sessiz kart.
- Montaj karesinde `alt` verilirse `mulakat` paneli kendi soru şeridini çizmez (çift yazı olmasın).
- Paneller ekran dışına taşarsa ya da HUD'un altına girerse motor onları otomatik içeri kaydırır.
- `jirakart` paneli ayrıca 2. perde açılış kartında kullanılır.
