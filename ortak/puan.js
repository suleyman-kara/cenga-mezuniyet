/* ortak/puan.js — salon oyunları için saf puan ve sıralama mantığı (DOM yok, ağ yok).
 * Tarayıcıda <script> ile global SalonPuan; Node'da require/import (site/test/puan.test.mjs).
 * ASIL DOSYA burası; yarisma/ortak/puan.js bayt bayt kopyasıdır (site/build.mjs denetler).
 *
 * Girdi: oylama kaynağının close() sonucu (FirebaseSource ya da Salon'un yerel kaynakları, ikisi de aynı biçimde):
 *   { votes: [{uid, o, atMs}], openedAtMs, durMs, pauses: [[başlangıç, bitiş], ...] }   (zamanlar ms)
 * Kahoot benzeri: doğru cevaba taban..tavan arası puan; ne kadar hızlıysa o kadar çok (duraklatılan süre sayılmaz).
 */
(function (kok, fabrika) {
  var api = fabrika();
  if (typeof module === 'object' && module.exports) { module.exports = api; module.exports.default = api; }
  else { kok.SalonPuan = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Oy anına kadar geçen etkin süre (ms): açılıştan oy anına, duraklatılan aralıklar düşülür. */
  function etkinSure(atMs, openedAtMs, pauses) {
    var g = atMs - openedAtMs;
    (pauses || []).forEach(function (p) {
      var s = Math.max(p[0], openedAtMs), e = Math.min(p[1], atMs);
      if (e > s) g -= e - s;
    });
    return Math.max(0, g);
  }

  /**
   * Bir sorunun puanları. dogru: doğru seçenek indeksi (tamsayı değilse anket: kimse puan almaz).
   * Dönüş: { puanlar: {uid: puan (yanlış = 0)}, dogrular: [uid], sureler: {uid: ms}, enHizli: {uid, ms} | null }
   */
  function turPuani(sonuc, dogru, ayar) {
    ayar = ayar || {};
    var taban = ayar.taban != null ? ayar.taban : 500, tavan = ayar.tavan != null ? ayar.tavan : 1000;
    var out = { puanlar: {}, dogrular: [], sureler: {}, enHizli: null };
    if (!sonuc || !Array.isArray(sonuc.votes) || !Number.isInteger(dogru)) return out;
    var dur = Math.max(1, sonuc.durMs || 1), acilis = sonuc.openedAtMs || 0;
    sonuc.votes.forEach(function (v) {
      if (!v || typeof v.uid !== 'string' || typeof v.atMs !== 'number') return;
      var ms = etkinSure(v.atMs, acilis, sonuc.pauses);
      out.sureler[v.uid] = ms;
      if (v.o !== dogru) { out.puanlar[v.uid] = 0; return; }
      var oran = Math.min(1, ms / dur);
      out.puanlar[v.uid] = Math.round(tavan - (tavan - taban) * oran);
      out.dogrular.push(v.uid);
      if (!out.enHizli || ms < out.enHizli.ms) out.enHizli = { uid: v.uid, ms: ms };
    });
    return out;
  }

  /** Toplamlara bir turun puanlarını ekler (yeni nesne döner; girdiler değişmez). */
  function topla(toplam, puanlar) {
    var y = {}, k;
    for (k in toplam) if (Object.prototype.hasOwnProperty.call(toplam, k)) y[k] = toplam[k];
    for (k in puanlar) if (Object.prototype.hasOwnProperty.call(puanlar, k)) y[k] = (y[k] || 0) + puanlar[k];
    return y;
  }

  /** Görünen ad: takma ad yoksa "Oyuncu" + uid'nin son 4 hanesi (aynı kişi hep aynı). */
  function gorunenAd(uid, adlar) {
    var a = adlar && typeof adlar[uid] === 'string' ? adlar[uid].trim() : '';
    return a || 'Oyuncu ' + String(uid).replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase();
  }

  /**
   * Sıralama: [{uid, ad, puan, sira}] puana göre azalan; eşit puan aynı sırayı alır (1, 1, 3).
   * Eşitlikte ad sırası (tr) — ekranda kararlı görünsün.
   */
  function siralama(toplam, adlar) {
    var l = Object.keys(toplam || {}).map(function (uid) { return { uid: uid, ad: gorunenAd(uid, adlar), puan: toplam[uid] || 0 }; });
    l.sort(function (a, b) { return b.puan - a.puan || a.ad.localeCompare(b.ad, 'tr') || (a.uid < b.uid ? -1 : 1); });
    l.forEach(function (x, i) { x.sira = i > 0 && l[i - 1].puan === x.puan ? l[i - 1].sira : i + 1; });
    return l;
  }

  /** Soru dosyasını denetler. Dönüş: Türkçe hata iletileri listesi (boş = sorun yok). */
  function sorulariDenetle(veri) {
    var h = [];
    if (!veri || typeof veri !== 'object') return ['sorular.js içinde window.YARISMA = { ... } tanımlı değil'];
    if (!Array.isArray(veri.sorular) || !veri.sorular.length) return ['YARISMA.sorular boş ya da dizi değil'];
    veri.sorular.forEach(function (s, i) {
      var n = 'Soru ' + (i + 1) + ': ';
      if (!s || typeof s !== 'object') { h.push(n + 'nesne değil'); return; }
      if (typeof s.soru !== 'string' || !s.soru.trim()) h.push(n + '"soru" metni yok');
      else if (s.soru.length > 140) h.push(n + 'soru metni çok uzun (' + s.soru.length + ' > 140 karakter; arkadan okunmaz)');
      if (!Array.isArray(s.secenekler) || s.secenekler.length < 2 || s.secenekler.length > 4) h.push(n + '2–4 seçenek olmalı');
      else s.secenekler.forEach(function (o, j) {
        if (typeof o !== 'string' || !o.trim()) h.push(n + (j + 1) + '. seçenek boş');
        else if (o.length > 60) h.push(n + (j + 1) + '. seçenek çok uzun (' + o.length + ' > 60 karakter)');
      });
      if (s.dogru !== undefined && s.dogru !== null && !(Number.isInteger(s.dogru) && Array.isArray(s.secenekler) && s.dogru >= 0 && s.dogru < s.secenekler.length))
        h.push(n + '"dogru" 0 ile ' + ((s.secenekler || []).length - 1) + ' arasında bir sayı olmalı (0 = ilk seçenek) ya da hiç yazılmamalı (anket)');
      if (s.sure !== undefined && !(typeof s.sure === 'number' && s.sure >= 5 && s.sure <= 120)) h.push(n + '"sure" 5–120 saniye olmalı');
    });
    return h;
  }

  return { etkinSure: etkinSure, turPuani: turPuani, topla: topla, gorunenAd: gorunenAd, siralama: siralama, sorulariDenetle: sorulariDenetle };
});
