import { describe, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import fs from 'node:fs';

const [HOST, HOSTPORT] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
let env;
const SID = 's1', DK = '0_abc123', HOSTU = 'hostU', A = 'userA', B = 'userB';
const inFuture = (s) => Timestamp.fromMillis(Date.now() + s * 1000);
const session = (over = {}) => ({
  hostUid: HOSTU, phase: 'vote', decKey: DK, q: 'Soru?', options: ['a', 'b', 'c'], n: 3, poll: false,
  openedAt: Timestamp.now(), closesAt: inFuture(60), winner: null, counts: null, forced: false, ...over,
});
const seed = (over) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'sessions', SID), session(over)));
const db = (uid) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());
const voteRef = (uid, id) => doc(db(uid), 'sessions', SID, 'votes', id);
const vote = (o = 1) => ({ o, at: serverTimestamp() });

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mezuniyet',
    firestore: { host: HOST, port: Number(HOSTPORT), rules: fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

describe('sessions: okuma', () => {
  it('giris yapmis (anonim) herkes okuyabilir', async () => { await seed(); await assertSucceeds(getDoc(doc(db(A), 'sessions', SID))); });
  it('girissiz okuyamaz', async () => { await seed(); await assertFails(getDoc(doc(db(null), 'sessions', SID))); });
});

describe('sessions: create/update/delete', () => {
  it('kendi uid sini hostUid yaparak olusturabilir', async () => {
    await assertSucceeds(setDoc(doc(db(HOSTU), 'sessions', 'new1'), session()));
  });
  it('baska uid yi hostUid yapamaz', async () => {
    await assertFails(setDoc(doc(db(A), 'sessions', 'new2'), session({ hostUid: HOSTU })));
  });
  it('girissiz olusturamaz', async () => {
    await assertFails(setDoc(doc(db(null), 'sessions', 'new3'), session()));
  });
  it('host gunceller', async () => {
    await seed(); await assertSucceeds(updateDoc(doc(db(HOSTU), 'sessions', SID), { phase: 'result', winner: 1, counts: [1, 2, 0] }));
  });
  it('host paused/pausedLeftMs yazabilir, host olmayan yazamaz', async () => {
    await seed(); await assertSucceeds(updateDoc(doc(db(HOSTU), 'sessions', SID), { paused: true, pausedLeftMs: 9000 }));
    await assertFails(updateDoc(doc(db(A), 'sessions', SID), { paused: false }));
  });
  it('host olmayan guncelleyemez', async () => {
    await seed(); await assertFails(updateDoc(doc(db(A), 'sessions', SID), { phase: 'result', winner: 0 }));
  });
  it('host hostUid yi baskasina degistiremez', async () => {
    await seed(); await assertFails(updateDoc(doc(db(HOSTU), 'sessions', SID), { hostUid: A }));
  });
  it('host siler', async () => { await seed(); await assertSucceeds(deleteDoc(doc(db(HOSTU), 'sessions', SID))); });
  it('host olmayan silemez', async () => { await seed(); await assertFails(deleteDoc(doc(db(A), 'sessions', SID))); });
});

describe('votes: yazma', () => {
  it('dogru kimlik, acik faz, gecerli o ile oy verilebilir', async () => {
    await seed(); await assertSucceeds(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
  });
  it('oy degistirilebilir (update)', async () => {
    await seed(); await assertSucceeds(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
    await assertSucceeds(setDoc(voteRef(A, `${DK}__${A}`), vote(2)));
  });
  it('sure dolmus oy reddedilir', async () => {
    await seed({ closesAt: Timestamp.fromMillis(Date.now() - 5000) });
    await assertFails(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
  });
  it('sure dolmadan hemen onceki (yakin gelecek) oy kabul', async () => {
    await seed({ closesAt: inFuture(5) }); await assertSucceeds(setDoc(voteRef(A, `${DK}__${A}`), vote(0)));
  });
  it('baska uid adina oy reddedilir', async () => {
    await seed(); await assertFails(setDoc(voteRef(A, `${DK}__${B}`), vote(1)));
  });
  it('yanlis decKey reddedilir', async () => {
    await seed(); await assertFails(setDoc(voteRef(A, `9_zzzzzz__${A}`), vote(1)));
  });
  it('kimlikte ayrac yoksa reddedilir', async () => {
    await seed(); await assertFails(setDoc(voteRef(A, A), vote(1)));
  });
  it('o >= n reddedilir', async () => { await seed(); await assertFails(setDoc(voteRef(A, `${DK}__${A}`), vote(3))); });
  it('o < 0 reddedilir', async () => { await seed(); await assertFails(setDoc(voteRef(A, `${DK}__${A}`), vote(-1))); });
  it('o tamsayi degilse reddedilir', async () => {
    await seed();
    await assertFails(setDoc(voteRef(A, `${DK}__${A}`), vote(1.5)));
    await assertFails(setDoc(voteRef(A, `${DK}__${A}`), { o: '1', at: serverTimestamp() }));
  });
  it('fazladan alan reddedilir', async () => {
    await seed(); await assertFails(setDoc(voteRef(A, `${DK}__${A}`), { o: 1, at: serverTimestamp(), x: 1 }));
  });
  it('eksik alan (at yok) reddedilir', async () => {
    await seed(); await assertFails(setDoc(voteRef(A, `${DK}__${A}`), { o: 1 }));
  });
  it('at sunucu zamani degilse (istemci zamani) reddedilir', async () => {
    await seed(); await assertFails(setDoc(voteRef(A, `${DK}__${A}`), { o: 1, at: Timestamp.fromMillis(Date.now() - 100000) }));
  });
  it('phase vote degilse reddedilir (lobby, result)', async () => {
    await seed({ phase: 'lobby' }); await assertFails(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
    await seed({ phase: 'result' }); await assertFails(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
  });
  it('duraklatilmisken (paused:true) oy reddedilir; paused:false veya alan yoksa kabul', async () => {
    await seed({ paused: true, pausedLeftMs: 12000 }); await assertFails(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
    await seed({ paused: false }); await assertSucceeds(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
    await seed(); await assertSucceeds(setDoc(voteRef(B, `${DK}__${B}`), vote(1)));
  });
  it('girissiz oy veremez', async () => {
    await seed(); await assertFails(setDoc(voteRef(null, `${DK}__${A}`), vote(1)));
  });
  it('oy belgesi silinemez (kendi oyu da, host da)', async () => {
    await seed(); await assertSucceeds(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
    await assertFails(deleteDoc(voteRef(A, `${DK}__${A}`)));
    await assertFails(deleteDoc(voteRef(HOSTU, `${DK}__${A}`)));
  });
  it('olmayan oturuma oy reddedilir', async () => {
    await assertFails(setDoc(doc(db(A), 'sessions', 'yok', 'votes', `${DK}__${A}`), vote(1)));
  });
});

describe('votes: okuma', () => {
  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), 'sessions', SID, 'votes', `${DK}__${A}`), { o: 1, at: Timestamp.now() });
      await setDoc(doc(c.firestore(), 'sessions', SID, 'votes', `${DK}__${B}`), { o: 2, at: Timestamp.now() });
    });
  });
  it('host tum oylari listeleyebilir', async () => {
    await assertSucceeds(getDocs(collection(db(HOSTU), 'sessions', SID, 'votes')));
  });
  it('seyirci oylari listeleyemez', async () => {
    await assertFails(getDocs(collection(db(A), 'sessions', SID, 'votes')));
  });
  it('seyirci kendi oy belgesini okuyabilir', async () => {
    await assertSucceeds(getDoc(voteRef(A, `${DK}__${A}`)));
  });
  it('seyirci baskasinin oyunu okuyamaz', async () => {
    await assertFails(getDoc(voteRef(A, `${DK}__${B}`)));
  });
  it('girissiz okuyamaz', async () => {
    await assertFails(getDoc(voteRef(null, `${DK}__${A}`)));
  });
});

describe('diger yollar kapali', () => {
  it('rastgele koleksiyon okunamaz/yazilamaz', async () => {
    await assertFails(getDoc(doc(db(HOSTU), 'baska', 'x')));
    await assertFails(setDoc(doc(db(HOSTU), 'baska', 'x'), { a: 1 }));
  });
  it('oturum altindaki baska alt koleksiyon kapali', async () => {
    await seed();
    await assertFails(setDoc(doc(db(HOSTU), 'sessions', SID, 'notlar', 'n1'), { a: 1 }));
    await assertFails(getDoc(doc(db(HOSTU), 'sessions', SID, 'notlar', 'n1')));
  });
});
