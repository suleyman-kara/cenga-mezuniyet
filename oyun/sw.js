/* Mezuniyet.exe · çevrimdışı önbellek (service worker, kapsam: /oyun/)
 *
 * manifest.json: { surum, dosyalar: { "<yol>": { h: sha256'nın ilk 16 hanesi, b: bayt } } } (site/build.mjs üretir)
 * - Dosyalar içeriğe göre saklanır: DOSYA önbelleğinde anahtar "<kapsam>__h/<h>". Değişmeyen dosya (aynı h) asla
 *   yeniden inmez; yarıda kalan indirme bir sonraki açılışta kaldığı yerden sürer.
 * - Etkin manifest META önbelleğinde durur. Yeni sürümün bütün dosyaları inmeden etkin manifest değişmez
 *   (internet yarıda koparsa eski, eksiksiz önbellek çalışmaya devam eder). Tamamlanınca tek put ile değiştirilir,
 *   artık listede olmayan dosyalar silinir.
 * - Manifestteki dosyalar önbellekten (index.html dahil; ?arama parametreleri yok sayılır). Geri kalan her şey
 *   (Firebase, gstatic, /v/, manifest.json, sw.js) doğrudan ağa gider.
 * - <audio> Range isteği gönderir: önbellekteki dosya dilimlenip 206 + Content-Range ile döner.
 * - Açık sayfa asla yeniden yüklenmez; yeni sürüm bir sonraki açılışta geçerli olur.
 * Sayfaya mesajlar: {t:'ilerleme',bitti,toplam,bayt,toplamBayt} {t:'hazir',surum,cevrimdisi?} {t:'guncelleme',surum} {t:'hata',mesaj}
 *   {t:'yok'}: manifest.json yok (baslat.bat ile derlenmemiş klasör) → SW kendini kaldırır, rozet çıkmaz.
 */
'use strict';
const BIC = 'v1';
const META = 'mezuniyet-meta-' + BIC, DOSYA = 'mezuniyet-dosya-' + BIC;
const KAPSAM = new URL(self.registration.scope).pathname;        // "/oyun/"
const META_ANAHTAR = KAPSAM + '__manifest';
const ES_ZAMANLI = 6, DENEME = 3;

const TUR = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', json: 'application/json; charset=utf-8', wav: 'audio/wav', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', mp3: 'audio/mpeg', woff2: 'font/woff2' };
const turu = yol => TUR[(yol.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';
const hAnahtar = h => KAPSAM + '__h/' + h;
const bekle = ms => new Promise(r => setTimeout(r, ms));

let etkin = null;          // bellekteki etkin manifest (SW uyutulunca kaybolur, META'dan geri okunur)
let senkron = null;        // süren eşitleme (tek seferde bir tane)
let durum = null;          // son ilerleme mesajı (yeni açılan sayfaya hemen söylemek için)

async function etkinManifest() {
  if (etkin) return etkin;
  const r = await (await caches.open(META)).match(META_ANAHTAR);
  etkin = r ? await r.json() : null;
  return etkin;
}

async function yayinla(m) {
  const liste = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const c of liste) c.postMessage(m);
}

async function hex16(buf) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  let s = ''; for (let i = 0; i < 8; i++) s += d[i].toString(16).padStart(2, '0');
  return s;
}

function dosyaUrl(yol, h) {   // index.html Cloudflare'de /oyun/'a yönlenir; doğrudan dizini iste
  return KAPSAM + (yol === 'index.html' ? '' : yol.split('/').map(encodeURIComponent).join('/')) + '?v=' + h;
}

