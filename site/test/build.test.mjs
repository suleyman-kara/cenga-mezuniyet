// node --test site/test/  — site derlemesinin birim testleri (bağımlılık yok)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite, senkronDenetle, senkronMesaji, manifestYaz, SENKRON_CIFTLERI } from '../build.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gecici = ad => fs.mkdtempSync(path.join(os.tmpdir(), 'mezuniyet-' + ad + '-'));
const sha16 = buf => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
const yaz = (kok, rel, icerik) => { const p = path.join(kok, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, icerik); };

// gerçek repoyu taklit eden küçük sahte kök
function sahteKok() {
  const k = gecici('kok');
  for (const [kopya, asil] of SENKRON_CIFTLERI) { const ic = '// ' + asil + '\n'; yaz(k, asil, ic); yaz(k, kopya, ic); }
  yaz(k, 'firebase/public/v/index.html', '<p>oy</p>');
  yaz(k, 'firebase/public/k/derin/a.txt', 'paralel geliştirici');
  yaz(k, 'oyun/index.html', '<title>oyun</title>');
  yaz(k, 'oyun/sw.js', '// sw');
  yaz(k, 'oyun/sesler.json', '{}');
  yaz(k, 'oyun/okunus.js', '// derleme aracı');
  yaz(k, 'oyun/KULLANIM.md', '# not');
  yaz(k, 'oyun/baslat.bat', 'rem');
  yaz(k, 'oyun/goruntuler/x.jpg', 'jpg');
  yaz(k, 'oyun/ses/replikler.json', '[]');
  yaz(k, 'oyun/ses/aaa.wav', 'RIFF-a');
  yaz(k, 'oyun/ses/bbb.wav', 'RIFF-b');
  return k;
}

test('gerçek repo: beklenen dosyalar üretilir, hariç tutulanlar girmez', () => {
  const cikis = path.join(gecici('dist'), 'dist');
  const { manifest } = buildSite({ kok: KOK, cikis });
  for (const f of ['index.html', '_headers', 'v/index.html', 'firebase-config.js', 'oyun/index.html', 'oyun/sw.js', 'oyun/manifest.json', 'oyun/sesler.json',
    'oyun/oylama/vote-core.js', 'oyun/oylama/qr.js', 'oyun/oylama/qr-svg.js', 'oyun/oylama/firebase-source.js', 'oyun/oylama/mock-source.js', 'oyun/oylama/firebase-config.js'])
    assert.ok(fs.existsSync(path.join(cikis, f)), f + ' yok');
  for (const f of ['oyun/goruntuler', 'oyun/KULLANIM.md', 'oyun/baslat.bat', 'oyun/okunus.js', 'oyun/ses/replikler.json', 'oyun/sahne-sozlesmesi.md'])
    assert.ok(!fs.existsSync(path.join(cikis, f)), f + ' girmemeliydi');
  const wavKaynak = fs.readdirSync(path.join(KOK, 'oyun/ses')).filter(f => f.endsWith('.wav'));
  assert.equal(fs.readdirSync(path.join(cikis, 'oyun/ses')).length, wavKaynak.length);
  // firebase/public ağacı birebir
  const pub = path.join(KOK, 'firebase/public');
  (function gez(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) gez(p); else assert.ok(fs.readFileSync(p).equals(fs.readFileSync(path.join(cikis, path.relative(pub, p)))), p); } })(pub);
  // manifest: her dosyanın hash ve boyu içerikle uyuşur; manifest.json ve sw.js listede yok
  assert.match(manifest.surum, /^[0-9a-f]{12}$/);
  assert.ok(!Number.isNaN(Date.parse(manifest.olusturma)));
  assert.ok(manifest.dosyalar['index.html']);
  assert.ok(!manifest.dosyalar['manifest.json'] && !manifest.dosyalar['sw.js']);
  assert.equal(Object.keys(manifest.dosyalar).filter(f => f.startsWith('ses/')).length, wavKaynak.length);
  for (const [rel, d] of Object.entries(manifest.dosyalar)) {
    const buf = fs.readFileSync(path.join(cikis, 'oyun', rel));
    assert.equal(d.h, sha16(buf), rel); assert.equal(d.b, buf.length, rel);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cikis, 'oyun/manifest.json'), 'utf8')), manifest);
  const bas = fs.readFileSync(path.join(cikis, '_headers'), 'utf8');
  assert.match(bas, /\/oyun\/sw\.js\n\s+Cache-Control: no-cache/);
  assert.match(bas, /\/oyun\/manifest\.json\n\s+Cache-Control: no-cache/);
  assert.match(fs.readFileSync(path.join(cikis, 'index.html'), 'utf8'), /\/oyun\//);
  fs.rmSync(path.dirname(cikis), { recursive: true, force: true });
});

