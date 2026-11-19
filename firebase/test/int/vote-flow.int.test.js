// Entegrasyon: Firestore EMULATORU + gercek firebase SDK + gercek firestore.rules + FirebaseSource.
// (Auth emulatoru kullanilmaz; seyirciler rules-unit-testing authenticatedContext ile ayri uid'lerdir.)
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as FS from 'firebase/firestore';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { createFirebaseSource } from '../../src/firebase-source.js';
const VoteCore = createRequire(import.meta.url)('../../vote-core.js');

const [H, P] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
let env;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DK = '0_intkey01';

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-mezuniyet', firestore: { host: H, port: Number(P), rules: fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') } });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

function hostSource(extra = {}) {
  const db = env.authenticatedContext('hostU').firestore();
  const auth = { currentUser: { uid: 'hostU' } };
  const fsDeps = { ...FS, signInAnonymously: async () => ({ user: auth.currentUser }) };
  return createFirebaseSource({ db, auth, fs: fsDeps, VoteCore, settleMs: 150, tickMs: 50, voteBaseUrl: 'https://demo.web.app', ...extra });
}
const voterDb = (uid) => env.authenticatedContext(uid).firestore();
const vote = (uid, sid, o, decKey = DK) => FS.setDoc(FS.doc(voterDb(uid), 'sessions', sid, 'votes', `${decKey}__${uid}`), { o, at: FS.serverTimestamp() });
const sessionDoc = async (sid) => (await FS.getDoc(FS.doc(env.authenticatedContext('anyone').firestore(), 'sessions', sid))).data();

describe('uctan uca oylama (emulator)', () => {
  it('50 seyirci oy verir, bazilari degistirir; sayim ve kazanan dogru; sonuc oturuma yazilir', async () => {
    const src = hostSource(); const sid = await src.createSession();
    await src.open({ decKey: DK, q: 'Soru?', options: ['A', 'B', 'C'], poll: false, durMs: 8000 });
    const ids = Array.from({ length: 50 }, (_, i) => `aud${i}`);
    await Promise.all(ids.map((u, i) => assertSucceeds(vote(u, sid, i % 5 === 0 ? 0 : i % 5 <= 2 ? 1 : 2))));
    await Promise.all(ids.filter((_, i) => i % 5 === 0).map((u) => assertSucceeds(vote(u, sid, 1))));
    const res = await src.close();
    expect(res.counts).toEqual([0, 30, 20]); expect(res.winner).toBe(1); expect(res.error).toBeNull();
    expect(await sessionDoc(sid)).toMatchObject({ phase: 'result', winner: 1, counts: [0, 30, 20], forced: false });
  });
  it('sure + tolerans dolduktan sonra gelen oy kurallarca reddedilir ve sayilmaz', async () => {
    const src = hostSource(); const sid = await src.createSession();
    await src.open({ decKey: DK, q: 'Q', options: ['A', 'B'], poll: false, durMs: 800 });
    await assertSucceeds(vote('early', sid, 0));
    await sleep(2200); // closesAt + 1 sn tolerans gecti
    await assertFails(vote('late', sid, 1));
    const res = await src.close(); expect(res.counts).toEqual([1, 0]); expect(res.winner).toBe(0);
  });
  it('sifir oyda rastgele kazanan (rng enjekte)', async () => {
    const src = hostSource({ rng: () => 0.99 }); const sid = await src.createSession();
    await src.open({ decKey: DK, q: 'Q', options: ['A', 'B', 'C'], poll: false, durMs: 300 });
    const res = await src.close(); expect(res.counts).toEqual([0, 0, 0]); expect(res.winner).toBe(2);
    expect((await sessionDoc(sid)).phase).toBe('result');
  });
  it('forceWin kazanani belirler, seyirci oyu ne olursa olsun', async () => {
    const src = hostSource(); const sid = await src.createSession();
    await src.open({ decKey: DK, q: 'Q', options: ['A', 'B', 'C'], poll: false, durMs: 30000 });
    await Promise.all(['a', 'b', 'c'].map((u) => vote(u, sid, 0)));
    src.forceWin(2);
    const res = await src.close(); expect(res.winner).toBe(2); expect(res.forced).toBe(true);
    expect(await sessionDoc(sid)).toMatchObject({ winner: 2, forced: true, phase: 'result' });
  }, 15000);
  it('yeni karar acilinca eski decKey ile oy reddedilir', async () => {
    const src = hostSource(); const sid = await src.createSession();
    await src.open({ decKey: DK, q: 'Q', options: ['A', 'B'], poll: false, durMs: 300 }); await src.close();
    await src.open({ decKey: '1_second01', q: 'Q2', options: ['A', 'B'], poll: false, durMs: 2000 });
    await assertFails(vote('zed', sid, 0, DK));
    await assertSucceeds(vote('zed', sid, 0, '1_second01'));
    await src.close();
  });
  it('duraklatilmisken oy reddedilir, devam edince kabul edilir; sure korunur', async () => {
    const src = hostSource(); const sid = await src.createSession();
    await src.open({ decKey: DK, q: 'Q', options: ['A', 'B'], poll: false, durMs: 10000 });
    await assertSucceeds(vote('p1', sid, 0));
    await src.pause(); const left = (await sessionDoc(sid)).pausedLeftMs;
    expect((await sessionDoc(sid)).paused).toBe(true); expect(left).toBeGreaterThan(8000);
    await assertFails(vote('p2', sid, 1));
    await src.resume(); expect((await sessionDoc(sid)).paused).toBe(false);
    await assertSucceeds(vote('p2', sid, 1));
    const res = await src.close(); expect(res.counts).toEqual([1, 1]);
  });
});
