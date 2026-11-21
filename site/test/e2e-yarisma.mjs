// Uçtan uca Salon Yarışması testi (Playwright + Chromium):  node site/test/e2e-yarisma.mjs [--goruntu]
// 1) ?sahte=1: lobi (sanal seyirci katılır) → 8 soru → cevap → sıralama → final podyumu; konsol hatası 0
// 2) ?demo=1: tek oyuncu tıklar; seçimi işaretlenir, doğruysa puan alır
// 3) çevrimdışı (gstatic engelli): oylama bağlanamaz → çevrimdışı kip; soru akar, cevap açıklanır
// --goruntu: 1920×1080 ekran görüntüleri yarisma/goruntuler/*.jpg (lobi, soru, cevap, siralama, final)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSite } from '../build.mjs';
import { sunucuBaslat } from './sunucu.mjs';

function playwrightYukle() {
  const req = createRequire(import.meta.url);
  try { return req('playwright'); } catch {}
  const kok = execSync('npm root -g').toString().trim();
  return createRequire(path.join(kok, 'noop.js'))('playwright');
}
const { chromium } = playwrightYukle();
const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GORUNTU = process.argv.includes('--goruntu');
const GDIR = path.join(KOK, 'yarisma/goruntuler');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'yarisma-e2e-'));
let tarayici, srv, basarisiz = 0;
const adim = m => console.log('\n▶ ' + m);
function bekle(kosul, mesaj) { if (kosul) console.log('  ✓ ' + mesaj); else { basarisiz++; console.log('  ✗ ' + mesaj); } }
const durum = page => page.evaluate(() => window.YARISMA_DURUM());
const fazBekle = (page, f, ms = 60000) => page.waitForFunction(f => window.YARISMA_DURUM && window.YARISMA_DURUM().faz === f, f, { timeout: ms });
async function goruntu(page, ad) { if (!GORUNTU) return; fs.mkdirSync(GDIR, { recursive: true }); await page.screenshot({ path: path.join(GDIR, ad + '.jpg'), type: 'jpeg', quality: 86 }); console.log('  📷 yarisma/goruntuler/' + ad + '.jpg'); }
function konsolTopla(page) {
  const k = [];
  page.on('console', m => { if (m.type() === 'error') k.push(m.text()); });
  page.on('pageerror', e => k.push('pageerror: ' + e.message));
  return k;
}

