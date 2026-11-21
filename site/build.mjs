// Mezuniyet.exe · site derlemesi (Cloudflare Pages: cenga-mezuniyet.pages.dev)
// Kullanım: node site/build.mjs            → dist/ üretir
// Bağımlılık yok (Node 22). Testler için bütün yollar dışarıdan verilebilir: buildSite({kok, cikis}).
//
// dist/
//   (firebase/public/ ağacının tamamı: /v/ oy sayfası, firebase-config.js, ...)
//   index.html            → /oyun/'a yönlendirme (asıl açılış sayfası sonra gelecek)
//   _headers              → Cloudflare önbellek başlıkları
//   oyun/                 → Mezuniyet.exe: oyun + sesler + oylama modülü + sw.js + manifest.json (hash'li dosya listesi)
//   yarisma/              → Salon Yarışması: oyun + sorular + oylama + ortak/ (Salon çalışma zamanı) + sw.js + manifest.json
// Her oyun klasörü kendi kapsamında çevrimdışı önbelleklenir (aynı ortak/sw.js); yeni oyun = OYUNLAR'a bir satır.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VARSAYILAN_KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Oyun klasörlerindeki kopyalar ve asıl (kanonik) kaynakları: [kopya, asıl] (kök dizine göre).
// Oyunlar derlemesiz çalışır (klasörden doğrudan açılabilsin, SW kapsamı klasörle sınırlı), bu yüzden kopya tutar.
export const SENKRON_CIFTLERI = [
  ['oyun/oylama/vote-core.js', 'firebase/vote-core.js'],
  ['oyun/oylama/qr-svg.js', 'firebase/qr-svg.js'],
  ['oyun/oylama/qr.js', 'firebase/vendor/qr.js'],
  ['oyun/oylama/firebase-source.js', 'firebase/src/firebase-source.js'],
  ['oyun/oylama/mock-source.js', 'firebase/src/mock-source.js'],
  ['oyun/oylama/firebase-config.js', 'firebase-config.js'],
  ['firebase/public/firebase-config.js', 'firebase-config.js'],
  ['oyun/sw.js', 'ortak/sw.js'],
  // Salon Yarışması (yarisma/): oylama + Salon çalışma zamanı
  ['yarisma/sw.js', 'ortak/sw.js'],
  ['yarisma/oylama/vote-core.js', 'firebase/vote-core.js'],
  ['yarisma/oylama/qr-svg.js', 'firebase/qr-svg.js'],
  ['yarisma/oylama/qr.js', 'firebase/vendor/qr.js'],
  ['yarisma/oylama/firebase-source.js', 'firebase/src/firebase-source.js'],
  ['yarisma/oylama/firebase-config.js', 'firebase-config.js'],
  ['yarisma/ortak/salon.js', 'ortak/salon.js'],
  ['yarisma/ortak/salon.css', 'ortak/salon.css'],
  ['yarisma/ortak/puan.js', 'ortak/puan.js'],
];

// Yayımlanan oyunlar. dahil: 'dosya' | 'klasör/' (bütün ağaç) | 'klasör/*.uzantı' (o klasördeki o uzantılı dosyalar).
// Listede olmayan her şey (goruntuler/, *.md, baslat.bat, araçlar) dist'e girmez. uzunOnbellek: _headers'ta 30 gün.
export const OYUNLAR = [
  { klasor: 'oyun', dahil: ['index.html', 'sesler.json', 'sw.js', 'oylama/', 'ses/*.wav'], uzunOnbellek: ['ses/*'] },
  { klasor: 'yarisma', dahil: ['index.html', 'sorular.js', 'sw.js', 'oylama/', 'ortak/'] },
];

const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');
const posix = p => p.split(path.sep).join('/');

