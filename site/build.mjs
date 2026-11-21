// Mezuniyet.exe · site derlemesi (Cloudflare Pages: cenga-mezuniyet.pages.dev)
// Kullanım: node site/build.mjs            → dist/ üretir
// Bağımlılık yok (Node 22). Testler için bütün yollar dışarıdan verilebilir: buildSite({kok, cikis}).
//
// dist/
//   (firebase/public/ ağacının tamamı: /v/ oy sayfası, firebase-config.js, ...)
//   index.html, og.jpg, img/, onizleme.*  → site/vitrin/ (açılış sayfası; yoksa /oyun/'a yönlendirme)
//   _headers              → Cloudflare önbellek başlıkları
//   oyun/                 → oyun + sesler + oylama modülü + sw.js + manifest.json (hash'li dosya listesi)
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VARSAYILAN_KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// oyun/oylama/ altındaki kopyalar ve asıl (kanonik) kaynakları: [kopya, asıl] (kök dizine göre)
export const SENKRON_CIFTLERI = [
  ['oyun/oylama/vote-core.js', 'firebase/vote-core.js'],
  ['oyun/oylama/qr-svg.js', 'firebase/qr-svg.js'],
  ['oyun/oylama/qr.js', 'firebase/vendor/qr.js'],
  ['oyun/oylama/firebase-source.js', 'firebase/src/firebase-source.js'],
  ['oyun/oylama/mock-source.js', 'firebase/src/mock-source.js'],
  ['oyun/oylama/firebase-config.js', 'firebase-config.js'],
  ['firebase/public/firebase-config.js', 'firebase-config.js'],
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
    'Çözüm: asıl dosyayı (firebase/ altındaki ya da kökteki firebase-config.js) kopyanın üzerine kopyalayın,',
    '       ör. cp firebase/vote-core.js oyun/oylama/vote-core.js   (config için: cd firebase && npm run sync-config)',
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

const BASLIKLAR = `# Cloudflare Pages önbellek başlıkları (site/build.mjs üretir)
/oyun/sw.js
  Cache-Control: no-cache
/oyun/manifest.json
  Cache-Control: no-cache
/oyun/ses/*
  Cache-Control: public, max-age=2592000
`;

/**
 * Siteyi derler. kok: repo kökü, cikis: çıktı dizini (silinip yeniden kurulur).
 * Dönüş: { manifest, cikis }. Senkron sorunu varsa Error fırlatır (err.sorunlar).
 */
export function buildSite({ kok = VARSAYILAN_KOK, cikis = path.join(kok, 'dist'), zaman } = {}) {
  const sorunlar = senkronDenetle(kok);
  if (sorunlar.length) { const e = new Error(senkronMesaji(sorunlar)); e.sorunlar = sorunlar; throw e; }

  fs.rmSync(cikis, { recursive: true, force: true });
  fs.mkdirSync(cikis, { recursive: true });

  // 1) firebase/public/ olduğu gibi (alt klasörler dahil; dosya listesi sabit değil)
  agacKopyala(path.join(kok, 'firebase/public'), cikis);

  // 2) oyun: yalnız çalışma anında gerekenler (goruntuler/, md, baslat.bat, okunus.js, replikler.json hariç)
  const oy = path.join(kok, 'oyun'), hedef = path.join(cikis, 'oyun');
  fs.mkdirSync(path.join(hedef, 'ses'), { recursive: true });
  for (const f of ['index.html', 'sesler.json', 'sw.js']) fs.copyFileSync(path.join(oy, f), path.join(hedef, f));
  for (const f of fs.readdirSync(path.join(oy, 'ses'))) if (f.endsWith('.wav')) fs.copyFileSync(path.join(oy, 'ses', f), path.join(hedef, 'ses', f));
  agacKopyala(path.join(oy, 'oylama'), path.join(hedef, 'oylama'));

  // 3) açılış sayfası: site/vitrin/ → dist/ kökü (goruntuler/ yalnız denetim ekran görüntüleri, yayına girmez);
  //    vitrin yoksa ve firebase/public kendi index.html'ini getirmediyse /oyun/'a yönlendirme
  const vitrin = path.join(kok, 'site/vitrin');
  if (fs.existsSync(vitrin)) for (const e of fs.readdirSync(vitrin, { withFileTypes: true })) {
    if (e.name === 'goruntuler') continue;
    const k = path.join(vitrin, e.name), h = path.join(cikis, e.name);
    if (e.isDirectory()) agacKopyala(k, h); else if (e.isFile()) fs.copyFileSync(k, h);
  }
  if (!fs.existsSync(path.join(cikis, 'index.html'))) fs.writeFileSync(path.join(cikis, 'index.html'), YONLENDIRME);
  fs.writeFileSync(path.join(cikis, '_headers'), BASLIKLAR);

  // 4) manifest (en sonda: bütün dosyalar yerinde)
  const manifest = manifestYaz(hedef, zaman);
  return { manifest, cikis };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { manifest, cikis } = buildSite();
    const n = Object.keys(manifest.dosyalar).length;
    const mb = Object.values(manifest.dosyalar).reduce((a, d) => a + d.b, 0) / 1048576;
    console.log(`Derlendi: ${path.relative(process.cwd(), cikis) || cikis}/ · oyun sürümü ${manifest.surum} · ${n} dosya, ${mb.toFixed(1)} MB`);
  } catch (e) {
    console.error(e.sorunlar ? e.message : 'Derleme başarısız: ' + (e.stack || e));
    process.exit(1);
  }
}
