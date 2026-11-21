// Uçtan uca çevrimdışı önbellek testi (Playwright + Chromium):  node site/test/e2e-offline.mjs
// 1) ilk açılış: SW bütün dosyaları indirir, "hazir" der
// 2) ikinci açılış: yalnız manifest.json (ve sw.js güncelleme kontrolü) ağdan; wav isteği 0
// 3) tek wav değişir + manifest yeniden üretilir: yalnız o dosya iner, "guncelleme" gelir, sonraki açılışta yenisi verilir
// 4) sunucu kapalı + çevrimdışı: oyun açılır (başlık kartı), Range isteği 206 döner, <audio> önbellekten yüklenir
// playwright paketi yoksa: npm i -g playwright && npx playwright install chromium (NODE_PATH=$(npm root -g))
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSite, manifestYaz } from '../build.mjs';
import { sunucuBaslat } from './sunucu.mjs';

function playwrightYukle() {
  const req = createRequire(import.meta.url);
  try { return req('playwright'); } catch {}
  const kok = execSync('npm root -g').toString().trim();
  return createRequire(path.join(kok, 'noop.js'))('playwright');
}
const { chromium } = playwrightYukle();

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mezuniyet-e2e-'));
let tarayici, srv, basarisiz = 0;
const adim = m => console.log('\n▶ ' + m);
function bekle(kosul, mesaj) { if (kosul) console.log('  ✓ ' + mesaj); else { basarisiz++; console.log('  ✗ ' + mesaj); } }
const wavIstekleri = () => srv.kayit.filter(k => k.yol.startsWith('/oyun/ses/'));
const durumBekle = (page, t, ms = 180000) => page.waitForFunction(t => window.SW_DURUM && window.SW_DURUM.t === t, t, { timeout: ms });