async function indir(cache, yol, d) {
  let son;
  for (let i = 0; i < DENEME; i++) {
    try {
      const r = await fetch(dosyaUrl(yol, d.h), { cache: 'no-store', credentials: 'same-origin' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = await r.arrayBuffer();
      const h = await hex16(buf);
      if (h !== d.h) throw new Error('hash uyuşmadı (' + h + ' ≠ ' + d.h + ')');
      await cache.put(hAnahtar(d.h), new Response(buf, { headers: { 'Content-Type': turu(yol), 'Content-Length': String(buf.byteLength) } }));
      return buf.byteLength;
    } catch (e) { son = e; if (i < DENEME - 1) await bekle(800 * (i + 1) * (i + 1)); }
  }
  throw new Error(yol + ': ' + (son && son.message || son));
}

async function eslestir() {
  let yeni;
  try {
    const r = await fetch(KAPSAM + 'manifest.json', { cache: 'no-store' });
    if (r.status === 404 && !(await etkinManifest())) {
      // derlenmemiş klasörden sunuluyor (baslat.bat): önbellek yok, sessizce çekil
      durum = { t: 'yok' }; await yayinla(durum); await self.registration.unregister(); return;
    }
    if (!r.ok) throw new Error('manifest HTTP ' + r.status);
    yeni = await r.json();
    if (!yeni || !yeni.dosyalar || !yeni.surum) throw new Error('manifest bozuk');
  } catch (e) {
    const m = await etkinManifest();
    durum = m ? { t: 'hazir', surum: m.surum, cevrimdisi: true } : { t: 'hata', mesaj: 'Manifest alınamadı (internet yok?): ' + e.message };
    await yayinla(durum);
    return;
  }

  const cache = await caches.open(DOSYA);
  const var_ = new Set((await cache.keys()).map(q => new URL(q.url).pathname));
  const eski = await etkinManifest();
  const eksik = Object.entries(yeni.dosyalar).filter(([, d]) => !var_.has(hAnahtar(d.h)));
  // aynı içerikli iki dosya tek kez iner
  const tekil = []; const gorulen = new Set();
  for (const e of eksik) if (!gorulen.has(e[1].h)) { gorulen.add(e[1].h); tekil.push(e); }

  if (tekil.length) {
    const toplam = tekil.length, toplamBayt = tekil.reduce((a, [, d]) => a + d.b, 0);
    let bitti = 0, bayt = 0, sira = 0; const hatalar = [];
    durum = { t: 'ilerleme', bitti, toplam, bayt, toplamBayt, surum: yeni.surum };
    await yayinla(durum);
    let sonYayin = 0;
    const isci = async () => {
      while (sira < tekil.length) {
        const [yol, d] = tekil[sira++];
        try { const n = await indir(cache, yol, d); bayt += n; bitti++; }   // (bayt += await … eşzamanlı işçilerde sayım kaybeder)
        catch (e) { hatalar.push(e.message); continue; }
        durum = { t: 'ilerleme', bitti, toplam, bayt, toplamBayt, surum: yeni.surum };
        const simdi = Date.now();
        if (simdi - sonYayin > 150 || bitti === toplam) { sonYayin = simdi; yayinla(durum); }
      }
    };
    await Promise.all(Array.from({ length: Math.min(ES_ZAMANLI, tekil.length) }, isci));
    if (hatalar.length) {
      durum = { t: 'hata', mesaj: hatalar.length + ' dosya inmedi: ' + hatalar.slice(0, 3).join('; ') + (eski ? ' · önceki sürüm kullanılmaya devam ediyor' : '') };
      await yayinla(durum);
      return;
    }
  }

  // her şey yerinde: etkin manifesti tek seferde değiştir, artık kullanılmayanları sil
  const degisti = !eski || eski.surum !== yeni.surum;
  if (degisti) {
    await (await caches.open(META)).put(META_ANAHTAR, new Response(JSON.stringify(yeni), { headers: { 'Content-Type': 'application/json' } }));
    etkin = yeni;
  }
  const gerekli = new Set(Object.values(yeni.dosyalar).map(d => hAnahtar(d.h)));
  for (const q of await cache.keys()) if (!gerekli.has(new URL(q.url).pathname)) await cache.delete(q);

  durum = eski && degisti ? { t: 'guncelleme', surum: yeni.surum } : { t: 'hazir', surum: yeni.surum };
  await yayinla(durum);
}

function eslestirBaslat() {
  if (!senkron) senkron = eslestir().catch(e => { durum = { t: 'hata', mesaj: String(e && e.message || e) }; return yayinla(durum); }).finally(() => { senkron = null; });
  return senkron;
}

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('mezuniyet-') && k !== META && k !== DOSYA) await caches.delete(k);
    await self.clients.claim();      // sayfa yenilenmeden isteklerini üstlen (yeniden yükleme yok)
    await eslestirBaslat();
  })());
});

self.addEventListener('message', e => {
  const m = e.data || {};
  if (m.t !== 'kontrol') return;
  // eşitleme sürüyorsa yeni sayfaya son durumu hemen bildir; değilse yeni bir kontrol başlat
  if (senkron && durum && e.source) e.source.postMessage(durum);
  e.waitUntil(eslestirBaslat());
});

// ---------- istekler ----------
function aralik(baslik, boy) {   // "bytes=a-b" | "bytes=a-" | "bytes=-n" → [a, b] (dahil) ya da null (karşılanamaz)
  const m = /^bytes=(\d*)-(\d*)$/.exec((baslik || '').trim().split(',')[0].trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let a, b;
  if (m[1] === '') { const n = +m[2]; if (!n) return null; a = Math.max(0, boy - n); b = boy - 1; }
  else { a = +m[1]; b = m[2] === '' ? boy - 1 : Math.min(+m[2], boy - 1); }
  if (a > b || a >= boy) return null;
  return [a, b];
}

async function onbellektenVer(req, yol) {
  const m = await etkinManifest();
  const d = m && m.dosyalar[yol];
  if (!d) return fetch(req);
  const r = await (await caches.open(DOSYA)).match(hAnahtar(d.h));
  if (!r) return fetch(req);                     // olmamalı; yine de ağa düş
  const blob = await r.blob(), boy = blob.size, tur = turu(yol);
  const rh = req.headers.get('range');
  if (rh) {
    const ab = aralik(rh, boy);
    if (!ab) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + boy } });
    const [a, b] = ab;
    return new Response(blob.slice(a, b + 1, tur), { status: 206, statusText: 'Partial Content', headers: {
      'Content-Type': tur, 'Content-Length': String(b - a + 1), 'Content-Range': `bytes ${a}-${b}/${boy}`, 'Accept-Ranges': 'bytes' } });
  }
  return new Response(blob, { status: 200, headers: { 'Content-Type': tur, 'Content-Length': String(boy), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin || !u.pathname.startsWith(KAPSAM)) return;
  let yol;
  try { yol = decodeURIComponent(u.pathname.slice(KAPSAM.length)); } catch (_) { return; }
  if (yol === '' || req.mode === 'navigate' && yol === 'index.html') yol = 'index.html';
  if (yol === 'manifest.json' || yol === 'sw.js') return;
  // manifest bellekteyse ve dosya listede yoksa hiç karışma (tarayıcı doğrudan ağdan alır)
  if (etkin && !etkin.dosyalar[yol]) return;
  e.respondWith((async () => {
    const m = await etkinManifest();
    if (!m || !m.dosyalar[yol]) return fetch(req);
    try { return await onbellektenVer(req, yol); } catch (_) { return fetch(req); }
  })());
});