try {
  buildSite({ kok: KOK, cikis: tmp });
  srv = await sunucuBaslat(tmp);
  tarayici = await chromium.launch();
  const ctx = await tarayici.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.route(/gstatic\.com/, r => r.abort());   // test kapalı devre: Firebase'e asla çıkma

  adim('?sahte=1: lobiden podyuma');
  const page = await ctx.newPage(); const konsol = konsolTopla(page);
  await page.goto(srv.url + '/yarisma/?sahte=1&sw=0&sure=6');
  await page.waitForFunction(() => window.YARISMA_DURUM && window.YARISMA_DURUM().oyuncu >= 22, null, { timeout: 30000 });
  const d0 = await durum(page);
  bekle(d0.kip === 'sahte' && d0.faz === 'lobi', `lobi, sahte kip, ${d0.oyuncu} sanal oyuncu katıldı`);
  bekle(await page.$('#qrBuyuk svg') !== null, 'lobide QR çizildi');
  bekle(/\/v\/\?s=/.test(await page.textContent('#qrUrl')), 'QR altında oy adresi: ' + await page.textContent('#qrUrl'));
  await page.waitForTimeout(600);
  await goruntu(page, 'lobi');
  await page.keyboard.press('Space');
  const N = await page.evaluate(() => window.YARISMA.sorular.length);
  let tabloGoruldu = 0, ankette = false, siralamaGoruntu = false;
  for (let i = 0; i < N; i++) {
    await fazBekle(page, 'soru', 15000);
    await page.waitForTimeout(3800);
    const ds = await durum(page);
    bekle(ds.idx === i && ds.sayimlar.reduce((a, b) => a + b, 0) > 0, `soru ${i + 1}: oylar akıyor (${ds.sayimlar.join('/')})`);
    if (i === 0) await goruntu(page, 'soru');
    await fazBekle(page, 'cevap', 20000);
    await page.waitForTimeout(700);
    const dc = await durum(page), sq = await page.evaluate(i => window.YARISMA.sorular[i], i);
    if (Number.isInteger(sq.dogru)) {
      bekle(await page.$(`#secenekler .sec[data-i="${sq.dogru}"].dogru`) !== null, `soru ${i + 1}: doğru seçenek vurgulandı`);
      bekle(Object.keys(dc.toplam).length > 0, `soru ${i + 1}: toplam puan tablosu ${Object.keys(dc.toplam).length} oyuncu`);
    } else { ankette = true; bekle(/Salon böyle düşünüyor/.test(await page.textContent('#cevapBilgi')), `soru ${i + 1} (anket): "Salon böyle düşünüyor"`); }
    if (i === 0) await goruntu(page, 'cevap');
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
    if ((await durum(page)).faz === 'tablo') {
      tabloGoruldu++;
      const satir = await page.$$eval('#tablo .satir', l => l.length);
      if (!siralamaGoruntu && i >= 2) { await page.waitForTimeout(900); await goruntu(page, 'siralama'); siralamaGoruntu = true; }
      bekle(satir > 0, `sıralama: ${satir} satır`);
      await page.keyboard.press('Space');
    }
  }
  bekle(ankette, 'anket sorusu oynandı');
  bekle(tabloGoruldu >= 5, `sıralama ekranı ${tabloGoruldu} kez`);
  await fazBekle(page, 'final', 5000);
  await page.waitForTimeout(3200);
  const podyum = await page.$$eval('#podyum .basamak .kim', l => l.map(x => x.textContent));
  bekle(podyum.length === 3 && podyum.every(Boolean), 'podyum: ' + podyum.join(' / '));
  await goruntu(page, 'final');
  bekle(konsol.length === 0, 'konsol hatası yok' + (konsol.length ? ': ' + konsol.slice(0, 5).join(' | ') : ''));

  adim('P duraklatma: sayaç ve oylar durur');
  await page.goto(srv.url + '/yarisma/?sahte=1&sw=0&sure=10');
  await page.waitForTimeout(2500);
  await page.keyboard.press('Space'); await fazBekle(page, 'soru', 15000); await page.waitForTimeout(1500);
  await page.keyboard.press('p'); await page.waitForTimeout(300);
  const p1 = await page.evaluate(() => [document.getElementById('sayacN').textContent, window.YARISMA_DURUM().sayimlar.join()]);
  await page.waitForTimeout(2500);
  const p2 = await page.evaluate(() => [document.getElementById('sayacN').textContent, window.YARISMA_DURUM().sayimlar.join()]);
  bekle(p1[0] === p2[0] && p1[1] === p2[1] && await page.isVisible('#durakOv'), `duraklatılmışken sabit (sayaç ${p1[0]}, oylar ${p1[1]})`);
  await page.keyboard.press('p'); await fazBekle(page, 'cevap', 20000);
  bekle(true, 'devam edince soru kapandı');
  bekle(konsol.length === 0, 'konsol hatası yok');

  adim('?demo=1: tek oyuncu tıklar');
  const dp = await ctx.newPage(); const k2 = konsolTopla(dp);
  await dp.goto(srv.url + '/yarisma/?demo=1&sw=0&sure=8');
  await dp.waitForTimeout(500);
  bekle((await durum(dp)).kip === 'demo' && await dp.isHidden('#salonDurum'), 'demo kip, durum yazısı gizli');
  await dp.click('#sahne');
  await fazBekle(dp, 'soru', 15000);
  const dogru = await dp.evaluate(() => window.YARISMA.sorular[0].dogru);
  await dp.click(`#secenekler .sec[data-i="${dogru}"]`);
  await dp.waitForTimeout(250);
  bekle(await dp.$(`#secenekler .sec[data-i="${dogru}"].secim`) !== null, 'tıklanan seçenek "SENİN SEÇİMİN"');
  await dp.click('#soruMetin');   // seçenek dışına dokunma oylamayı kapatmamalı
  await dp.waitForTimeout(200);
  bekle((await durum(dp)).faz === 'soru', 'seçenek dışına tıklama oylamayı kapatmadı');
  await fazBekle(dp, 'cevap', 20000);
  const dd = await durum(dp);
  bekle(dd.toplam.sen > 500, `doğru cevap puanı: ${dd.toplam.sen}`);
  bekle(/Sen de bildin/.test(await dp.textContent('#cevapBilgi')), 'cevap satırı: "' + await dp.textContent('#cevapBilgi') + '"');
  bekle(k2.length === 0, 'konsol hatası yok' + (k2.length ? ': ' + k2.join(' | ') : ''));

  adim('Çevrimdışı: Firebase yüklenemez → çevrimdışı kip');
  const op = await ctx.newPage(); const k3 = [];
  op.on('pageerror', e => k3.push(e.message));
  await op.goto(srv.url + '/yarisma/?sw=0&sure=4');
  await op.waitForFunction(() => window.YARISMA_DURUM().kip === 'cevrimdisi', null, { timeout: 20000 });
  bekle(/Çevrimdışı/.test(await op.textContent('#salonDurum')), 'durum yazısı: "' + await op.textContent('#salonDurum') + '"');
  bekle(/Çevrimdışı/.test(await op.textContent('#qrBuyuk')), 'lobide QR yerine çevrimdışı uyarısı');
  await op.keyboard.press('Space');
  await fazBekle(op, 'cevap', 20000);
  bekle(/Doğru cevap/.test(await op.textContent('#cevapBilgi')), 'cevap açıklandı: "' + await op.textContent('#cevapBilgi') + '"');
  bekle(k3.length === 0, 'sayfa hatası yok' + (k3.length ? ': ' + k3.join(' | ') : ''));

  adim('sorular.js hatalıysa projektörde açık uyarı');
  fs.writeFileSync(path.join(tmp, 'yarisma/sorular.js'), 'window.YARISMA={sorular:[{soru:"x",secenekler:["a"],dogru:3}]};');
  const hp = await ctx.newPage();
  await hp.goto(srv.url + '/yarisma/?sahte=1&sw=0');
  await hp.waitForTimeout(400);
  const ht = await hp.textContent('#hataOv');
  bekle(await hp.isVisible('#hataOv') && /Soru 1: 2–4 seçenek/.test(ht), 'hata ekranı: ' + ht.slice(0, 90));
} catch (e) {
  basarisiz++; console.error('\n✗ test kırıldı:', e);
} finally {
  await tarayici?.close().catch(() => {});
  await srv?.kapat().catch(() => {});
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(basarisiz ? `\nBAŞARISIZ: ${basarisiz} kontrol` : '\nTAMAM: bütün kontroller geçti');
process.exit(basarisiz ? 1 : 0);
