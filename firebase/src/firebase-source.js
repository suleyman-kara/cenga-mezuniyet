// FirebaseSource (host tarafi). VoteSource arayuzu: createSession, open, onUpdate, forceWin, close, voteUrl.
// Bagimliliklar enjekte edilir (test: npm "firebase" paketi / sahte; tarayici: connectFirebaseSource ile CDN modulleri).
const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
export const DEFAULT_SDK_VERSION = '12.19.0'; // npm'de test edilen surum; CDN'de dosyanin var oldugunu deploy oncesi kontrol edin.

// Promise'i zaman asimiyla sarar; asla reddetmez ve asla sonsuza beklemez.
function guard(promise, ms, label) {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => { if (!done) { done = true; resolve({ ok: false, error: `${label}: zaman asimi (${ms} ms)` }); } }, ms);
    Promise.resolve(promise).then(
      (value) => { if (!done) { done = true; clearTimeout(t); resolve({ ok: true, value }); } },
      (e) => { if (!done) { done = true; clearTimeout(t); resolve({ ok: false, error: `${label}: ${e && e.code ? e.code + ' ' : ''}${(e && e.message) || e}` }); } },
    );
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createFirebaseSource(deps) {
  const { db, auth, fs } = deps;
  const VC = deps.VoteCore || globalThis.VoteCore;
  const rng = deps.rng || Math.random;
  const now = deps.now || Date.now;
  const settleMs = deps.settleMs ?? 1200;          // close(): gec ulasan son oylari beklemek icin
  const tickMs = deps.tickMs ?? 250;
  const writeTimeoutMs = deps.writeTimeoutMs ?? 3000;
  const finalFetchTimeoutMs = deps.finalFetchTimeoutMs ?? 2500;
  const base = (deps.voteBaseUrl || '').replace(/\/$/, '');

  let sid = null, uid = null, offsetMs = 0, cb = null, timer = null, cur = null, errors = [], isPaused = false;
  const rec = (e) => { if (e) errors.push(e); return e; };
  const sessRef = () => fs.doc(db, 'sessions', sid);
  const votesRef = () => fs.collection(db, 'sessions', sid, 'votes');
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  function votesFrom(docs, decKey) {
    const prefix = decKey + '__', out = [];
    docs.forEach((d) => { if (d.id.startsWith(prefix)) { const v = d.data({ serverTimestamps: 'estimate' }); out.push({ o: v.o, at: v.at }); } });
    return out;
  }
  function emit() {
    if (!cb || !cur) return;
    const counts = VC.tally(cur.votes, cur.n, cur.closesAtMs);
    cb({ counts, total: sum(counts), remainingMs: cur.paused ? cur.pausedLeftMs : VC.remainingMs(cur.closesAtMs, now(), offsetMs), error: errors.length ? errors[errors.length - 1] : null });
  }
  function stop() { clearInterval(timer); timer = null; if (cur && cur.unsub) { try { cur.unsub(); } catch (_) {} cur.unsub = null; } }

  return {
    get sid() { return sid; },
    get errors() { return errors.slice(); },

    async createSession() {
      errors = [];
      const a = await guard(fs.signInAnonymously(auth), writeTimeoutMs, 'anonim giris');
      if (!a.ok) throw new Error(a.error);
      uid = (auth.currentUser && auth.currentUser.uid) || (a.value && a.value.user && a.value.user.uid);
      let id = ''; for (let i = 0; i < 6; i++) id += ALPHA[Math.floor(rng() * ALPHA.length)];
      const t0 = now();
      const w = await guard(fs.setDoc(fs.doc(db, 'sessions', id), {
        hostUid: uid, phase: 'lobby', decKey: null, q: '', options: [], n: 0, poll: false,
        openedAt: fs.serverTimestamp(), closesAt: null, winner: null, counts: null, forced: false, paused: false,
      }), writeTimeoutMs, 'oturum olusturma');
      if (!w.ok) throw new Error(w.error);
      sid = id;
      const t1 = now();
      // Sunucu saati ile yerel saat farki (host closesAt'i sunucu saatine gore yazar).
      const g = await guard(fs.getDoc(fs.doc(db, 'sessions', id)), writeTimeoutMs, 'saat olcumu');
      if (g.ok && g.value.exists()) {
        const o = g.value.data().openedAt;
        const ms = o && typeof o.toMillis === 'function' ? o.toMillis() : null;
        if (ms !== null) offsetMs = Math.round(ms - (t0 + t1) / 2);
      } else rec(g.error);
      return id;
    },

    voteUrl(s) { return `${base}/v/?s=${encodeURIComponent(s || sid)}`; },

    onUpdate(fn) { cb = fn; return () => { if (cb === fn) cb = null; }; },

    // Beklenmemeli (await etmeyin): yazma ag yoksa zaman asimina kadar surebilir; sayac yerel olarak hemen baslar.
    open({ decKey, q, options, poll, durMs }) {
      if (!sid) throw new Error('once createSession() cagirin');
      if (!decKey || /__|\//.test(decKey)) throw new Error('gecersiz decKey');
      stop(); errors = [];
      const n = options.length;
      const closesAtMs = now() + offsetMs + (durMs || 30000);
      cur = { decKey, n, closesAtMs, forced: null, votes: [], unsub: null, result: null, paused: isPaused, pausedLeftMs: isPaused ? (durMs || 30000) : null };
      try {
        cur.unsub = fs.onSnapshot(votesRef(), (snap) => { cur.votes = votesFrom(snap.docs, decKey); emit(); }, (e) => rec(`oy dinleme: ${e && e.code ? e.code + ' ' : ''}${(e && e.message) || e}`));
      } catch (e) { rec(`oy dinleme: ${e.message}`); }
      timer = setInterval(emit, tickMs); emit();
      return guard(fs.updateDoc(sessRef(), {
        phase: 'vote', decKey, q, options, n, poll: !!poll, openedAt: fs.serverTimestamp(),
        closesAt: fs.Timestamp.fromMillis(closesAtMs), winner: null, counts: null, forced: false,
        paused: isPaused, pausedLeftMs: isPaused ? cur.pausedLeftMs : null,
      }), writeTimeoutMs, 'karar acma').then((r) => ({ ok: r.ok, error: r.ok ? null : rec(r.error) }));
    },

    forceWin(i) {
      if (!cur || cur.result || cur.forced !== null || !Number.isInteger(i) || i < 0 || i >= cur.n) return;
      cur.forced = i;
      if (cur.paused) { // duraklatilmisken: kalan sure kisalir, closesAt resume'da hesaplanir
        cur.pausedLeftMs = Math.min(cur.pausedLeftMs, 1500);
        guard(fs.updateDoc(sessRef(), { pausedLeftMs: cur.pausedLeftMs }), writeTimeoutMs, 'sure kisaltma').then((r) => { if (!r.ok) rec(r.error); });
        emit(); return;
      }
      cur.closesAtMs = Math.min(cur.closesAtMs, now() + offsetMs + 1500);
      guard(fs.updateDoc(sessRef(), { closesAt: fs.Timestamp.fromMillis(cur.closesAtMs) }), writeTimeoutMs, 'sure kisaltma').then((r) => { if (!r.ok) rec(r.error); });
      emit();
    },

    // Oyun duraklatildi (P). Karar aciksa kalan sure korunur; telefonlar da durur. Asla reddetmez: Promise<{ok,error}>.
    pause() {
      if (!sid || isPaused) return Promise.resolve({ ok: true, error: null });
      isPaused = true;
      const data = { paused: true };
      if (cur && !cur.result && !cur.paused) {
        cur.pausedLeftMs = VC.remainingMs(cur.closesAtMs, now(), offsetMs); cur.paused = true;
        data.pausedLeftMs = cur.pausedLeftMs; emit();
      }
      return guard(fs.updateDoc(sessRef(), data), writeTimeoutMs, 'duraklatma').then((r) => ({ ok: r.ok, error: r.ok ? null : rec(r.error) }));
    },

    // Devam: closesAt = simdi (sunucu saatine gore) + kalan sure.
    resume() {
      if (!sid || !isPaused) return Promise.resolve({ ok: true, error: null });
      isPaused = false;
      const data = { paused: false };
      if (cur && !cur.result && cur.paused) {
        cur.closesAtMs = now() + offsetMs + cur.pausedLeftMs; cur.paused = false; cur.pausedLeftMs = null;
        data.closesAt = fs.Timestamp.fromMillis(cur.closesAtMs); data.pausedLeftMs = null; emit();
      }
      return guard(fs.updateDoc(sessRef(), data), writeTimeoutMs, 'devam').then((r) => ({ ok: r.ok, error: r.ok ? null : rec(r.error) }));
    },

    // Her durumda cozulur: { counts, winner, forced, total, error, errors }
    async close() {
      if (!cur) return { counts: [], winner: null, forced: false, total: 0, error: rec('open cagrilmadi'), errors: errors.slice() };
      if (cur.result) return cur.result;
      const c = cur;
      stop();
      let counts = new Array(c.n).fill(0), winner;
      try {
        await sleep(settleMs);
        let votes = c.votes;
        const f = await guard(fs.getDocs(votesRef()), finalFetchTimeoutMs, 'son oy okuma');
        if (f.ok) votes = votesFrom(f.value.docs, c.decKey); else rec(f.error);
        counts = VC.tally(votes, c.n, c.closesAtMs);
      } catch (e) { rec(`sayim: ${e.message}`); }
      try { winner = VC.pickWinner(counts, { forced: c.forced, rng }); } catch (e) { rec(`kazanan: ${e.message}`); winner = Math.floor(rng() * Math.max(1, c.n)); }
      const w = await guard(fs.updateDoc(sessRef(), { phase: 'result', winner, counts, forced: c.forced !== null }), writeTimeoutMs, 'sonuc yazma');
      if (!w.ok) rec(w.error);
      c.result = { counts, winner, forced: c.forced !== null, total: sum(counts), error: errors.length ? errors[0] : null, errors: errors.slice() };
      return c.result;
    },

    async end() { stop(); if (!sid) return; const r = await guard(fs.updateDoc(sessRef(), { phase: 'ended' }), writeTimeoutMs, 'oturum kapatma'); if (!r.ok) rec(r.error); },
  };
}

// Tarayici: CDN modüler SDK ile baglan. config = firebase-config.js icindeki firebaseConfig.
export async function connectFirebaseSource(config, opts = {}) {
  const v = opts.sdkVersion || DEFAULT_SDK_VERSION;
  const u = (m) => `https://www.gstatic.com/firebasejs/${v}/firebase-${m}.js`;
  const [{ initializeApp }, { getAuth, signInAnonymously }, F] = await Promise.all([import(u('app')), import(u('auth')), import(u('firestore'))]);
  const app = initializeApp(config);
  const fsDeps = { doc: F.doc, collection: F.collection, setDoc: F.setDoc, updateDoc: F.updateDoc, getDoc: F.getDoc, getDocs: F.getDocs, onSnapshot: F.onSnapshot, serverTimestamp: F.serverTimestamp, Timestamp: F.Timestamp, signInAnonymously };
  return createFirebaseSource({
    db: F.getFirestore(app), auth: getAuth(app), fs: fsDeps, VoteCore: opts.VoteCore || globalThis.VoteCore,
    voteBaseUrl: opts.voteBaseUrl || `https://${config.projectId}.web.app`, ...opts.sourceOptions,
  });
}
