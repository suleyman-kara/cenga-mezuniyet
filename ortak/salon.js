/* ortak/salon.js — Salon çalışma zamanı: projektörde akan, salonun telefonla oy verdiği oyunların hikâyeden
 * bağımsız ortak altyapısı. Klasik <script> (modül değil): global `Salon`.
 * ASIL DOSYA burası; oyun klasörlerindeki kopyalar (ör. kod-mahkemesi/ortak/salon.js) bayt bayt aynı olmalı
 * (kopya çiftleri site/build.mjs SENKRON_CIFTLERI'ne eklenir, derleme denetler).
 * Mezuniyet.exe (oyun/index.html) bu dosyayı KULLANMAZ: aynı davranışın kendi içindeki ilk sürümü orada kalır (bkz. YENI-OYUN.md).
 *
 * Sayfada önce şunlar yüklenmeli (oyun klasörüne göre):
 *   oylama/vote-core.js · oylama/qr.js · oylama/qr-svg.js · oylama/firebase-config.js · ortak/salon.js (+ ortak/salon.css)
 *
 * const salon = Salon.baslat({
 *   oyunAdi: 'Kod Mahkemesi',       // durum yazılarında
 *   anahtar: 'kod-mahkemesi',       // localStorage öneki: salon.<anahtar>.oturum / .ilerleme; oturum belgesinde "oyun"
 *   oylamaYolu: 'oylama/',          // firebase-source.js'in sayfaya göre yeri
 *   oyAdresi: 'https://cenga-mezuniyet.pages.dev',   // telefonların açacağı /v/ sayfasının kökü
 *   sahteSeyirci: 28,               // ?sahte=1'de sanal seyirci sayısı
 *   kumanda: { ileri(), geri(), duraklat(evetMi), ses(), oto(), kazan(i), bitir() },   // telefon kumandası komutları
 *   durum: () => ({ pos, toplam, faz, duraklat, oto, sessiz, kim, metin, karar:{q,o,c,kalan,acik}|null, sonraki }),
 *   sw: true, durumKutusu: true, tuslar: true,
 * });
 * await salon.hazir;                // → { kip, sid, oyUrl }
 * salon.kip      'canli' | 'sahte' | 'demo' | 'cevrimdisi' (bağlanırken 'baglaniyor')
 * salon.oylama   VoteSource: open({decKey,q,options,poll,durMs}), onUpdate(cb), forceWin(i), close({sonucEk}),
 *                pause(), resume(), updateSession(alanlar) — README'deki FirebaseSource ile aynı
 * salon.oyUrl    telefon oy adresi (çevrimdışı/demo: null) · salon.qrSvg(url?) → SVG metni
 * salon.demoOy(i) demo kipinde tek oyuncunun (uid 'sen') oyu · salon.benimOyum() → i | null
 * salon.durumYaz(metin, sinif, gizleMs) · salon.kayit.oku()/yaz(v)/sil() (12 saatlik ilerleme kaydı)
 * salon.kumandaTus(sifirla) (U / Shift+U ile aynı) · salon.tamEkran() · salon.odak(acik) (rozet/durum yazısını gizler)
 * Salon.sahneOlcekle(el, 1920, 1080) — sabit boyutlu sahneyi pencereye sığdırır.
 */
