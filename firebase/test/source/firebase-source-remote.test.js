// resumeSession + telefon kumandasi (remotes) - SAHTE (bellek ici) Firestore. Kurallar burada dogrulanmaz (bkz. test/rules).
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import { FakeBackend, FakeTimestamp } from '../helpers/fake-firestore.js';
import { createFirebaseSource } from '../../src/firebase-source.js';
const VoteCore = createRequire(import.meta.url)('../../vote-core.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let be;
const mk = (uid = 'hostU', extra = {}) => {
  const c = be.client(uid);
  return { c, src: createFirebaseSource({ db: c.db, auth: c.auth, fs: c.fs, VoteCore, settleMs: 20, tickMs: 20, writeTimeoutMs: 150, finalFetchTimeoutMs: 150, remoteThrottleMs: 60, voteBaseUrl: 'https://demo.web.app', ...extra }) };
};
const sess = (sid) => be.docs.get(`sessions/${sid}`);
const remote = (sid, r) => be.docs.get(`sessions/${sid}/remotes/${r}`);
const cmdKeys = (sid, r) => [...be.docs.keys()].filter((k) => k.startsWith(`sessions/${sid}/remotes/${r}/cmds/`));
// Telefon tarafi: ayri istemci (uid) olarak komut yazar.
const phone = async (uid = 'tel1') => { const p = be.client(uid); await p.fs.signInAnonymously(); return p; };
const sendCmd = (p, sid, r, data) => p.fs.addDoc(p.fs.collection(p.db, 'sessions', sid, 'remotes', r, 'cmds'), { at: p.fs.serverTimestamp(), ...data });
const OPEN = { decKey: '0_abcd1234', q: 'Soru?', options: ['A', 'B', 'C'], poll: false, durMs: 5000 };

beforeEach(() => { be = new FakeBackend(); });

describe('resumeSession', () => {
  it('ayni host uid ile var olan oturumu surdurur, ayni sid doner', async () => {
    const a = mk(); const sid = await a.src.createSession();
    const b = mk(); // sayfa yenilendi: yeni kaynak, ayni anonim uid
    await expect(b.src.resumeSession(sid)).resolves.toBe(sid);
    expect(b.src.sid).toBe(sid);
  });
  it('acik oylama varsa oturumu lobby durumuna sifirlar (telefonlar beklemeye gecer)', async () => {
    const a = mk(); const sid = await a.src.createSession(); a.src.open(OPEN); await sleep(30); await a.src.pause();
    expect(sess(sid).phase).toBe('vote');
    const b = mk(); await b.src.resumeSession(sid);
    expect(sess(sid)).toMatchObject({ hostUid: 'hostU', phase: 'lobby', decKey: null, winner: null, counts: null, forced: false, paused: false, pausedLeftMs: null, closesAt: null });
  });
  it('surdurulen oturumda oylama normal calisir ve sunucu saat farki yeniden olculur', async () => {
    const a = mk(); const sid = await a.src.createSession();
    be.serverSkewMs = 4000;
    const b = mk(); await b.src.resumeSession(sid);
    await b.src.open({ ...OPEN, durMs: 10000 });
    expect(Math.abs(sess(sid).closesAt.toMillis() - (Date.now() + 4000 + 10000))).toBeLessThan(500);
    const res = await b.src.close(); expect(res.error).toBeNull(); expect(sess(sid).phase).toBe('result');
  });
  it('baska uid nin oturumunu reddeder ve oturuma dokunmaz', async () => {
    const a = mk(); const sid = await a.src.createSession(); const before = { ...sess(sid) };
    const x = mk('baskasi'); await expect(x.src.resumeSession(sid)).rejects.toThrow();
    expect(sess(sid)).toEqual(before); expect(x.src.sid).toBeNull();
  });
  it('bitmis (ended) oturumu reddeder', async () => {
    const a = mk(); const sid = await a.src.createSession(); await a.src.end();
    await expect(mk().src.resumeSession(sid)).rejects.toThrow(/bitmis|ended/);
  });
  it('olmayan oturumu ve gecersiz sid yi reddeder', async () => {
    await expect(mk().src.resumeSession('yok123')).rejects.toThrow();
    await expect(mk().src.resumeSession('')).rejects.toThrow();
    await expect(mk().src.resumeSession('a/b')).rejects.toThrow();
  });
  it('ag yoksa zaman asimiyla reddeder (sonsuza beklemez)', async () => {
    const a = mk(); const sid = await a.src.createSession(); be.offline = true;
    const t0 = Date.now(); await expect(mk().src.resumeSession(sid)).rejects.toThrow(); expect(Date.now() - t0).toBeLessThan(1500);
  });
});

describe('createRemote / resumeRemote', () => {
  it('20+ karakterlik gizli kimlikle remotes belgesi yazar (owner:null), url ?s=&r= icerir', async () => {
    const { src } = mk(); const sid = await src.createSession();
    const r = await src.createRemote();
    expect(r.secret).toMatch(/^[A-Za-z0-9]{20,}$/);
    expect(r.url).toBe(`https://demo.web.app/k/?s=${sid}&r=${r.secret}`);
    expect(remote(sid, r.secret)).toMatchObject({ owner: null, st: null });
  });
  it('her cagri farkli gizli kimlik uretir', async () => {
    const a = mk(); await a.src.createSession(); const s1 = (await a.src.createRemote()).secret;
    const b = mk(); await b.src.createSession(); const s2 = (await b.src.createRemote()).secret;
    expect(s1).not.toBe(s2);
  });
  it('oturum yokken createRemote reddeder', async () => { await expect(mk().src.createRemote()).rejects.toThrow(); });
  it('resumeRemote: var olan belgeyi (eslesmis telefonla) korur, yeniden yazmaz', async () => {
    const a = mk(); const sid = await a.src.createSession(); const { secret } = await a.src.createRemote();
    const p = await phone(); await p.fs.updateDoc(p.fs.doc(p.db, 'sessions', sid, 'remotes', secret), { owner: 'tel1' });
    const b = mk(); await b.src.resumeSession(sid); const st = [];
    b.src.onRemoteStatus((s) => st.push(s));
    const r = await b.src.resumeRemote(secret);
    expect(r).toMatchObject({ secret, url: `https://demo.web.app/k/?s=${sid}&r=${secret}`, paired: true });
    expect(remote(sid, secret).owner).toBe('tel1');
    await sleep(20); expect(st[st.length - 1]).toMatchObject({ paired: true, owner: 'tel1' });
  });
  it('resumeRemote: belge yoksa ayni kimlikle yeniden olusturur', async () => {
    const { src } = mk(); const sid = await src.createSession();
    const r = await src.resumeRemote('ABCDEFGHIJKLMNOPQRSTuvwx');
    expect(r.paired).toBe(false); expect(remote(sid, 'ABCDEFGHIJKLMNOPQRSTuvwx')).toMatchObject({ owner: null });
  });
  it('resumeRemote gecersiz kimligi reddeder', async () => {
    const { src } = mk(); await src.createSession();
    await expect(src.resumeRemote('kisa')).rejects.toThrow(); await expect(src.resumeRemote('a/bcdefghijklmnopqrstuvwxyz')).rejects.toThrow();
  });
  it('onRemoteStatus: telefon owner yazinca paired:true bildirir', async () => {
    const { src } = mk(); const sid = await src.createSession(); const st = []; src.onRemoteStatus((s) => st.push(s));
    const { secret } = await src.createRemote(); await sleep(20);
    expect(st[st.length - 1]).toMatchObject({ paired: false });
    const p = await phone(); await p.fs.updateDoc(p.fs.doc(p.db, 'sessions', sid, 'remotes', secret), { owner: 'tel1' }); await sleep(20);
    expect(st[st.length - 1]).toMatchObject({ paired: true, owner: 'tel1' });
  });
});

describe('onRemoteCommand', () => {
  const setup = async () => {
    const h = mk(); const sid = await h.src.createSession(); const { secret } = await h.src.createRemote();
    const got = []; h.src.onRemoteCommand((c) => got.push(c));
    const p = await phone(); return { ...h, sid, secret, got, p };
  };
  it('komutu (c, a) ile iletir ve islenen komut belgesini siler', async () => {
    const { sid, secret, got, p } = await setup();
    await sendCmd(p, sid, secret, { c: 'ileri' }); await sendCmd(p, sid, secret, { c: 'kazan', a: 2 }); await sleep(40);
    expect(got.map((x) => [x.c, x.a])).toEqual([['ileri', undefined], ['kazan', 2]]);
    expect(cmdKeys(sid, secret)).toHaveLength(0);
  });
  it('ayni komutu asla iki kez islemez (silme basarisiz olsa ve dinleyici tekrar tetiklense bile)', async () => {
    const { c, sid, secret, got, p } = await setup();
    c.fs.deleteDoc = () => Promise.reject(Object.assign(new Error('permission-denied (fake)'), { code: 'permission-denied' }));
    await sendCmd(p, sid, secret, { c: 'geri' }); await sleep(20);
    be.notify(); be.notify(); await sleep(20);
    expect(got.filter((x) => x.c === 'geri')).toHaveLength(1); expect(cmdKeys(sid, secret)).toHaveLength(1);
  });
  it('15 sn den eski komutlar (sunucu saatine gore) yok sayilir ama silinir', async () => {
    const { sid, secret, got, p } = await setup();
    await sendCmd(p, sid, secret, { c: 'ileri', at: FakeTimestamp.fromMillis(Date.now() - 20000) });
    await sendCmd(p, sid, secret, { c: 'ses' }); await sleep(40);
    expect(got.map((x) => x.c)).toEqual(['ses']); expect(cmdKeys(sid, secret)).toHaveLength(0);
  });
  it('sunucu saati ilerideyse (offset) taze komut eski sayilmaz', async () => {
    be.serverSkewMs = 30000; const { sid, secret, got, p } = await setup();
    await sendCmd(p, sid, secret, { c: 'oto' }); await sleep(40);
    expect(got.map((x) => x.c)).toEqual(['oto']);
  });
  it('birden cok bekleyen komut zaman sirasiyla islenir', async () => {
    const { sid, secret, got, p } = await setup();
    // ayni anlik goruntude iki komut (Firestore varsayilan sirasi belge kimligine goredir, zamana gore degil)
    be.docs.set(`sessions/${sid}/remotes/${secret}/cmds/a1`, { c: 'devam', at: FakeTimestamp.fromMillis(Date.now() - 1000) });
    be.docs.set(`sessions/${sid}/remotes/${secret}/cmds/b2`, { c: 'duraklat', at: FakeTimestamp.fromMillis(Date.now() - 3000) });
    be.notify(); await sleep(40); void p;
    expect(got.map((x) => x.c)).toEqual(['duraklat', 'devam']);
  });
  it('geri cagri hata firlatsa da dinleme surer', async () => {
    const h = mk(); const sid = await h.src.createSession(); const { secret } = await h.src.createRemote(); const got = [];
    h.src.onRemoteCommand((c) => { got.push(c.c); throw new Error('motor hatasi'); });
    const p = await phone(); await sendCmd(p, sid, secret, { c: 'ileri' }); await sendCmd(p, sid, secret, { c: 'geri' }); await sleep(40);
    expect(got).toEqual(['ileri', 'geri']);
  });
  it('onRemoteCommand remote acilmadan once de kaydedilebilir', async () => {
    const h = mk(); const sid = await h.src.createSession(); const got = []; h.src.onRemoteCommand((c) => got.push(c.c));
    const { secret } = await h.src.createRemote(); const p = await phone(); await sendCmd(p, sid, secret, { c: 'bitir' }); await sleep(40);
    expect(got).toEqual(['bitir']);
  });
});

describe('pushRemoteState', () => {
  it('durumu st alanina yazar; hizli ardisik cagrilarda en sonuncusu kazanir (kisitli)', async () => {
    const { src } = mk(); const sid = await src.createSession(); const { secret } = await src.createRemote();
    for (let i = 0; i < 10; i++) src.pushRemoteState({ pos: i });
    await sleep(20); const first = remote(sid, secret).st;
    await sleep(150);
    expect(remote(sid, secret).st).toEqual({ pos: 9 });
    expect(first === null || first.pos === 0 || first.pos === 9).toBe(true);
  });
  it('saniyede ~1 yazimla sinirlidir', async () => {
    const { c, src } = mk('hostU', { remoteThrottleMs: 100 }); const sid = await src.createSession(); const { secret } = await src.createRemote();
    let writes = 0; const up = c.fs.updateDoc; c.fs.updateDoc = (ref, d) => { if (ref.path.includes('/remotes/')) writes++; return up(ref, d); };
    const t0 = Date.now(); while (Date.now() - t0 < 350) { src.pushRemoteState({ t: Date.now() }); await sleep(5); }
    await sleep(150);
    expect(writes).toBeGreaterThanOrEqual(2); expect(writes).toBeLessThanOrEqual(6);
    expect(remote(sid, secret).st).toBeTruthy();
  });
  it('degismeyen durumu yeniden yazmaz', async () => {
    const { c, src } = mk(); await src.createSession(); await src.createRemote();
    let writes = 0; const up = c.fs.updateDoc; c.fs.updateDoc = (ref, d) => { if (ref.path.includes('/remotes/')) writes++; return up(ref, d); };
    src.pushRemoteState({ a: 1 }); await sleep(100); src.pushRemoteState({ a: 1 }); await sleep(100);
    expect(writes).toBe(1);
  });
  it('remote yokken ve ag yokken asla firlatmaz/takilmaz; remote acilinca son durum yazilir', async () => {
    const { src } = mk();
    expect(() => src.pushRemoteState({ x: 1 })).not.toThrow();
    const sid = await src.createSession(); src.pushRemoteState({ x: 2 });
    const { secret } = await src.createRemote(); await sleep(100);
    expect(remote(sid, secret).st).toEqual({ x: 2 });
    be.offline = true; expect(() => src.pushRemoteState({ x: 3 })).not.toThrow(); await sleep(250);
    expect(() => src.pushRemoteState(undefined)).not.toThrow();
    const cyc = {}; cyc.self = cyc; expect(() => src.pushRemoteState(cyc)).not.toThrow();
  });
});

describe('resetRemote', () => {
  it('yeni gizli kimlik uretir, eski belge silinir (eski telefon eslesmesi biter)', async () => {
    const { src } = mk(); const sid = await src.createSession(); const st = []; src.onRemoteStatus((s) => st.push(s));
    const old = await src.createRemote();
    const p = await phone(); await p.fs.updateDoc(p.fs.doc(p.db, 'sessions', sid, 'remotes', old.secret), { owner: 'tel1' });
    await sendCmd(p, sid, old.secret, { c: 'ileri', at: FakeTimestamp.fromMillis(Date.now() - 60000) });
    await sleep(20); expect(st[st.length - 1].paired).toBe(true);
    const nu = await src.resetRemote();
    expect(nu.secret).not.toBe(old.secret); expect(nu.url).toContain(`r=${nu.secret}`);
    expect(remote(sid, old.secret)).toBeUndefined(); expect(cmdKeys(sid, old.secret)).toHaveLength(0);
    expect(remote(sid, nu.secret)).toMatchObject({ owner: null });
    await sleep(20); expect(st[st.length - 1].paired).toBe(false);
  });
  it('eski kimlige gelen komutlar artik islenmez, yenisine gelenler islenir', async () => {
    const { src } = mk(); const sid = await src.createSession(); const got = []; src.onRemoteCommand((c) => got.push(c.c));
    const old = await src.createRemote(); const nu = await src.resetRemote(); const p = await phone();
    await sendCmd(p, sid, old.secret, { c: 'ileri' }); await sendCmd(p, sid, nu.secret, { c: 'geri' }); await sleep(40);
    expect(got).toEqual(['geri']);
  });
  it('once remote yoksa yalnizca yenisini olusturur', async () => {
    const { src } = mk(); const sid = await src.createSession(); const r = await src.resetRemote();
    expect(remote(sid, r.secret)).toMatchObject({ owner: null });
  });
});
