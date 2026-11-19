# Canlı salon oylaması (Firebase Spark)

Tek dosyalık oyun (derleme yok) karar anlarında QR gösterir; seyirciler telefonla `public/v/` sayfasından oy verir. Cloud Functions yok: sayımı **host istemcisi** (dizüstündeki oyun) yapar.

## Mimari
```
Telefon (public/v/index.html)  --anonim oy-->  Firestore  <--dinler/sayar--  Host (oyun + FirebaseSource)
        ^                                         |  sessions/{sid}                 |
        +------ sonucu oturum belgesinden --------+  sessions/{sid}/votes/{decKey}__{uid}
```
- `sessions/{sid}`: `hostUid, phase('lobby'|'vote'|'result'|'ended'), decKey, q, options, n, poll, openedAt, closesAt, winner, counts, forced, paused, pausedLeftMs`.
- Oy belgesi: `{o, at: serverTimestamp()}`; kimlik `decKey__uid` (kişi başı tek oy, süre bitene dek değiştirilebilir).
- Host yalnız `at <= closesAt` oyları sayar; süre dolunca `winner/counts/phase='result'` yazar.
- `vote-core.js` (saf mantık): `tally, pickWinner, remainingMs, makeDecKey, percents` — tarayıcıda global `VoteCore`, Node'da `require`.
- Kurallar `firestore.rules` (tek parça, konsola yapıştırılabilir): oturumu giriş yapmış herkes okur; güncelleme sadece host; oy yalnız doğru kimlik/faz/süre(+1 sn tolerans)/`o` aralığı/alan seti/`at==request.time`; silme yok; oyları sadece host listeler, seyirci yalnız kendi oyunu okur.

## VoteSource arayüzü (FirebaseSource ve MockSource aynı)
| Metot | Açıklama |
|---|---|
| `await createSession()` → `sid` | Anonim giriş + lobby oturumu. Ağ yoksa reddeder (oyun Mock'a düşebilir). |
| `open({decKey,q,options,poll,durMs})` | Oylamayı açar; sayaç hemen yerel başlar. **await etmeyin** (yazma ağ yoksa zaman aşımına kadar sürer); `Promise<{ok,error}>` döner. |
| `onUpdate(cb({counts,total,remainingMs,error}))` | ~250 ms'de bir ve her yeni oyda. `remainingMs<=0` olunca motor `close()` çağırır. |
| `forceWin(i)` | Sunucu tuşu: `i` kazanır, süre ~1,5 sn'ye kısalır. Geçersiz `i` yok sayılır. |
| `await close()` → `{counts,winner,forced,total,error,errors}` | **Her durumda çözülür**, kazanan döner (oysuz/hata: rastgele). `error` doluysa ağ/izin sorunu vardı. |
| `pause()` / `resume()` | Oyun duraklatılınca (P) çağrılır. Karar açıksa kalan süre saklanır (`paused:true, pausedLeftMs`), sayaç/emit sabit kalır, süre dolmaz; `resume` `closesAt = şimdi + kalan` yazar. Karar yokken yalnız `paused` yazılır. Kurallar duraklatılmışken oyu reddeder. `Promise<{ok,error}>` döner, asla takılmaz. |
| `voteUrl(sid)` | `https://<proje>.web.app/v/?s=<sid>` (GitHub Pages için `voteBaseUrl` verin). |

Kaynaklar: `src/firebase-source.js` (`connectFirebaseSource(config)` CDN modüler SDK'yı yükler), `src/mock-source.js` (`createMockSource()` eski sahte akış; otomatik oynatma/video). QR: `vendor/qr.js` + `qr-svg.js` → `QrSvg.qrSvg(url)` SVG string.

## Motora bağlama (öneri; motoru bu çalışma değiştirmedi)
```html
<script src="vote-core.js"></script><script src="vendor/qr.js"></script><script src="qr-svg.js"></script>
<script src="firebase-config.js"></script>
<script type="module">
import { connectFirebaseSource } from './src/firebase-source.js';
import { createMockSource } from './src/mock-source.js';
let src; try { src = await connectFirebaseSource(window.FIREBASE_CONFIG); var sid = await src.createSession(); }
catch (e) { src = createMockSource(); sid = await src.createSession(); }   // internet yoksa sahte oylamaya düş
$('qr').innerHTML = QrSvg.qrSvg(src.voteUrl(sid));
window.VOTE = src; // classic script'ten erişim
</script>
```
- `startDecision`: `V={...}` ve fake `every(tick)` yerine `VOTE.onUpdate(u=>{V.c=u.counts; V.left=u.remainingMs; paintVotes(); sayaç/halka güncelle; if(u.remainingMs<=0) finalize();})` ve `VOTE.open({decKey:VoteCore.makeDecKey(st.id), q:d.q, options:d.o.map(o=>o[0]), poll, durMs:DUR*1000})` (DUR=30).
- `forceWin(w)`: motor kendi `V.forced` işaretini koyup `VOTE.forceWin(w)` çağırır.
- `finalize`: `const r = await VOTE.close(); w = r.winner; V.c = r.counts;` sonra mevcut kazanan-önde düzeltmesi/animasyon aynen kalır (gerçek sayılar kazananı önde göstermeyebilir, eski swap kodu bunu düzeltir). `r.error` doluysa küçük bir uyarı yeterli. Poll'da motor sonucu yalnız gösterir.

## Kurulum (gerçek proje)
Proje: `cenga-mezuniyet` (`.firebaserc`). 1) Firestore'u etkinleştir. 2) Authentication > Anonymous aç. 3) Web config: `firebase-config.js` (örnek: `firebase-config.example.js`); `npm run sync-config` üst dizindeki dosyayı `public/firebase-config.js`'e kopyalar. 4) `npx firebase deploy --only hosting,firestore:rules` — CLI girişi yoksa `firestore.rules` içeriğini konsol editörüne yapıştırın, `public/` klasörünü (statik, göreli yollar) GitHub Pages'e de koyabilirsiniz (Firebase Auth'ta yetkili alan adlarına Pages alan adını ekleyin). Firestore ve Hosting Spark planında ücretsizdir.