/** Kopyalar asıllarıyla aynı mı? Farklı/eksik olanların listesini döner (boş = sorun yok). */
export function senkronDenetle(kok = VARSAYILAN_KOK, ciftler = SENKRON_CIFTLERI) {
  const sorunlar = [];
  for (const [kopya, asil] of ciftler) {
    const a = path.join(kok, kopya), b = path.join(kok, asil);
    if (!fs.existsSync(b)) { sorunlar.push({ kopya, asil, neden: 'asıl dosya yok' }); continue; }
    if (!fs.existsSync(a)) { sorunlar.push({ kopya, asil, neden: 'kopya yok' }); continue; }
    if (!fs.readFileSync(a).equals(fs.readFileSync(b))) sorunlar.push({ kopya, asil, neden: 'içerik farklı' });
  }
  return sorunlar;
}

export function senkronMesaji(sorunlar) {
  return [
    'HATA: oyunun oylama kopyaları asıl dosyalarla aynı değil. Derleme durduruldu.',
    ...sorunlar.map(s => `  - ${s.kopya}  ↔  ${s.asil}: ${s.neden}`),
    'Çözüm: asıl dosyayı (firebase/ ya da ortak/ altındaki, ya da kökteki firebase-config.js) kopyanın üzerine kopyalayın,',
    '       ör. cp firebase/vote-core.js oyun/oylama/vote-core.js · cp ortak/salon.js yarisma/ortak/salon.js',
    '       (config için: cd firebase && npm run sync-config)',
  ].join('\n');
}

function agacKopyala(kaynak, hedef) {
  fs.mkdirSync(hedef, { recursive: true });
  for (const e of fs.readdirSync(kaynak, { withFileTypes: true })) {
    const k = path.join(kaynak, e.name), h = path.join(hedef, e.name);
    if (e.isDirectory()) agacKopyala(k, h);
    else if (e.isFile()) fs.copyFileSync(k, h);
  }
}

function dosyalar(dizin) {   // dizin altındaki bütün dosyalar (göreli, posix)
  const out = [];
  (function gez(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) gez(p); else if (e.isFile()) out.push(posix(path.relative(dizin, p)));
    }
  })(dizin);
  return out.sort();
}

// manifeste girmeyen dosyalar: kendisi ve service worker (ikisi de her zaman ağdan, no-cache)
const MANIFEST_DISI = new Set(['manifest.json', 'sw.js']);