try {
  const A = path.join(tmp, 'a'), B = path.join(tmp, 'b');
  const { manifest } = buildSite({ kok: KOK, cikis: A });
  const wavlar = Object.keys(manifest.dosyalar).filter(f => f.startsWith('ses/'));
  const toplamDosya = Object.keys(manifest.dosyalar).length;
  srv = await sunucuBaslat(A);
  tarayici = await chromium.launch();
  const ctx = await tarayici.newContext();
  // SW mesajlarını ve rozet metinlerini kaydet (yalnız test için)
  await ctx.addInitScript(() => {
    window.__mesajlar = []; window.__rozet = [];
    navigator.serviceWorker?.addEventListener('message', e => window.__mesajlar.push(e.data));
    addEventListener('DOMContentLoaded', () => new MutationObserver(() => { const r = document.getElementById('swRozet'); if (r && r.textContent !== window.__rozet.at(-1)) window.__rozet.push(r.textContent); }).observe(document.body, { subtree: true, childList: true, characterData: true }));
  });
  const page = await ctx.newPage();
  const konsol = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') konsol.push(m.text()); });
  page.on('pageerror', e => konsol.push('pageerror: ' + e.message));
  // sahte=1: Firebase/gstatic'e çıkmadan (test kapalı devre); oylama kodu yine yüklenir
  const URL_ = srv.url + '/oyun/?oto=0&sw=1&sahte=1';

  adim('İlk açılış: bütün dosyalar iner');
  let t0 = Date.now();
  await page.goto(URL_);
  await durumBekle(page, 'hazir');
  const indirilen = srv.kayit.filter(k => k.yol.startsWith('/oyun/') && k.arama.startsWith('?v='));
  console.log(`  (${((Date.now() - t0) / 1000).toFixed(1)} sn, ${indirilen.length} indirme)`);
  bekle(indirilen.length === toplamDosya, `manifestteki ${toplamDosya} dosyanın hepsi bir kez indi (${indirilen.length})`);
  bekle(new Set(indirilen.map(k => k.yol)).size === indirilen.length, 'hiçbir dosya iki kez inmedi');
  bekle(await page.evaluate(() => !!navigator.serviceWorker.controller), 'sayfa yenilenmeden SW denetimine geçti (clients.claim)');
  const msj = await page.evaluate(() => window.__mesajlar.filter(m => m.t === 'ilerleme'));
  bekle(msj.length > 0 && msj[0].toplam === toplamDosya && msj.at(-1).bitti === toplamDosya && msj.at(-1).bayt === msj.at(-1).toplamBayt, `ilerleme mesajları geldi (${msj.length} adet, son: ${JSON.stringify(msj.at(-1))})`);
  const rozetler = await page.evaluate(() => window.__rozet);
  bekle(rozetler.some(r => /^Çevrimdışı için hazırlanıyor… %\d+ \(\d+\/\d+\)$/.test(r)), `ilerleme rozeti: "${rozetler.find(r => /hazırlanıyor/.test(r))}"`);
  const rozet1 = await page.textContent('#swRozet');
  bekle(/Çevrimdışı oynamaya hazır/.test(rozet1), `rozet: "${rozet1}"`);

  adim('İkinci açılış: yalnız manifest');
  srv.kayit.length = 0;
  await page.reload();
  await durumBekle(page, 'hazir');
  await page.waitForTimeout(500);
  const yollar = srv.kayit.map(k => k.yol);
  console.log('  ağ istekleri:', JSON.stringify(yollar));
  bekle(wavIstekleri().length === 0, 'wav isteği 0');
  bekle(yollar.filter(y => y === '/oyun/manifest.json').length >= 1, 'manifest.json istendi');
  bekle(yollar.every(y => y === '/oyun/manifest.json' || y === '/oyun/sw.js'), 'index.html ve oylama dosyaları önbellekten (ağda yalnız manifest/sw.js)');
  bekle(await page.$('#card.title') !== null, 'başlık kartı görünüyor');

  adim('Tek wav değişti: yalnız o iner');
  fs.cpSync(A, B, { recursive: true });
  const degisen = wavlar[3];
  fs.appendFileSync(path.join(B, 'oyun', degisen), Buffer.alloc(1234));
  const m2 = manifestYaz(path.join(B, 'oyun'));
  srv.kok = B;
  // önce o dosya inemesin: güncelleme yarıda kalmalı, eski eksiksiz önbellek bozulmamalı
  srv.bozuk.add('/oyun/' + degisen);
  await page.reload();
  await durumBekle(page, 'hata', 30000);
  const eskiBoy = await page.evaluate(async y => (await (await fetch(y)).arrayBuffer()).byteLength, degisen);
  bekle(eskiBoy === manifest.dosyalar[degisen].b, `indirme başarısızken eski sürüm önbellekten veriliyor (${eskiBoy} bayt)`);
  bekle(srv.kayit.filter(k => k.yol === '/oyun/' + degisen && k.arama.startsWith('?v=')).length === 3, 'başarısız dosya 3 kez denendi');
  srv.bozuk.clear(); srv.kayit.length = 0;
  await page.reload();
  await durumBekle(page, 'guncelleme');
  const indi2 = srv.kayit.filter(k => k.arama.startsWith('?v='));
  console.log('  indirilen:', JSON.stringify(indi2.map(k => k.yol)));
  bekle(indi2.length === 1 && indi2[0].yol === '/oyun/' + degisen, `yalnız ${degisen} yeniden indi`);
  const rozet2 = await page.textContent('#swRozet');
  bekle(/Güncelleme indirildi/.test(rozet2), `rozet: "${rozet2}"`);
  srv.kayit.length = 0;
  await page.reload();
  await durumBekle(page, 'hazir');
  const boy = await page.evaluate(async y => (await (await fetch(y)).arrayBuffer()).byteLength, degisen);
  bekle(boy === m2.dosyalar[degisen].b, `sonraki açılışta yeni sürüm önbellekten veriliyor (${boy} bayt)`);
  bekle(wavIstekleri().length === 0, 've ağa gidilmedi');
  bekle(await page.evaluate(async s => (await caches.keys()).length >= 2 && (await (await caches.open('mezuniyet-dosya-v1')).keys()).length === s, Object.keys(m2.dosyalar).length),
    'önbellekte eski hash kalmadı (giriş sayısı = manifest)');

  adim('?test=1 öz sınamasında rozet yok');
  await page.goto(srv.url + '/oyun/?test=1');
  await page.waitForTimeout(800);
  bekle(await page.$('#swRozet') === null, 'rozet eklenmedi');
  await page.goto(URL_);
  await durumBekle(page, 'hazir');

  adim('Çevrimdışı: sunucu kapalı, ağ kapalı');
  await srv.kapat();
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('#card.title', { timeout: 20000 });
  bekle(true, 'oyun açıldı, başlık kartı görünüyor');
  await durumBekle(page, 'hazir', 20000);
  await page.waitForFunction(() => /Çevrimdışı · önbellekten/.test(document.getElementById('swRozet').textContent), null, { timeout: 5000 }).catch(() => {});
  const rozet3 = await page.textContent('#swRozet');
  bekle(/Çevrimdışı · önbellekten/.test(rozet3), `rozet: "${rozet3}"`);
  const r = await page.evaluate(async y => { const r = await fetch(y, { headers: { Range: 'bytes=100-199' } }); return { s: r.status, cr: r.headers.get('content-range'), n: (await r.arrayBuffer()).byteLength }; }, wavlar[0]);
  bekle(r.s === 206 && r.n === 100 && r.cr === `bytes 100-199/${manifest.dosyalar[wavlar[0]].b}`, `Range isteği: ${r.s} ${r.cr} (${r.n} bayt)`);
  const r2 = await page.evaluate(async y => { const r = await fetch(y, { headers: { Range: 'bytes=-50' } }); return { s: r.status, cr: r.headers.get('content-range'), n: (await r.arrayBuffer()).byteLength }; }, wavlar[0]);
  bekle(r2.s === 206 && r2.n === 50, `son ek Range (bytes=-50): ${r2.s} ${r2.cr}`);
  const ses = await page.evaluate(y => new Promise(ok => {
    const a = new Audio(y); a.preload = 'auto';
    const z = setTimeout(() => ok({ hata: 'zaman aşımı', rs: a.readyState }), 10000);
    a.addEventListener('loadedmetadata', () => { clearTimeout(z); ok({ sure: a.duration }); });
    a.addEventListener('error', () => { clearTimeout(z); ok({ hata: a.error && a.error.code }); });
    a.load();
  }), wavlar[1]);
  bekle(ses.sure > 0, `<audio> çevrimdışı yüklendi: ${JSON.stringify(ses)}`);
  const hatalar = konsol.filter(m => !/oylama|Failed to load resource|ERR_INTERNET_DISCONNECTED|HTTP 503/.test(m));
  bekle(hatalar.length === 0, 'beklenmeyen konsol hatası yok' + (hatalar.length ? ': ' + hatalar.slice(0, 5).join(' | ') : ''));
} catch (e) {
  basarisiz++; console.error('\n✗ test kırıldı:', e);
} finally {
  await tarayici?.close().catch(() => {});
  await srv?.kapat().catch(() => {});
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(basarisiz ? `\nBAŞARISIZ: ${basarisiz} kontrol` : '\nTAMAM: bütün kontroller geçti');
process.exit(basarisiz ? 1 : 0);