## Testler
`npm run test:unit` (vote-core, QR/jsQR, config, FirebaseSource/MockSource/telefon sayfası — **sahte bellek içi Firestore**, kural uygulamaz), `npm run test:rules` ve `npm run test:int` (Firestore emülatörü gerekir; emülatör jar'ı `storage.googleapis.com`'dan iner), `npm run lint:rules` (resmi Firebase kural gramerine göre sözdizimi), `npm test` hepsi.

## Host'ta internet koparsa
- Oturum açılmadan (QR'dan önce): `createSession` zaman aşımıyla reddeder → öneri: Mock'a düş, QR gösterme.
- Oylama sırasında: sayaç yerel saatle akar, `onUpdate.error` dolar; Firestore yerel kuyruk/önbellekten gelen oylarla sayar. `close()` en geç ~ (settle + 2,5 sn + 3 sn) içinde çözülür: elindeki oylarla (yoksa rastgele) kazananı döner, sonuç yazımı başarısızsa `error` verir. Motor kilitlenmez; telefonlar sonucu ancak bağlantı dönünce (yazma kuyruktan gider) görür.
- Telefon tarafı: bağlantı kopunca kırmızı şerit; oy yazımı başarısızsa "gönderilemedi" ve yeniden dokunma.

## Bilinen sınırlar
- Telefon saat farkı, sayfa yüklenirken ve ekran tekrar görünür olunca sunucunun `Date` başlığından (HEAD isteği, gidiş-dönüş yarısı düzeltmeli) ölçülür; alınamazsa 0 kabul edilir. Sayım sunucu zamanıyla yapıldığı için sonuç etkilenmez.
- CDN SDK sürümü (`12.19.0`) `gstatic` üzerinde sandbox'tan doğrulanamadı; deploy öncesi tarayıcıda test edin.
