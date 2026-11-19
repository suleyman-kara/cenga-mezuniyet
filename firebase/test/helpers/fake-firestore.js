// Bellek ici SAHTE Firestore. Kurallari UYGULAMAZ; yalnizca istemci (VoteSource) mantigini
// emulator olmadan sinamak icindir. Kural dogrulamasi yerine GECMEZ.
export class FakeTimestamp {
  constructor(ms) { this.ms = ms; }
  toMillis() { return this.ms; }
  static fromMillis(ms) { return new FakeTimestamp(ms); }
  static now() { return new FakeTimestamp(Date.now()); }
}
const SERVER_TS = { __serverTimestamp: true };

export class FakeBackend {
  constructor() { this.docs = new Map(); this.listeners = new Set(); this.offline = false; this.failGetDocs = false; this.failWritesTo = null; this.serverSkewMs = 0; this.uidSeq = 0; }
  now() { return Date.now() + this.serverSkewMs; }
  resolve(data) { const o = {}; for (const [k, v] of Object.entries(data)) o[k] = v === SERVER_TS ? new FakeTimestamp(this.now()) : v; return o; }
  notify() { for (const l of [...this.listeners]) l(); }
  client(uid) {
    const be = this; uid = uid || `u${++be.uidSeq}`;
    const db = { be, uid };
    const auth = { currentUser: null };
    const mkDoc = (path, id) => ({ type: 'doc', path, id });
    const snapOf = (path) => { const d = be.docs.get(path); return { id: path.split('/').pop(), exists: () => !!d, data: () => (d ? { ...d } : undefined) }; };
    const childrenOf = (path) => [...be.docs.keys()].filter((k) => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/'));
    const collSnap = (path) => { const docs = childrenOf(path).map((k) => snapOf(k)); return { docs, size: docs.length, forEach: (f) => docs.forEach(f) }; };
    const pending = () => new Promise(() => {});
    const write = (path, fn) => {
      if (be.offline) return pending();
      if (be.failWritesTo && path.includes(be.failWritesTo)) return Promise.reject(Object.assign(new Error('permission-denied (fake)'), { code: 'permission-denied' }));
      return Promise.resolve().then(() => { fn(); be.notify(); });
    };
    const fs = {
      doc: (_db, ...segs) => { const path = segs.join('/'); return mkDoc(path, segs[segs.length - 1]); },
      collection: (_db, ...segs) => ({ type: 'collection', path: segs.join('/') }),
      serverTimestamp: () => SERVER_TS,
      Timestamp: FakeTimestamp,
      signInAnonymously: async () => { auth.currentUser = { uid }; return { user: auth.currentUser }; },
      setDoc: (ref, data) => write(ref.path, () => be.docs.set(ref.path, be.resolve(data))),
      updateDoc: (ref, data) => write(ref.path, () => { if (!be.docs.has(ref.path)) throw new Error('not-found'); be.docs.set(ref.path, { ...be.docs.get(ref.path), ...be.resolve(data) }); }),
      getDoc: async (ref) => { if (be.offline) throw new Error('unavailable (fake offline)'); return snapOf(ref.path); },
      getDocs: async (ref) => { if (be.offline || be.failGetDocs) throw new Error('unavailable (fake)'); return collSnap(ref.path); },
      onSnapshot: (ref, cb) => {
        const fire = () => { if (be.offline) return; cb(ref.type === 'doc' ? snapOf(ref.path) : collSnap(ref.path)); };
        be.listeners.add(fire); queueMicrotask(fire); return () => be.listeners.delete(fire);
      },
    };
    return { db, auth, fs, uid };
  }
}
