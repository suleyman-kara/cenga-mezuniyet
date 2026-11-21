// FirebaseSource (host tarafi). VoteSource arayuzu: createSession, resumeSession, open, onUpdate, forceWin, close, voteUrl.
// Telefon kumandasi: createRemote, resumeRemote, resetRemote, onRemoteCommand, onRemoteStatus, pushRemoteState.
// Bagimliliklar enjekte edilir (test: npm "firebase" paketi / sahte; tarayici: connectFirebaseSource ile CDN modulleri).
const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
const SECRET_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const REMOTE_CMDS = ['ileri', 'geri', 'duraklat', 'devam', 'kazan', 'bitir', 'ses', 'oto']; // firestore.rules ile ayni liste
const CMD_MAX_AGE_MS = 15000; // bundan eski kumanda komutlari (sunucu saatiyle) uygulanmaz

// Kumanda gizli kimligi: tahmin edilemez olmali (bilen kumandayi eslestirebilir). crypto varsa onu kullanir.
function randomSecret(len, rng) {
  const c = globalThis.crypto;
  let out = '';
  while (out.length < len) {
    if (c && typeof c.getRandomValues === 'function') {
      const b = c.getRandomValues(new Uint8Array(len * 2));
      for (const x of b) if (x < 248 && out.length < len) out += SECRET_ALPHA[x % 62]; // 248 = 62*4: esit dagilim
    } else out += SECRET_ALPHA[Math.floor(rng() * 62)];
  }
  return out;
}
const validSecret = (s) => typeof s === 'string' && /^[A-Za-z0-9]{20,64}$/.test(s);
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
  const remoteThrottleMs = deps.remoteThrottleMs ?? 1000; // kumandaya durum yazimi: saniyede ~1

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

  // Sunucu saat farki: openedAt (serverTimestamp) yazildiktan sonra okunur; t0/t1 yazmanin basi/sonu.
  async function measureOffset(id, t0, t1) {
    const g = await guard(fs.getDoc(fs.doc(db, 'sessions', id)), writeTimeoutMs, 'saat olcumu');
    if (g.ok && g.value.exists()) {
      const o = g.value.data().openedAt;
      const ms = o && typeof o.toMillis === 'function' ? o.toMillis() : null;
      if (ms !== null) offsetMs = Math.round(ms - (t0 + t1) / 2);
    } else rec(g.error);
  }

  // ---- Telefon kumandasi: sessions/{sid}/remotes/{secret} (+ /cmds) ----
  let rem = null, cmdCb = null, statusCb = null;
  const push = { last: 0, timer: null, pending: undefined, lastJson: null };
  const remRef = (s) => fs.doc(db, 'sessions', sid, 'remotes', s);
  const cmdsRef = (s) => fs.collection(db, 'sessions', sid, 'remotes', s, 'cmds');
  const remoteUrl = (s) => `${base}/k/?s=${encodeURIComponent(sid)}&r=${encodeURIComponent(s)}`;
  const errText = (label, e) => `${label}: ${e && e.code ? e.code + ' ' : ''}${(e && e.message) || e}`;

  function detachRemote() {
    if (!rem) return;
    rem.unsubs.forEach((u) => { try { u(); } catch (_) {} });
    rem = null;
  }
  function tellStatus(my) { if (statusCb && rem === my) { try { statusCb({ paired: !!my.owner, owner: my.owner }); } catch (_) {} } }
  function handleCmds(my, snap) {
    const serverNow = now() + offsetMs, fresh = [];
    snap.docs.forEach((d) => {
      if (my.handled.has(d.id)) return; // asla iki kez
      my.handled.add(d.id);
      let v = null; try { v = d.data({ serverTimestamps: 'estimate' }); } catch (_) {}
      const at = v && v.at && typeof v.at.toMillis === 'function' ? v.at.toMillis() : null;
      if (v && typeof v.c === 'string' && at !== null && serverNow - at <= CMD_MAX_AGE_MS) fresh.push({ id: d.id, c: v.c, a: Number.isInteger(v.a) ? v.a : undefined, at });
      guard(fs.deleteDoc(fs.doc(db, 'sessions', sid, 'remotes', my.secret, 'cmds', d.id)), writeTimeoutMs, 'komut silme').then((r) => { if (!r.ok) rec(r.error); });
    });
    fresh.sort((x, y) => x.at - y.at).forEach((x) => {
      if (!cmdCb || rem !== my) return;
      try { cmdCb({ c: x.c, a: x.a, id: x.id }); } catch (e) { rec(errText('kumanda komutu', e)); }
    });
  }
  function attachRemote(secret, owner) {
    detachRemote();
    const my = { secret, owner: owner || null, handled: new Set(), unsubs: [] };
    rem = my; push.lastJson = null;
    try {
      my.unsubs.push(fs.onSnapshot(remRef(secret), (snap) => {
        if (rem !== my) return;
        const d = snap.exists() ? snap.data() : null;
        my.owner = (d && d.owner) || null; tellStatus(my);
      }, (e) => rec(errText('kumanda dinleme', e))));
    } catch (e) { rec(errText('kumanda dinleme', e)); }
    try {
      my.unsubs.push(fs.onSnapshot(cmdsRef(secret), (snap) => { if (rem === my) handleCmds(my, snap); }, (e) => rec(errText('komut dinleme', e))));
    } catch (e) { rec(errText('komut dinleme', e)); }
    if (push.pending !== undefined) schedulePush();
    return my;
  }
  async function createRemoteDoc(secret) {
    if (!sid) throw new Error('once createSession() / resumeSession() cagirin');
    const w = await guard(fs.setDoc(remRef(secret), { owner: null, st: null, createdAt: fs.serverTimestamp() }), writeTimeoutMs, 'kumanda olusturma');
    if (!w.ok) throw new Error(rec(w.error));
  }
  async function createRemote() {
    const secret = randomSecret(24, rng);
    await createRemoteDoc(secret);
    attachRemote(secret, null);
    return { secret, url: remoteUrl(secret) };
  }
  function schedulePush() {
    if (push.timer) return;
    push.timer = setTimeout(flushPush, Math.max(0, push.last + remoteThrottleMs - Date.now()));
  }
  function flushPush() {
    push.timer = null;
    try {
      if (!rem || push.pending === undefined) return; // remote acilinca attachRemote yeniden planlar
      const my = rem, j = JSON.stringify(push.pending);
      push.pending = undefined;
      if (j === undefined || j === push.lastJson) return;
      push.lastJson = j; push.last = Date.now();
      guard(fs.updateDoc(remRef(my.secret), { st: JSON.parse(j) }), writeTimeoutMs, 'kumanda durumu').then((r) => {
        if (!r.ok) { rec(r.error); if (rem === my && push.lastJson === j) push.lastJson = null; }
      });
    } catch (e) { rec(errText('kumanda durumu', e)); }
  }

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
      stop(); detachRemote(); cur = null; isPaused = false;
      sid = id;
      // Sunucu saati ile yerel saat farki (host closesAt'i sunucu saatine gore yazar).
      await measureOffset(id, t0, now());
      return id;
    },

    // Sayfa yenilendi/coktu: ayni anonim uid (Firebase IndexedDB'de saklar) ile var olan oturuma geri baglan.
    // Yalnizca hostUid == uid ve phase != 'ended' ise kabul eder; aksi halde reddeder (cagiran createSession'a duser).
    // Oturum 'lobby'ye sifirlanir: acik oylama varsa telefonlar beklemeye gecer, motor karari yeniden acar.
    async resumeSession(id) {
      errors = [];
      if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error('gecersiz oturum kimligi');
      const a = await guard(fs.signInAnonymously(auth), writeTimeoutMs, 'anonim giris');
      if (!a.ok) throw new Error(a.error);
      const me = (auth.currentUser && auth.currentUser.uid) || (a.value && a.value.user && a.value.user.uid);
      const g = await guard(fs.getDoc(fs.doc(db, 'sessions', id)), writeTimeoutMs, 'oturum okuma');
      if (!g.ok) throw new Error(g.error);
      if (!g.value.exists()) throw new Error('oturum bulunamadi');
      const d = g.value.data();
      if (!me || d.hostUid !== me) throw new Error('oturum baska bir host a ait');
      if (d.phase === 'ended') throw new Error('oturum bitmis (ended)');
      const t0 = now();
      const w = await guard(fs.updateDoc(fs.doc(db, 'sessions', id), {
        phase: 'lobby', decKey: null, q: '', options: [], n: 0, poll: false, openedAt: fs.serverTimestamp(),
        closesAt: null, winner: null, counts: null, forced: false, paused: false, pausedLeftMs: null,
      }), writeTimeoutMs, 'oturum surdurme');
      if (!w.ok) throw new Error(w.error);
      stop(); detachRemote(); cur = null; isPaused = false;
      uid = me; sid = id;
      await measureOffset(id, t0, now());
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

    // ---- Telefon kumandasi ----
    // Yeni kumanda: gizli kimlik (24 karakter) + belge {owner:null, st:null}. -> { secret, url }
    createRemote() { return createRemote(); },
    // Kayitli gizli kimlikle devam (sayfa yenilendi): belge varsa eslesme korunur, yoksa ayni kimlikle olusturulur.
    async resumeRemote(secret) {
      if (!validSecret(secret)) throw new Error('gecersiz kumanda kimligi');
      if (!sid) throw new Error('once createSession() / resumeSession() cagirin');
      const g = await guard(fs.getDoc(remRef(secret)), writeTimeoutMs, 'kumanda okuma');
      if (!g.ok) throw new Error(rec(g.error));
      let owner = null;
      if (g.value.exists()) owner = g.value.data().owner || null; else await createRemoteDoc(secret);
      attachRemote(secret, owner);
      return { secret, url: remoteUrl(secret), paired: !!owner };
    },
    // Kumandayi sifirla: eski belge (ve bekleyen komutlari) silinir -> eski telefonun eslesmesi biter; yeni kimlik doner.
    async resetRemote() {
      const old = rem && rem.secret;
      detachRemote();
      if (old && sid) {
        const g = await guard(fs.getDocs(cmdsRef(old)), writeTimeoutMs, 'eski komutlar');
        if (g.ok) await Promise.all(g.value.docs.map((d) => guard(fs.deleteDoc(fs.doc(db, 'sessions', sid, 'remotes', old, 'cmds', d.id)), writeTimeoutMs, 'komut silme')));
        const r = await guard(fs.deleteDoc(remRef(old)), writeTimeoutMs, 'eski kumanda silme');
        if (!r.ok) rec(r.error);
      }
      return createRemote();
    },
    // cb({c, a, id}): her komut en fazla bir kez; 15 sn den eskiler atlanir; islenen belge silinir.
    onRemoteCommand(fn) { cmdCb = fn; return () => { if (cmdCb === fn) cmdCb = null; }; },
    // cb({paired, owner}): eslesme durumu degisince (ve remote acilinca).
    onRemoteStatus(fn) { statusCb = fn; if (rem) tellStatus(rem); return () => { if (statusCb === fn) statusCb = null; }; },
    // Kumandaya durum goruntusu. Kisitli (~1/sn), en son cagri kazanir, ayni durum yeniden yazilmaz, asla firlatmaz.
    pushRemoteState(st) {
      try { if (st === undefined) return; push.pending = st; if (rem) schedulePush(); } catch (_) { /* asla firlatma */ }
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
  const fsDeps = { doc: F.doc, collection: F.collection, setDoc: F.setDoc, updateDoc: F.updateDoc, deleteDoc: F.deleteDoc, getDoc: F.getDoc, getDocs: F.getDocs, onSnapshot: F.onSnapshot, serverTimestamp: F.serverTimestamp, Timestamp: F.Timestamp, signInAnonymously };
  return createFirebaseSource({
    db: F.getFirestore(app), auth: getAuth(app), fs: fsDeps, VoteCore: opts.VoteCore || globalThis.VoteCore,
    voteBaseUrl: opts.voteBaseUrl || `https://${config.projectId}.web.app`, ...opts.sourceOptions,
  });
}