test('gerçek repo: oylama kopyaları asıllarıyla aynı', () => {
  assert.deepEqual(senkronDenetle(KOK), []);
});

test('sahte kök: firebase/public alt klasörleri genel olarak kopyalanır', () => {
  const k = sahteKok(), cikis = path.join(k, 'dist');
  const { manifest } = buildSite({ kok: k, cikis });
  assert.equal(fs.readFileSync(path.join(cikis, 'k/derin/a.txt'), 'utf8'), 'paralel geliştirici');
  assert.deepEqual(Object.keys(manifest.dosyalar).sort(), ['index.html', 'oylama/firebase-config.js', 'oylama/firebase-source.js', 'oylama/mock-source.js', 'oylama/qr-svg.js', 'oylama/qr.js', 'oylama/vote-core.js', 'ses/aaa.wav', 'ses/bbb.wav', 'sesler.json']);
  fs.rmSync(k, { recursive: true, force: true });
});

test('sahte kök: kopya farklıysa derleme anlaşılır Türkçe mesajla durur', () => {
  const k = sahteKok();
  fs.appendFileSync(path.join(k, 'oyun/oylama/vote-core.js'), '// elle değiştirildi');
  fs.rmSync(path.join(k, 'oyun/oylama/qr.js'));
  const s = senkronDenetle(k);
  assert.deepEqual(s.map(x => [x.kopya, x.neden]), [['oyun/oylama/vote-core.js', 'içerik farklı'], ['oyun/oylama/qr.js', 'kopya yok']]);
  assert.throws(() => buildSite({ kok: k, cikis: path.join(k, 'dist') }), e => {
    assert.match(e.message, /HATA: oyunun oylama kopyaları/);
    assert.match(e.message, /oyun\/oylama\/vote-core\.js\s+↔\s+firebase\/vote-core\.js: içerik farklı/);
    assert.equal(e.sorunlar.length, 2);
    return true;
  });
  assert.ok(!fs.existsSync(path.join(k, 'dist')), 'hata durumunda dist üretilmemeli');
  assert.match(senkronMesaji(s), /firebase\/vendor\/qr\.js: kopya yok/);
  fs.rmSync(k, { recursive: true, force: true });
});

test('sahte kök: config kopyası farklıysa yakalanır', () => {
  const k = sahteKok();
  fs.writeFileSync(path.join(k, 'oyun/oylama/firebase-config.js'), 'window.FIREBASE_CONFIG={}');
  assert.deepEqual(senkronDenetle(k).map(x => x.asil), ['firebase-config.js']);
  fs.rmSync(k, { recursive: true, force: true });
});

test('manifest: sürüm içerikle değişir, zamanla değişmez; tek dosya değişince yalnız onun hash\'i değişir', () => {
  const d = gecici('oyun');
  yaz(d, 'index.html', 'a'); yaz(d, 'ses/x.wav', 'x'); yaz(d, 'ses/y.wav', 'y'); yaz(d, 'sw.js', 's');
  const m1 = manifestYaz(d, new Date(0)), m2 = manifestYaz(d, new Date(1e12));
  assert.equal(m1.surum, m2.surum);
  yaz(d, 'ses/y.wav', 'y2');
  const m3 = manifestYaz(d);
  assert.notEqual(m3.surum, m1.surum);
  assert.equal(m3.dosyalar['ses/x.wav'].h, m1.dosyalar['ses/x.wav'].h);
  assert.notEqual(m3.dosyalar['ses/y.wav'].h, m1.dosyalar['ses/y.wav'].h);
  assert.equal(m3.dosyalar['ses/y.wav'].b, 2);
  fs.rmSync(d, { recursive: true, force: true });
});