(function (kok) {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var SAATLIK = 12 * 3600e3;

  function ls(k) {
    return {
      oku: function (yas) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); if (!v || !(Date.now() - (+v.t || 0) < (yas || SAATLIK))) return null; return v; } catch (_) { return null; } },
      yaz: function (v) { try { v = Object.assign({}, v, { t: Date.now() }); localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
      sil: function () { try { localStorage.removeItem(k); } catch (_) {} },
    };
  }
  function rastgeleSid() { var a = 'abcdefghjkmnpqrstuvwxyz23456789', s = ''; for (var i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  var tamam = function () { return Promise.resolve({ ok: true, error: null }); };

  /* ---------- yerel oylama kaynakları: 'sahte' (sanal seyirci), 'demo' (tek oyuncu tıklar), 'cevrimdisi' (oy yok) ----------
   * FirebaseSource ile aynı arayüz ve aynı close() sonucu biçimi (kişi bazlı oylar dahil); oyun kodu kipe göre dallanmaz. */
  function yerelKaynak(kip, ayar) {
    var VC = kok.VoteCore, rng = Math.random, sid = rastgeleSid(), upCb = null, timer = null, cur = null, duraklat = false;
    var seyirci = [], taban = (ayar.oyAdresi || '').replace(/\/$/, '');
    var now = function () { return Date.now(); };
    // sanal seyirci: her biri her oylamada rastgele bir seçeneğe, kendi hızına göre oy verir
    if (kip === 'sahte') for (var k = 0, N = Math.max(0, ayar.sahteSeyirci | 0); k < N; k++) seyirci.push({ uid: 'sahte' + String(k).padStart(3, '0'), hiz: 0.12 + rng() * 0.6 });
    else if (kip === 'demo') {      // tek gerçek oyuncu ('sen', demoOy ile) + birkaç sanal seyirci
      seyirci.push({ uid: 'sen', insan: true });
      for (var j = 0; j < 3; j++) seyirci.push({ uid: 'sanal' + j, hiz: 0.25 + 0.25 * rng() });
    }
    function kalan() { return cur.paused ? cur.pausedLeftMs : Math.max(0, cur.closesAtMs - now()); }
    function sayim() { var c = []; for (var i = 0; i < cur.n; i++) c.push(0); cur.votes.forEach(function (v) { c[v.o]++; }); return c; }
    function emit() {
      if (!upCb || !cur) return;
      var c = sayim();
      try { upCb({ counts: c, total: c.reduce(function (a, b) { return a + b; }, 0), remainingMs: cur.result ? 0 : kalan(), error: kip === 'cevrimdisi' ? 'çevrimdışı' : null }); } catch (e) { console.warn('[salon] onUpdate', e); }
    }
    function uygula() {   // vakti gelen sanal oylar (yalnız süre içinde ve duraklatılmamışken)
      if (!cur || cur.result || cur.paused) return;
      var t = now();
      cur.plan.forEach(function (p) { if (!p.bitti && p.t <= t && p.t <= cur.closesAtMs) { p.bitti = true; cur.votes.set(p.uid, { o: p.o, atMs: p.t }); } });
    }
    function tick() { uygula(); emit(); }
    return {
      kip: kip,
      get sid() { return sid; },
      createSession: function () { return Promise.resolve(sid); },
      resumeSession: function (s) { sid = s; return Promise.resolve(s); },
      voteUrl: function (s) { return taban + '/v/?s=' + encodeURIComponent(s || sid); },
      onUpdate: function (fn) { upCb = fn; return function () { if (upCb === fn) upCb = null; }; },
      updateSession: tamam,
      open: function (o) {
        clearInterval(timer);
        var n = o.options.length, t0 = now(), d = o.durMs || 30000;
        cur = { decKey: o.decKey, n: n, durMs: d, openedAtMs: t0, closesAtMs: t0 + d, votes: new Map(), plan: [], forced: null,
          paused: duraklat, pausedLeftMs: duraklat ? d : null, pauses: [], pauseStart: duraklat ? t0 : null, result: null };
        if (kip !== 'cevrimdisi') seyirci.forEach(function (p) {
          if (p.insan || rng() < 0.07) return;                       // %7 oy vermez
          cur.plan.push({ uid: p.uid, o: Math.floor(rng() * n), t: t0 + d * Math.min(0.93, 0.05 + p.hiz * rng() * 1.2) });
        });
        timer = setInterval(tick, 100); emit();
        return tamam();
      },
      forceWin: function (i) {
        if (!cur || cur.result || cur.forced !== null || !(Number.isInteger(i) && i >= 0 && i < cur.n)) return;
        cur.forced = i;
        if (cur.paused) cur.pausedLeftMs = Math.min(cur.pausedLeftMs, 1500); else cur.closesAtMs = Math.min(cur.closesAtMs, now() + 1500);
        emit();
      },
      pause: function () {
        duraklat = true;
        if (cur && !cur.result && !cur.paused) { cur.pausedLeftMs = kalan(); cur.paused = true; cur.pauseStart = now(); emit(); }
        return tamam();
      },
      resume: function () {
        duraklat = false;
        if (cur && !cur.result && cur.paused) {
          var t = now(), fark = t - cur.pauseStart;
          cur.closesAtMs = t + cur.pausedLeftMs;
          cur.plan.forEach(function (p) { if (!p.bitti) p.t += fark; });
          cur.pauses.push([cur.pauseStart, t]); cur.pauseStart = null; cur.paused = false; cur.pausedLeftMs = null; emit();
        }
        return tamam();
      },
      close: function (opts) {
        if (!cur) return Promise.resolve({ counts: [], winner: null, forced: false, total: 0, votes: [], error: 'open cagrilmadi', errors: ['open cagrilmadi'] });
        if (cur.result) return Promise.resolve(cur.result);
        clearInterval(timer); timer = null; uygula();
        var c = sayim(), oylar = [];
        cur.votes.forEach(function (v, uid) { oylar.push({ uid: uid, o: v.o, atMs: v.atMs }); });
        var w = VC ? VC.pickWinner(c, { forced: cur.forced }) : (cur.forced !== null ? cur.forced : 0);
        var pauses = cur.pauses.slice(); if (cur.pauseStart !== null) pauses.push([cur.pauseStart, now()]);
        var base = { counts: c, winner: w, forced: cur.forced !== null, total: oylar.length, decKey: cur.decKey, votes: oylar,
          openedAtMs: cur.openedAtMs, closesAtMs: Math.min(cur.closesAtMs, now()), durMs: cur.durMs, pauses: pauses };
        var hatalar = kip === 'cevrimdisi' ? ['çevrimdışı: oy toplanmadı'] : [];
        if (opts && typeof opts.sonucEk === 'function') { try { opts.sonucEk(Object.assign({}, base)); } catch (e) { hatalar.push('sonuc eki: ' + e.message); } }
        cur.result = Object.assign(base, { error: hatalar[0] || null, errors: hatalar });
        emit();
        return Promise.resolve(cur.result);
      },
      demoOy: function (i) {
        if (kip !== 'demo' || !cur || cur.result || cur.paused || now() > cur.closesAtMs || !(Number.isInteger(i) && i >= 0 && i < cur.n)) return false;
        cur.votes.set('sen', { o: i, atMs: now() }); emit(); return true;
      },
      benimOyum: function () { var v = cur && cur.votes.get('sen'); return v ? v.o : null; },
      // kumanda yerel kiplerde yok (url null)
      createRemote: function () { return Promise.resolve({ secret: null, url: null }); },
      resumeRemote: function () { return Promise.resolve({ secret: null, url: null, paired: false }); },
      resetRemote: function () { return Promise.resolve({ secret: null, url: null }); },
      onRemoteCommand: function () { return function () {}; },
      onRemoteStatus: function () { return function () {}; },
      pushRemoteState: function () {},
      end: function () { return Promise.resolve(); },
    };
  }

  /* ---------- sahne ölçekleme ---------- */
  function sahneOlcekle(el, w, h) {
    w = w || 1920; h = h || 1080;
    el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.position = 'absolute'; el.style.left = '50%'; el.style.top = '50%';
    el.style.transformOrigin = '0 0';
    var sigdir = function () {
      var s = Math.min(innerWidth / w, innerHeight / h);
      el.style.transform = 'scale(' + s + ') translate(-50%,-50%)';
    };
    addEventListener('resize', sigdir); sigdir();
    return sigdir;
  }

  /* ---------- çevrimdışı önbellek (sw.js) + rozet · ?sw=0 kapatır; ?test=1'de kapalı (?sw=1 açar) ---------- */
  function swKaydet() {
    var SW = navigator.serviceWorker;
    if (!/^https?:$/.test(location.protocol) || !SW || Q.get('sw') === '0' || (Q.has('test') && Q.get('sw') !== '1')) return;
    var R = document.createElement('div'); R.id = 'swRozet'; document.body.appendChild(R);
    var onceden = !!SW.controller, indirdi = false, t = 0;
    var goster = function (m, c, sure) { R.textContent = m; R.className = 'on ' + (c || ''); clearTimeout(t); if (sure) t = setTimeout(function () { R.classList.remove('on'); }, sure); };
    var cevrimdisi = function () { goster('Çevrimdışı · önbellekten', '', 6000); };
    SW.addEventListener('message', function (e) {
      var m = e.data || {}; kok.SW_DURUM = m;
      if (m.t === 'ilerleme') {
        indirdi = true; var y = Math.floor(100 * (m.toplamBayt ? m.bayt / m.toplamBayt : m.bitti / m.toplam));
        goster((onceden ? 'Güncelleme indiriliyor… %' : 'Çevrimdışı için hazırlanıyor… %') + y + ' (' + m.bitti + '/' + m.toplam + ')');
      } else if (m.t === 'hazir') { if (m.cevrimdisi || !navigator.onLine) cevrimdisi(); else goster('✓ Çevrimdışı oynamaya hazır', 'ok', indirdi ? 6000 : 3500); }
      else if (m.t === 'guncelleme') goster('Güncelleme indirildi — sayfayı yenileyince geçerli', 'ok', 9000);
      else if (m.t === 'hata') { console.warn('[önbellek]', m.mesaj); goster(onceden ? '⚠ Güncelleme inemedi · önceki sürüm önbellekte' : '⚠ Çevrimdışı önbellek tamamlanamadı (internet?)', 'uy', 9000); }
    });
    SW.startMessages();
    addEventListener('offline', function () { if (SW.controller) cevrimdisi(); });
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) {}
    SW.register('sw.js', { scope: './', updateViaCache: 'none' })
      .then(function () { return SW.ready; }).then(function (r) { (SW.controller || r.active).postMessage({ t: 'kontrol' }); })
      .catch(function (e) { console.warn('[önbellek] service worker kaydedilemedi', e); });
  }

  /* ---------- telefon kumandası penceresi (U / Shift+U) ---------- */
  var DURUM_VARSAYILAN = { pos: 0, toplam: 0, faz: '', duraklat: false, oto: false, sessiz: false, kim: '', metin: '', karar: null, sonraki: '', devamSor: false };
  function kisalt(x, n) { x = String(x == null ? '' : x).replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1) + '…' : x; }
  function durumNormal(d) {
    var s = Object.assign({}, DURUM_VARSAYILAN, d || {});
    s.kim = kisalt(s.kim, 40); s.metin = kisalt(s.metin, 140); s.sonraki = kisalt(s.sonraki, 80);
    if (s.karar && Array.isArray(s.karar.o)) s.karar = { q: kisalt(s.karar.q, 140), o: s.karar.o.map(function (x) { return kisalt(x, 60); }), c: Array.isArray(s.karar.c) ? s.karar.c.slice() : [], kalan: Math.max(0, Math.ceil(+s.karar.kalan || 0)), acik: !!s.karar.acik };
    else s.karar = null;
    return s;
  }

  function baslat(ayar) {
    var o = Object.assign({ oyunAdi: 'Salon oyunu', anahtar: 'salon', oylamaYolu: 'oylama/', oyAdresi: 'https://cenga-mezuniyet.pages.dev',
      sahteSeyirci: 28, sw: true, durumKutusu: true, tuslar: true, kumanda: {}, durum: null }, ayar || {});
    var istenen = Q.has('sahte') || Q.has('test') ? 'sahte' : Q.has('demo') ? 'demo' : 'canli';
    var oturumK = ls('salon.' + o.anahtar + '.oturum');
    var S = { kip: istenen === 'canli' ? 'baglaniyor' : istenen, sid: null, oyUrl: null, oylama: null, kayit: ls('salon.' + o.anahtar + '.ilerleme') };

    // durum yazısı (sol alt)
    var D = null, dT = 0;
    if (o.durumKutusu) { D = document.createElement('div'); D.id = 'salonDurum'; D.textContent = 'Oylama bağlanıyor…'; document.body.appendChild(D); }
    S.durumYaz = function (m, c, gizleMs) {
      if (!D) return; D.textContent = m; D.className = c || ''; clearTimeout(dT);
      if (gizleMs) dT = setTimeout(function () { D.classList.add('gizle'); }, gizleMs);
    };
    S.odak = function (acik) { document.body.classList.toggle('salon-odak', !!acik); };
    S.qrSvg = function (url) {
      url = url || S.oyUrl; if (!url) return '';
      try { return kok.QrSvg.qrSvg(url); } catch (e) { console.warn('[salon] QR çizilemedi', e); return ''; }
    };
    S.demoOy = function (i) { return !!(S.oylama && S.oylama.demoOy && S.oylama.demoOy(i)); };
    S.benimOyum = function () { return S.oylama && S.oylama.benimOyum ? S.oylama.benimOyum() : null; };
    S.tamEkran = function () {
      var d = document, el = d.documentElement;
      try { if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { var r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(function () {}); } } catch (_) {}
    };
    function yereleGec(kip) { var src = yerelKaynak(kip, o); S.oylama = src; S.kip = kip; return src.createSession(); }

    // ---- telefon kumandası ----
    var K = null, kumOv = false, kumQr = '', kumGizleT = null, OV = null;
    function kumandaCiz() {
      if (!OV) {
        if (!kumOv) return;
        OV = document.createElement('div'); OV.id = 'salonKumanda';
        OV.innerHTML = '<div class="kq"></div><div class="kt"><b>Kumandayı telefonla okut · yalnızca sunucu için</b><span class="kd">Bekleniyor…</span><small>U: kapat · Shift+U: sıfırla (yeni QR, eski telefon düşer)</small></div>';
        document.body.appendChild(OV);
      }
      OV.classList.toggle('on', kumOv); if (!kumOv) return;
      var q = OV.querySelector('.kq'), s = OV.querySelector('.kd');
      if (!K) { q.innerHTML = ''; kumQr = ''; s.textContent = S.kip === 'baglaniyor' ? 'Bağlantı bekleniyor…' : 'Kumanda için canlı bağlantı gerekli (çevrimdışı, sahte ya da demo kip).'; s.className = 'kd off'; return; }
      if (!K.url) { q.innerHTML = ''; kumQr = ''; }
      else if (K.url !== kumQr) { q.innerHTML = S.qrSvg(K.url); kumQr = K.url; }
      s.textContent = K.hata ? 'Kumanda açılamadı: ' + K.hata : !K.url ? 'Hazırlanıyor…' : K.eslesti ? '✓ Kumanda bağlandı' : 'Bekleniyor…';
      s.className = 'kd' + (K.hata ? ' off' : K.eslesti && K.url ? ' ok' : '');
      if (K.eslesti && K.url && !kumGizleT) kumGizleT = setTimeout(function () { kumGizleT = null; if (K && K.eslesti) { kumOv = false; kumandaCiz(); } }, 1800);
    }
    S.kumandaTus = function (sifirla) {
      clearTimeout(kumGizleT); kumGizleT = null;
      if (sifirla) { kumOv = true; if (K) K.sifirla(); } else { kumOv = !kumOv; if (kumOv && K) K.hazirla(); }
      kumandaCiz();
    };
    function komut(c, a) {
      var h = o.kumanda || {};
      try {
        if (c === 'devam' && !h.devam) { if (h.duraklat) h.duraklat(false); }
        else if (c === 'duraklat') { if (h.duraklat) h.duraklat(true); }
        else if (typeof h[c] === 'function') h[c](a);
      } catch (e) { console.warn('[kumanda] komut işlenemedi', c, e); }
      itele();
    }
    function itele() { if (K && K.url && typeof o.durum === 'function') try { S.oylama.pushRemoteState(durumNormal(o.durum())); } catch (_) {} }
    S.kumandaDurum = function () { return typeof o.durum === 'function' ? durumNormal(o.durum()) : durumNormal({}); };
    function kumandaKur(src, kayit, surdu) {
      K = { url: null, eslesti: false, hata: null, _p: null };
      var yenile = kumandaCiz;
      var bitti = function (r) { kayit.r = r.secret; oturumK.yaz(kayit); K.url = r.url; K.hata = null; yenile(); };
      var hata = function (e) { K.hata = String((e && e.message) || e); console.warn('[kumanda]', K.hata); yenile(); };
      var sirala = function (f) { var p = (K._p || Promise.resolve()).catch(function () {}).then(f).then(bitti, hata); K._p = p; p.finally(function () { if (K._p === p) K._p = null; }); return p; };
      K.hazirla = function () { if (K.url && !K.hata) return Promise.resolve(); if (K._p) return K._p; K.hata = null; return sirala(function () { return src.createRemote(); }); };
      K.sifirla = function () { K.url = null; K.eslesti = false; K.hata = null; yenile(); return sirala(function () { return src.resetRemote(); }); };
      src.onRemoteStatus(function (s) { K.eslesti = !!(s && s.paired); yenile(); });
      src.onRemoteCommand(function (m) { komut(m.c, m.a); });
      if (surdu && kayit.r) src.resumeRemote(kayit.r).then(function (r) { K.url = r.url; K.eslesti = !!r.paired; yenile(); }, function (e) { console.warn('[kumanda] sürdürülemedi', e && e.message); });
      setInterval(itele, 500);
      kumandaCiz();
    }
    if (o.tuslar) addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'u' || e.key === 'U') { e.preventDefault(); S.kumandaTus(e.shiftKey); }
    });

    // ---- bağlantı ----
    var oturumEk = { oyun: o.anahtar };
    S.hazir = (async function () {
      if (istenen === 'sahte') { await yereleGec('sahte'); S.durumYaz('Sahte oylama (deneme kipi) · sanal seyirci', 'off', 8000); }
      else if (istenen === 'demo') { await yereleGec('demo'); if (D) D.style.display = 'none'; }
      else {
        try {
          if (!kok.FIREBASE_CONFIG) throw new Error('firebase-config.js yüklenmedi');
          var mod = await import(new URL(o.oylamaYolu + 'firebase-source.js', document.baseURI).href);
          var src = await mod.connectFirebaseSource(kok.FIREBASE_CONFIG, { voteBaseUrl: o.oyAdresi });
          var kayit = oturumK.oku(), sid = null, surdu = false;
          if (!Q.has('yeni') && kayit && typeof kayit.sid === 'string') {
            try { sid = await src.resumeSession(kayit.sid); surdu = true; src.updateSession(oturumEk); }
            catch (e) { console.warn('[salon] eski oturum sürdürülemedi, yenisi açılıyor:', e && e.message); }
          }
          if (!sid) { sid = await src.createSession(oturumEk); kayit = { sid: sid, r: null }; }
          oturumK.yaz(kayit);
          S.oylama = src; S.kip = 'canli';
          S.durumYaz((surdu ? '● Oturum sürdürüldü (aynı QR)' : '● Canlı oylama hazır') + ' · oturum ' + sid, 'ok', 15000);
          kumandaKur(src, kayit, surdu);
        } catch (e) {
          console.warn('[salon] oylama bağlanamadı, çevrimdışı kipe geçildi:', e && e.message || e);
          await yereleGec('cevrimdisi');
          S.durumYaz('Çevrimdışı: oylama yok (internet?) · bağlanınca F5', 'off');
        }
      }
      S.sid = S.oylama.sid || (await S.oylama.createSession());
      S.oyUrl = S.kip === 'canli' || S.kip === 'sahte' ? S.oylama.voteUrl(S.sid) : null;
      if (kumOv) kumandaCiz();
      return { kip: S.kip, sid: S.sid, oyUrl: S.oyUrl };
    })();

    if (o.sw) swKaydet();
    return S;
  }

  kok.Salon = { baslat: baslat, sahneOlcekle: sahneOlcekle, yerelKaynak: yerelKaynak, durumNormal: durumNormal, surum: 1 };
})(window);
