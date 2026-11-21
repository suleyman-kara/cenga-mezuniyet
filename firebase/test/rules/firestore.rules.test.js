import { describe, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
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

const RID = 'Gizli0123456789abcdefXYZ';
const remRef = (uid, rid = RID) => doc(db(uid), 'sessions', SID, 'remotes', rid);
const cmdsCol = (uid, rid = RID) => collection(db(uid), 'sessions', SID, 'remotes', rid, 'cmds');
const seedRemote = (over = {}) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'sessions', SID, 'remotes', RID), { owner: null, st: null, createdAt: Timestamp.now(), ...over }));
const seedCmd = (id = 'k1', data = { c: 'ileri', at: Timestamp.now() }) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'sessions', SID, 'remotes', RID, 'cmds', id), data));
const cmd = (c = 'ileri', extra = {}) => ({ c, at: serverTimestamp(), ...extra });

describe('remotes: kumanda belgesi', () => {
  beforeEach(async () => { await seed({ phase: 'lobby' }); });
  it('host olusturur, gunceller (st), siler ve listeler', async () => {
    await assertSucceeds(setDoc(remRef(HOSTU), { owner: null, st: null, createdAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(remRef(HOSTU), { st: { pos: 3, metin: 'merhaba' } }));
    await assertSucceeds(getDocs(collection(db(HOSTU), 'sessions', SID, 'remotes')));
    await assertSucceeds(deleteDoc(remRef(HOSTU)));
  });
  it('host olmayan olusturamaz, silemez, listeleyemez', async () => {
    await assertFails(setDoc(remRef(A), { owner: A, st: null }));
    await seedRemote();
    await assertFails(deleteDoc(remRef(A)));
    await assertFails(getDocs(collection(db(A), 'sessions', SID, 'remotes')));
  });
  it('kimligi bilen giris yapmis kullanici okuyabilir; girissiz okuyamaz', async () => {
    await seedRemote();
    await assertSucceeds(getDoc(remRef(A)));
    await assertFails(getDoc(remRef(null)));
  });
  it('host olmayan owner null iken kendini owner yapabilir (bir kerelik eslesme)', async () => {
    await seedRemote(); await assertSucceeds(updateDoc(remRef(A), { owner: A }));
  });
  it('owner doluyken baskasi (ve ayni kisi) owner i degistiremez', async () => {
    await seedRemote({ owner: A });
    await assertFails(updateDoc(remRef(B), { owner: B }));
    await assertFails(updateDoc(remRef(A), { owner: B }));
    await assertFails(updateDoc(remRef(A), { owner: null }));
  });
  it('baskasinin uid sini owner yapamaz', async () => { await seedRemote(); await assertFails(updateDoc(remRef(A), { owner: B })); });
  it('eslesirken baska alan degistiremez (st, createdAt, yeni alan)', async () => {
    await seedRemote();
    await assertFails(updateDoc(remRef(A), { owner: A, st: { pos: 99 } }));
    await assertFails(updateDoc(remRef(A), { owner: A, x: 1 }));
    await assertFails(updateDoc(remRef(A), { st: { pos: 1 } }));
  });
  it('girissiz eslesemez', async () => { await seedRemote(); await assertFails(updateDoc(remRef(null), { owner: null })); });
  it('host owner i sifirlayabilir / st yazabilir', async () => {
    await seedRemote({ owner: A }); await assertSucceeds(updateDoc(remRef(HOSTU), { owner: null, st: { pos: 1 } }));
  });
});

describe('remotes/cmds: kumanda komutlari', () => {
  beforeEach(async () => { await seed({ phase: 'lobby' }); await seedRemote({ owner: A }); });
  it('owner gecerli komut yazabilir (a olmadan ve a ile)', async () => {
    for (const c of ['ileri', 'geri', 'duraklat', 'devam', 'bitir', 'ses', 'oto']) await assertSucceeds(addDoc(cmdsCol(A), cmd(c)));
    await assertSucceeds(addDoc(cmdsCol(A), cmd('kazan', { a: 0 })));
    await assertSucceeds(addDoc(cmdsCol(A), cmd('kazan', { a: 3 })));
  });
  it('owner olmayan (host dahil) komut yazamaz; girissiz yazamaz', async () => {
    await assertFails(addDoc(cmdsCol(B), cmd()));
    await assertFails(addDoc(cmdsCol(HOSTU), cmd()));
    await assertFails(addDoc(cmdsCol(null), cmd()));
  });
  it('owner null iken kimse komut yazamaz', async () => {
    await seedRemote({ owner: null }); await assertFails(addDoc(cmdsCol(A), cmd()));
  });
  it('olmayan (sifirlanmis) kumandaya komut yazilamaz', async () => {
    await assertFails(addDoc(cmdsCol(A, 'YokBoyleBirKumanda0000000'), cmd()));
  });
  it('izin listesinde olmayan komut reddedilir', async () => {
    await assertFails(addDoc(cmdsCol(A), cmd('restart')));
    await assertFails(addDoc(cmdsCol(A), cmd('')));
    await assertFails(addDoc(cmdsCol(A), { c: 1, at: serverTimestamp() }));
  });
  it('a aralik disi / tamsayi degilse reddedilir', async () => {
    await assertFails(addDoc(cmdsCol(A), cmd('kazan', { a: 4 })));
    await assertFails(addDoc(cmdsCol(A), cmd('kazan', { a: -1 })));
    await assertFails(addDoc(cmdsCol(A), cmd('kazan', { a: 1.5 })));
    await assertFails(addDoc(cmdsCol(A), cmd('kazan', { a: '1' })));
  });
  it('fazladan/eksik alan reddedilir', async () => {
    await assertFails(addDoc(cmdsCol(A), cmd('ileri', { x: 1 })));
    await assertFails(addDoc(cmdsCol(A), { c: 'ileri' }));
    await assertFails(addDoc(cmdsCol(A), { at: serverTimestamp() }));
  });
  it('at sunucu zamani degilse reddedilir', async () => {
    await assertFails(addDoc(cmdsCol(A), { c: 'ileri', at: Timestamp.fromMillis(Date.now()) }));
  });
  it('komutlari yalnizca host okur, listeler ve siler', async () => {
    await seedCmd('k1');
    await assertSucceeds(getDocs(cmdsCol(HOSTU)));
    await assertSucceeds(getDoc(doc(db(HOSTU), 'sessions', SID, 'remotes', RID, 'cmds', 'k1')));
    await assertFails(getDocs(cmdsCol(A)));
    await assertFails(getDoc(doc(db(A), 'sessions', SID, 'remotes', RID, 'cmds', 'k1')));
    await assertFails(deleteDoc(doc(db(A), 'sessions', SID, 'remotes', RID, 'cmds', 'k1')));
    await assertSucceeds(deleteDoc(doc(db(HOSTU), 'sessions', SID, 'remotes', RID, 'cmds', 'k1')));
  });
  it('komut guncellenemez (owner da host da)', async () => {
    await seedCmd('k2');
    await assertFails(setDoc(doc(db(A), 'sessions', SID, 'remotes', RID, 'cmds', 'k2'), cmd('geri')));
    await assertFails(updateDoc(doc(db(HOSTU), 'sessions', SID, 'remotes', RID, 'cmds', 'k2'), { c: 'geri' }));
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

describe('players: takma ad (salon oyunlari)', () => {
  const pRef = (uid, pid = uid) => doc(db(uid), 'sessions', SID, 'players', pid);
  const oyuncu = (ad = 'Ayşe') => ({ ad, at: serverTimestamp() });
  const seedP = (over = {}) => seed({ phase: 'lobby', takmaAd: true, ...over });
  it('takmaAd oturumunda seyirci kendi belgesini olusturur ve gunceller', async () => {
    await seedP();
    await assertSucceeds(setDoc(pRef(A), oyuncu('Ayşe')));
    await assertSucceeds(setDoc(pRef(A), oyuncu('Ayşe K.')));
    await assertSucceeds(setDoc(pRef(B), oyuncu('')));          // bos ad (yalnizca katildi) gecerli
  });
  it('oylama ya da sonuc fazinda da ad yazilabilir', async () => {
    await seedP({ phase: 'vote' }); await assertSucceeds(setDoc(pRef(A), oyuncu()));
    await seedP({ phase: 'result' }); await assertSucceeds(setDoc(pRef(B), oyuncu()));
  });
  it('20 karakter sinir: 20 kabul, 21 red', async () => {
    await seedP();
    await assertSucceeds(setDoc(pRef(A), oyuncu('x'.repeat(20))));
    await assertFails(setDoc(pRef(B), oyuncu('x'.repeat(21))));
  });
  it('baskasi adina yazamaz', async () => { await seedP(); await assertFails(setDoc(pRef(A, B), oyuncu())); });
  it('girissiz yazamaz', async () => { await seedP(); await assertFails(setDoc(doc(db(null), 'sessions', SID, 'players', A), oyuncu())); });
  it('takmaAd olmayan (Mezuniyet.exe) oturumda yazilamaz', async () => {
    await seed({ phase: 'lobby' }); await assertFails(setDoc(pRef(A), oyuncu()));
    await seed({ phase: 'lobby', takmaAd: false }); await assertFails(setDoc(pRef(A), oyuncu()));
  });
  it('bitmis (ended) oturumda yazilamaz; olmayan oturumda yazilamaz', async () => {
    await seedP({ phase: 'ended' }); await assertFails(setDoc(pRef(A), oyuncu()));
    await assertFails(setDoc(doc(db(A), 'sessions', 'yok', 'players', A), oyuncu()));
  });
  it('alan seti tam {ad, at}: fazla alan, eksik alan, yanlis tip, istemci saati reddedilir', async () => {
    await seedP();
    await assertFails(setDoc(pRef(A), { ad: 'A', at: serverTimestamp(), puan: 9999 }));
    await assertFails(setDoc(pRef(A), { ad: 'A' }));
    await assertFails(setDoc(pRef(A), { ad: 42, at: serverTimestamp() }));
    await assertFails(setDoc(pRef(A), { ad: 'A', at: Timestamp.fromMillis(Date.now()) }));
  });
  it('okuma: sahibi kendi belgesini, host hepsini okur; baskasi okuyamaz', async () => {
    await seedP(); await setDoc(pRef(A), oyuncu());
    await assertSucceeds(getDoc(pRef(A)));
    await assertSucceeds(getDoc(doc(db(HOSTU), 'sessions', SID, 'players', A)));
    await assertFails(getDoc(doc(db(B), 'sessions', SID, 'players', A)));
  });
  it('listeleme yalnizca host', async () => {
    await seedP(); await setDoc(pRef(A), oyuncu()); await setDoc(pRef(B), oyuncu('B'));
    const l = await assertSucceeds(getDocs(collection(db(HOSTU), 'sessions', SID, 'players')));
    if (l.size !== 2) throw new Error('host 2 oyuncu gormeli, gordu: ' + l.size);
    await assertFails(getDocs(collection(db(A), 'sessions', SID, 'players')));
  });
  it('silme yok (sahibi ve host dahil)', async () => {
    await seedP(); await setDoc(pRef(A), oyuncu());
    await assertFails(deleteDoc(pRef(A)));
    await assertFails(deleteDoc(doc(db(HOSTU), 'sessions', SID, 'players', A)));
  });
  it('host, seyirci adina oyuncu belgesi yazamaz', async () => {
    await seedP(); await assertFails(setDoc(doc(db(HOSTU), 'sessions', SID, 'players', A), oyuncu()));
  });
  it('takmaAd oturumu oy kurallarini gevsetmez: baskasi adina oy yine reddedilir', async () => {
    await seed({ takmaAd: true });
    await assertFails(setDoc(voteRef(A, `${DK}__${B}`), vote(1)));
    await assertSucceeds(setDoc(voteRef(A, `${DK}__${A}`), vote(1)));
  });
  it('seyirci oturuma puan/dogru alani yazamaz (yalnizca host)', async () => {
    await seed({ takmaAd: true });
    await assertFails(updateDoc(doc(db(A), 'sessions', SID), { puan: { [A]: 99999 } }));
    await assertSucceeds(updateDoc(doc(db(HOSTU), 'sessions', SID), { puan: { [A]: 900 }, dogru: 1, sonucIcin: DK }));
  });
});
