// firebase-source.js istemci mantigi testleri - SAHTE (bellek ici) Firestore ile. Guvenlik kurallari burada dogrulanmaz.
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import { FakeBackend, FakeTimestamp } from '../helpers/fake-firestore.js';
import { createFirebaseSource } from '../../src/firebase-source.js';
const VoteCore = createRequire(import.meta.url)('../../vote-core.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let be, host;
const mk = (extra = {}) => {
  const c = be.client('hostU');
  return { c, src: createFirebaseSource({ db: c.db, auth: c.auth, fs: c.fs, VoteCore, settleMs: 20, tickMs: 20, writeTimeoutMs: 150, finalFetchTimeoutMs: 150, voteBaseUrl: 'https://demo.web.app', ...extra }) };
};
const sess = (sid) => be.docs.get(`sessions/${sid}`);
const castVote = async (sid, decKey, uid, o, at) => {
  const v = be.client(uid); await v.fs.signInAnonymously();
  await v.fs.setDoc(v.fs.doc(v.db, 'sessions', sid, 'votes', `${decKey}__${uid}`), { o, at: at ?? v.fs.serverTimestamp() });
};
const OPEN = (over = {}) => ({ decKey: '0_abcd1234', q: 'Soru?', options: ['A', 'B', 'C'], poll: false, durMs: 300, ...over });

beforeEach(() => { be = new FakeBackend(); });

describe('createSession / voteUrl', () => {
  it('lobby oturumu yazar, hostUid=kendi uid, sid dondurur', async () => {
    const { src } = mk(); const sid = await src.createSession();
    expect(sid).toMatch(/^[a-z0-9]{6}$/);
    expect(sess(sid)).toMatchObject({ hostUid: 'hostU', phase: 'lobby', winner: null, counts: null, forced: false });
  });
  it('voteUrl ?s=SID icerir', async () => {
    const { src } = mk(); expect(src.voteUrl('abc123')).toBe('https://demo.web.app/v/?s=abc123');
  });
  it('sunucu saat farkini (offset) olcer: sunucu 5 sn ileriyse closesAt ona gore', async () => {
    be.serverSkewMs = 5000; const { src } = mk(); const sid = await src.createSession();
    await src.open(OPEN({ durMs: 10000 }));
    const closes = sess(sid).closesAt.toMillis();
    expect(Math.abs(closes - (Date.now() + 5000 + 10000))).toBeLessThan(500);
    await src.close();
  });
});

describe('open', () => {
  it('phase=vote ve alanlari yazar', async () => {
    const { src } = mk(); const sid = await src.createSession();
    const r = await src.open(OPEN({ poll: true }));
    expect(r.ok).toBe(true);
    const s = sess(sid);
    expect(s).toMatchObject({ phase: 'vote', decKey: '0_abcd1234', q: 'Soru?', options: ['A', 'B', 'C'], n: 3, poll: true, winner: null, counts: null, forced: false });
    expect(s.closesAt.toMillis() - s.openedAt.toMillis()).toBeGreaterThan(200);
    await src.close();
  });
  it('onUpdate sayilari, toplami ve kalan sureyi bildirir; baska decKey oylarini saymaz', async () => {
    const { src } = mk(); const sid = await src.createSession(); const ups = []; src.onUpdate((u) => ups.push(u));
    await src.open(OPEN({ durMs: 400 }));
    await castVote(sid, '0_abcd1234', 'a1', 0); await castVote(sid, '0_abcd1234', 'a2', 2); await castVote(sid, '9_other000', 'a3', 1);
    await sleep(80);
    const last = ups[ups.length - 1];
    expect(last.counts).toEqual([1, 0, 1]); expect(last.total).toBe(2);
    expect(last.remainingMs).toBeLessThanOrEqual(400); expect(last.remainingMs).toBeGreaterThan(0);
    expect(ups[0].remainingMs).toBeGreaterThanOrEqual(last.remainingMs);
    await src.close();
  });
});

describe('close: sayim ve kazanan', () => {
  it('50 seyirci, bazilari oy degistirir; dogru sayim ve kazanan, sonuc oturuma yazilir', async () => {
    const { src } = mk(); const sid = await src.createSession(); await src.open(OPEN({ durMs: 400 }));
    for (let i = 0; i < 50; i++) await castVote(sid, '0_abcd1234', `v${i}`, i % 5 === 0 ? 0 : i % 5 <= 2 ? 1 : 2);
    // 10 kisi 0 -> 1 degistirir (son secim sayilir)
    for (let i = 0; i < 50; i += 5) await castVote(sid, '0_abcd1234', `v${i}`, 1);
    const res = await src.close();
    // baslangic: o0=10, o1=20, o2=20 ; degisim sonrasi o0=0,o1=30,o2=20
    expect(res.counts).toEqual([0, 30, 20]); expect(res.winner).toBe(1); expect(res.error).toBeNull();
    expect(sess(sid)).toMatchObject({ phase: 'result', winner: 1, counts: [0, 30, 20], forced: false });
  });
  it('sure dolduktan sonra gelen (at > closesAt) oy sayilmaz', async () => {
    const { src } = mk(); const sid = await src.createSession(); await src.open(OPEN({ durMs: 200 }));
    const closes = sess(sid).closesAt.toMillis();
    await castVote(sid, '0_abcd1234', 'x1', 0); await castVote(sid, '0_abcd1234', 'x2', 0);
    await castVote(sid, '0_abcd1234', 'late', 2, FakeTimestamp.fromMillis(closes + 800));
    const res = await src.close();
    expect(res.counts).toEqual([2, 0, 0]); expect(res.winner).toBe(0);
  });
  it('sifir oyda rng ile rastgele kazanan (forced yok)', async () => {
    const { src } = mk({ rng: () => 0.7 }); await src.createSession(); await src.open(OPEN({ durMs: 50 }));
    const res = await src.close(); expect(res.counts).toEqual([0, 0, 0]); expect(res.winner).toBe(2); expect(res.total).toBe(0);
  });
  it('esitlikte yalnizca esitler arasindan rng ile secer', async () => {
    const { src } = mk({ rng: () => 0 }); const sid = await src.createSession(); await src.open(OPEN({ durMs: 100 }));
    await castVote(sid, '0_abcd1234', 'p', 1); await castVote(sid, '0_abcd1234', 'q', 2);
    const res = await src.close(); expect(res.counts).toEqual([0, 1, 1]); expect(res.winner).toBe(1);
  });
  it('forceWin: o kazanir, sure ~1.5 sn e kisalir, forced=true yazilir', async () => {
    const { src } = mk(); const sid = await src.createSession(); const ups = []; src.onUpdate((u) => ups.push(u));
    await src.open(OPEN({ durMs: 60000 }));
    await castVote(sid, '0_abcd1234', 'p', 0); await castVote(sid, '0_abcd1234', 'q', 0);
    src.forceWin(2); await sleep(40);
    expect(ups[ups.length - 1].remainingMs).toBeLessThanOrEqual(1500);
    const res = await src.close();
    expect(res.winner).toBe(2); expect(res.forced).toBe(true); expect(sess(sid)).toMatchObject({ winner: 2, forced: true, phase: 'result' });
  });
  it('forceWin gecersiz indeksi yok sayar', async () => {
    const { src } = mk({ rng: () => 0 }); const sid = await src.createSession(); await src.open(OPEN({ durMs: 80 }));
    await castVote(sid, '0_abcd1234', 'p', 1);
    src.forceWin(9); src.forceWin(-1);
    const res = await src.close(); expect(res.winner).toBe(1); expect(res.forced).toBe(false);
  });
  it('poll oylamasi da ayni sekilde sayilir ve yazilir', async () => {
    const { src } = mk(); const sid = await src.createSession(); await src.open(OPEN({ poll: true, durMs: 100 }));
    await castVote(sid, '0_abcd1234', 'p', 0);
    const res = await src.close(); expect(res.winner).toBe(0); expect(sess(sid).poll).toBe(true);
  });
});

describe('hata dayanikliligi: motor kilitlenmez', () => {
  it('ag yokken open/close takilmaz; close rastgele kazanan + hata bilgisi doner', async () => {
    const { src } = mk({ rng: () => 0.5 }); const sid = await src.createSession();
    be.offline = true;
    const t0 = Date.now();
    const o = await src.open(OPEN({ durMs: 100 }));
    expect(o.ok).toBe(false); expect(o.error).toBeTruthy();
    const res = await src.close();
    expect(Date.now() - t0).toBeLessThan(2000);
    expect(res.winner).toBe(1); expect(res.counts).toEqual([0, 0, 0]);
    expect(res.error).toBeTruthy(); expect(res.errors.length).toBeGreaterThan(0);
  });
  it('son getDocs basarisizsa dinleyicideki oylarla sayar ve hata bildirir', async () => {
    const { src } = mk(); const sid = await src.createSession(); await src.open(OPEN({ durMs: 150 }));
    await castVote(sid, '0_abcd1234', 'p', 2); await castVote(sid, '0_abcd1234', 'q', 2); await sleep(30);
    be.failGetDocs = true;
    const res = await src.close(); expect(res.counts).toEqual([0, 0, 2]); expect(res.winner).toBe(2); expect(res.error).toBeTruthy();
  });
  it('sonuc yazimi reddedilse de (izin hatasi) kazanan doner', async () => {
    const { src } = mk(); const sid = await src.createSession(); await src.open(OPEN({ durMs: 100 }));
    await castVote(sid, '0_abcd1234', 'p', 1);
    be.failWritesTo = `sessions/${sid}`;
    const res = await src.close(); expect(res.winner).toBe(1); expect(res.error).toMatch(/permission-denied/);
  });
  it('open cagrilmadan close cagrilirsa bile cokmez', async () => {
    const { src } = mk(); await src.createSession();
    const res = await src.close(); expect(res).toHaveProperty('error');
  });
  it('createSession ag yoksa zaman asimi ile reddedilir (sonsuza beklemez)', async () => {
    be.offline = true; const { src } = mk();
    await expect(src.createSession()).rejects.toThrow();
  });
});

describe('pause / resume', () => {
  const clocked = (extra = {}) => { const k = { adv: 0 }; return { k, ...mk({ now: () => Date.now() + k.adv, ...extra }) }; };
  it('pause: kalan sureyi yazar, emit edilen remainingMs sabit kalir', async () => {
    const { k, src } = clocked(); const sid = await src.createSession(); const ups = []; src.onUpdate((u) => ups.push(u));
    src.open(OPEN({ durMs: 5000 })); await sleep(60);
    await src.pause();
    const s = sess(sid); expect(s.paused).toBe(true); expect(s.pausedLeftMs).toBeGreaterThan(4000); expect(s.pausedLeftMs).toBeLessThanOrEqual(5000);
    k.adv += 10000; ups.length = 0; await sleep(100);
    expect(ups.length).toBeGreaterThan(0); expect(ups.every((u) => u.remainingMs === s.pausedLeftMs)).toBe(true);
    await src.close();
  });
  it('pause sirasinda sure dolmaz (remainingMs > 0), close tetiklenecek bir sey olmaz', async () => {
    const { k, src } = clocked(); const sid = await src.createSession(); const ups = []; src.onUpdate((u) => ups.push(u));
    src.open(OPEN({ durMs: 300 })); await sleep(50); src.pause(); await sleep(10);
    k.adv += 60000; await sleep(80);
    expect(ups[ups.length - 1].remainingMs).toBeGreaterThan(0); expect(sess(sid).phase).toBe('vote');
    await src.close();
  });
  it('resume: closesAt = simdi(sunucu saati) + kalan, paused=false, akis devam eder', async () => {
    be.serverSkewMs = 5000; const { k, src } = clocked(); const sid = await src.createSession(); const ups = []; src.onUpdate((u) => ups.push(u));
    src.open(OPEN({ durMs: 8000 })); await sleep(50); await src.pause(); const left = sess(sid).pausedLeftMs;
    k.adv += 20000; await sleep(30); await src.resume();
    const s = sess(sid); expect(s.paused).toBe(false);
    expect(Math.abs(s.closesAt.toMillis() - (Date.now() + k.adv + 5000 + left))).toBeLessThan(300);
    await sleep(80); expect(ups[ups.length - 1].remainingMs).toBeLessThan(left); expect(ups[ups.length - 1].remainingMs).toBeGreaterThan(left - 600);
    await src.close();
  });
  it('pause sirasinda gelen eski oylar sayilir; resume sonrasi gelen de sayilir', async () => {
    const { src } = clocked(); const sid = await src.createSession(); src.open(OPEN({ durMs: 5000 }));
    await castVote(sid, '0_abcd1234', 'p', 1); await src.pause(); await sleep(20); await src.resume(); await castVote(sid, '0_abcd1234', 'q', 1);
    const res = await src.close(); expect(res.counts).toEqual([0, 2, 0]);
  });
  it('karar acik degilken pause/resume yalnizca paused alanini yazar', async () => {
    const { src } = clocked(); const sid = await src.createSession(); const before = { ...sess(sid) };
    await src.pause(); expect(sess(sid)).toEqual({ ...before, paused: true }); expect('pausedLeftMs' in sess(sid)).toBe(false);
    await src.resume(); expect(sess(sid)).toEqual({ ...before, paused: false });
  });
  it('cift pause/resume zararsiz; kalan sure ilk pause anindaki kalir', async () => {
    const { k, src } = clocked(); const sid = await src.createSession(); src.open(OPEN({ durMs: 5000 }));
    await src.pause(); const l1 = sess(sid).pausedLeftMs; k.adv += 3000; await src.pause(); expect(sess(sid).pausedLeftMs).toBe(l1);
    await src.resume(); await src.resume(); expect(sess(sid).paused).toBe(false); await src.close();
  });
  it('ag yokken pause/resume takilmaz; yerel sayac yine de durur', async () => {
    const { k, src } = clocked(); const sid = await src.createSession(); const ups = []; src.onUpdate((u) => ups.push(u));
    src.open(OPEN({ durMs: 5000 })); await sleep(30); be.offline = true;
    const t0 = Date.now(); const r = await src.pause(); expect(r.ok).toBe(false); expect(Date.now() - t0).toBeLessThan(1000);
    const v = ups[ups.length - 1].remainingMs; k.adv += 4000; await sleep(60); expect(ups[ups.length - 1].remainingMs).toBe(v);
    const r2 = await src.resume(); expect(r2.ok).toBe(false); await src.close();
  });
  it('pause sirasinda forceWin kalan sureyi 1.5 sn e kisaltir; kapanis resume e kadar bekler', async () => {
    const { src } = clocked(); const sid = await src.createSession(); const ups = []; src.onUpdate((u) => ups.push(u));
    src.open(OPEN({ durMs: 60000 })); await src.pause(); src.forceWin(2); await sleep(40);
    expect(ups[ups.length - 1].remainingMs).toBeLessThanOrEqual(1500); expect(ups[ups.length - 1].remainingMs).toBeGreaterThan(0);
    const res = await src.close(); expect(res.winner).toBe(2);
  });
  it('createSession ve open paused=false yazar; duraklatilmisken acilirsa donuk baslar', async () => {
    const { src } = clocked(); const sid = await src.createSession(); expect(sess(sid).paused).toBe(false);
    await src.pause(); src.open(OPEN({ durMs: 7000 })); await sleep(30);
    expect(sess(sid)).toMatchObject({ phase: 'vote', paused: true, pausedLeftMs: 7000 }); await src.close();
  });
});

