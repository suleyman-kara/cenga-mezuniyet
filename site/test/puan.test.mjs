// node --test site/test/  — ortak/puan.js (yarışma puanı, sıralama, soru dosyası denetimi) ve yarisma/sorular.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const P = createRequire(import.meta.url)(path.join(KOK, 'ortak/puan.js'));
const sorularYukle = (dosya = path.join(KOK, 'yarisma/sorular.js')) => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(dosya, 'utf8'), ctx); return ctx.window.YARISMA; };
const sonuc = (votes, ek = {}) => ({ votes, openedAtMs: 1000, durMs: 20000, pauses: [], ...ek });

test('turPuani: doğru ve hızlı = çok puan; yanlış = 0; tavan/taban sınırları', () => {
  const r = P.turPuani(sonuc([{ uid: 'a', o: 1, atMs: 1000 }, { uid: 'b', o: 1, atMs: 11000 }, { uid: 'c', o: 1, atMs: 21000 }, { uid: 'd', o: 0, atMs: 1500 }, { uid: 'e', o: 1, atMs: 99999 }]), 1);
  assert.equal(r.puanlar.a, 1000); assert.equal(r.puanlar.b, 750); assert.equal(r.puanlar.c, 500); assert.equal(r.puanlar.d, 0);
  assert.equal(r.puanlar.e, 500, 'süre dışı (olmamalı ama) tabanın altına inmez');
  assert.deepEqual(r.dogrular.sort(), ['a', 'b', 'c', 'e']);
  assert.deepEqual(r.enHizli, { uid: 'a', ms: 0 });
});
test('turPuani: anket (dogru yok) kimseye puan vermez; özel taban/tavan', () => {
  assert.deepEqual(P.turPuani(sonuc([{ uid: 'a', o: 1, atMs: 2000 }]), null).puanlar, {});
  assert.deepEqual(P.turPuani(sonuc([{ uid: 'a', o: 1, atMs: 2000 }]), undefined).dogrular, []);
  assert.equal(P.turPuani(sonuc([{ uid: 'a', o: 0, atMs: 11000 }]), 0, { taban: 0, tavan: 100 }).puanlar.a, 50);
});
test('turPuani: bozuk girdiyi yok sayar', () => {
  const r = P.turPuani(sonuc([null, { o: 1, atMs: 2 }, { uid: 'x', o: 1 }, { uid: 'y', o: 1, atMs: 1000 }]), 1);
  assert.deepEqual(Object.keys(r.puanlar), ['y']);
  assert.deepEqual(P.turPuani(null, 1).puanlar, {});
});
test('etkinSure: duraklatılan aralıklar düşülür (oy anından sonraki duraklatma etkilemez)', () => {
  assert.equal(P.etkinSure(11000, 1000, [[3000, 7000]]), 6000);
  assert.equal(P.etkinSure(5000, 1000, [[3000, 9000]]), 2000);
  assert.equal(P.etkinSure(2000, 1000, [[3000, 9000]]), 1000);
  const r = P.turPuani(sonuc([{ uid: 'a', o: 0, atMs: 11000 }], { pauses: [[3000, 7000]] }), 0);
  assert.equal(r.puanlar.a, 850);   // 6 sn etkin: 1000 - 500*6/20
});
test('topla: girdileri değiştirmez, yeni oyuncuyu ekler', () => {
  const t = { a: 100 }, y = P.topla(t, { a: 50, b: 0 });
  assert.deepEqual(y, { a: 150, b: 0 }); assert.deepEqual(t, { a: 100 });
});
test('siralama: puana göre; eşit puan aynı sıra (1,1,3); adsıza kararlı ad', () => {
  const l = P.siralama({ u1: 900, u2: 1500, u3: 900, sahte007: 100 }, { u1: 'Zeynep', u2: 'Ali', u3: 'Can' });
  assert.deepEqual(l.map(x => [x.ad, x.puan, x.sira]), [['Ali', 1500, 1], ['Can', 900, 2], ['Zeynep', 900, 2], ['Oyuncu E007', 100, 4]]);
  assert.equal(P.gorunenAd('abcDEF123', {}), 'Oyuncu F123');
  assert.equal(P.gorunenAd('x', { x: '  ' }), 'Oyuncu X');
});
test('sorulariDenetle: hatalar Türkçe ve soru numaralı', () => {
  assert.deepEqual(P.sorulariDenetle({ sorular: [{ soru: 'S?', secenekler: ['a', 'b'], dogru: 1 }, { soru: 'Anket?', secenekler: ['a', 'b', 'c'] }] }), []);
  assert.match(P.sorulariDenetle(undefined)[0], /window\.YARISMA/);
  assert.match(P.sorulariDenetle({ sorular: [] })[0], /boş/);
  const h = P.sorulariDenetle({ sorular: [{ soru: '', secenekler: ['a'] }, { soru: 'x', secenekler: ['a', 'b'], dogru: 2, sure: 2 }, { soru: 'y'.repeat(141), secenekler: ['a', ''] }] });
  assert.ok(h.some(x => /^Soru 1: "soru" metni yok/.test(x)));
  assert.ok(h.some(x => /^Soru 1: 2–4 seçenek/.test(x)));
  assert.ok(h.some(x => /^Soru 2: "dogru" 0 ile 1 arasında/.test(x)));
  assert.ok(h.some(x => /^Soru 2: "sure" 5–120/.test(x)));
  assert.ok(h.some(x => /^Soru 3: soru metni çok uzun/.test(x)));
  assert.ok(h.some(x => /^Soru 3: 2\. seçenek boş/.test(x)));
});
test('yarisma/sorular.js geçerli: 8 soru, en az bir anket, en az bir puanlı', () => {
  const Y = sorularYukle();
  assert.deepEqual(P.sorulariDenetle(Y), []);
  assert.equal(Y.sorular.length, 8);
  assert.ok(Y.sorular.some(s => s.dogru === undefined));
  assert.ok(Y.sorular.filter(s => Number.isInteger(s.dogru)).length >= 6);
  assert.ok(Y.ayarlar.taban < Y.ayarlar.tavan);
});