/** dist/oyun/ içeriğinden manifest.json üretir ve yazar. */
export function manifestYaz(oyunDizini, zaman = new Date()) {
  const liste = {};
  for (const rel of dosyalar(oyunDizini)) {
    if (MANIFEST_DISI.has(rel)) continue;
    const buf = fs.readFileSync(path.join(oyunDizini, rel));
    liste[rel] = { h: sha(buf).slice(0, 16), b: buf.length };
  }
  const surum = sha(Object.entries(liste).map(([p, d]) => p + ':' + d.h).join('\n')).slice(0, 12);
  const manifest = { surum, olusturma: zaman.toISOString(), dosyalar: liste };
  fs.writeFileSync(path.join(oyunDizini, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
  return manifest;
}

const YONLENDIRME = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mezuniyet.exe</title>
<meta http-equiv="refresh" content="0; url=/oyun/">
<script>location.replace('/oyun/'+location.search+location.hash)</script>
</head><body style="font:18px system-ui,sans-serif;padding:24px">
<a href="/oyun/">Mezuniyet.exe → oyuna git</a>
</body></html>
`;

/** _headers: her oyunun sw.js ve manifest.json'ı her zaman ağdan (no-cache); uzunOnbellek kalıpları 30 gün. */
export function basliklar(oyunlar = OYUNLAR) {
  let s = '# Cloudflare Pages önbellek başlıkları (site/build.mjs üretir)\n';
  for (const o of oyunlar) {
    s += `/${o.klasor}/sw.js\n  Cache-Control: no-cache\n/${o.klasor}/manifest.json\n  Cache-Control: no-cache\n`;
    for (const k of o.uzunOnbellek || []) s += `/${o.klasor}/${k}\n  Cache-Control: public, max-age=2592000\n`;
  }
  return s;
}

/** Bir oyun klasörünün çalışma anında gereken dosyalarını (dahil listesi) hedefe kopyalar. Eksik dosya: Error. */
export function oyunKopyala(kaynak, hedef, dahil) {
  fs.mkdirSync(hedef, { recursive: true });
  for (const d of dahil) {
    if (d.endsWith('/')) { agacKopyala(path.join(kaynak, d), path.join(hedef, d)); continue; }
    const m = /^(.*)\/\*(\.[^/]+)$/.exec(d);
    if (m) {
      const k = path.join(kaynak, m[1]), h = path.join(hedef, m[1]);
      fs.mkdirSync(h, { recursive: true });
      for (const f of fs.readdirSync(k)) if (f.endsWith(m[2]) && fs.statSync(path.join(k, f)).isFile()) fs.copyFileSync(path.join(k, f), path.join(h, f));
      continue;
    }
    fs.mkdirSync(path.dirname(path.join(hedef, d)), { recursive: true });
    fs.copyFileSync(path.join(kaynak, d), path.join(hedef, d));
  }
}

/**
 * Siteyi derler. kok: repo kökü, cikis: çıktı dizini (silinip yeniden kurulur).
 * Dönüş: { manifest (oyun/), manifestler: {klasör: manifest}, cikis }. Senkron sorunu varsa Error fırlatır (err.sorunlar).
 */
export function buildSite({ kok = VARSAYILAN_KOK, cikis = path.join(kok, 'dist'), zaman, oyunlar = OYUNLAR } = {}) {
  const sorunlar = senkronDenetle(kok);
  if (sorunlar.length) { const e = new Error(senkronMesaji(sorunlar)); e.sorunlar = sorunlar; throw e; }

  fs.rmSync(cikis, { recursive: true, force: true });
  fs.mkdirSync(cikis, { recursive: true });

  // 1) firebase/public/ olduğu gibi (alt klasörler dahil; dosya listesi sabit değil)
  agacKopyala(path.join(kok, 'firebase/public'), cikis);

  // 2) oyunlar: yalnız çalışma anında gerekenler (OYUNLAR.dahil; goruntuler/, md, baslat.bat, okunus.js, replikler.json hariç)
  for (const o of oyunlar) oyunKopyala(path.join(kok, o.klasor), path.join(cikis, o.klasor), o.dahil);

  // 3) kök yönlendirme (firebase/public bir gün kendi index.html'ini getirirse ona dokunma)
  if (!fs.existsSync(path.join(cikis, 'index.html'))) fs.writeFileSync(path.join(cikis, 'index.html'), YONLENDIRME);
  fs.writeFileSync(path.join(cikis, '_headers'), basliklar(oyunlar));

  // 4) her oyunun manifesti (en sonda: bütün dosyalar yerinde)
  const manifestler = {};
  for (const o of oyunlar) manifestler[o.klasor] = manifestYaz(path.join(cikis, o.klasor), zaman);
  return { manifest: manifestler.oyun, manifestler, cikis };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { manifestler, cikis } = buildSite();
    const ozet = Object.entries(manifestler).map(([k, m]) => {
      const n = Object.keys(m.dosyalar).length, mb = Object.values(m.dosyalar).reduce((a, d) => a + d.b, 0) / 1048576;
      return `${k}/ sürüm ${m.surum} · ${n} dosya, ${mb.toFixed(1)} MB`;
    });
    console.log(`Derlendi: ${path.relative(process.cwd(), cikis) || cikis}/ · ${ozet.join(' · ')}`);
  } catch (e) {
    console.error(e.sorunlar ? e.message : 'Derleme başarısız: ' + (e.stack || e));
    process.exit(1);
  }
}
