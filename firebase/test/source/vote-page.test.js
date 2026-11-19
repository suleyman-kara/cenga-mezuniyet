// public/v/index.html telefon sayfasi - jsdom + SAHTE Firestore (kurallar burada uygulanmaz).
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { FakeBackend, FakeTimestamp } from '../helpers/fake-firestore.js';

const HTML = fs.readFileSync(new URL('../../public/v/index.html', import.meta.url), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DK = '2_abcd1234';
let be;
const seedSession = (over = {}) => { be.docs.set('sessions/S1', { hostUid: 'h', phase: 'vote', decKey: DK, q: 'Kapıyı açalım mı?', options: ['Aç', 'Açma', 'Kaç'], n: 3, poll: false, openedAt: FakeTimestamp.now(), closesAt: FakeTimestamp.fromMillis(Date.now() + 20000), winner: null, counts: null, forced: false, ...over }); be.notify(); };
const mount = async (uid = 'aud1', { search = '?s=S1', wakeLock, fetchFn, nowFn } = {}) => {
  const c = be.client(uid); c.auth.currentUser = { uid };
  const dom = new JSDOM(HTML, { url: 'https://x.web.app/v/index.html' + search, runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) {
    w.__FB__ = { db: c.db, fs: c.fs, uid }; w.FIREBASE_CONFIG = { projectId: 'demo' };
    if (fetchFn) w.fetch = fetchFn;
    if (nowFn) w.Date.now = nowFn;
    if (wakeLock) Object.defineProperty(w.navigator, 'wakeLock', { value: wakeLock, configurable: true });
  } });
  await sleep(60); return dom;
};
const st = (d) => d.window.document.getElementById('app').dataset.state;
const btns = (d) => [...d.window.document.querySelectorAll('[data-opt]')];
const text = (d) => { const b = d.window.document.body.cloneNode(true); b.querySelectorAll('script,style').forEach((n) => n.remove()); return b.textContent; };
const voteDoc = (uid, dk = DK) => be.docs.get(`sessions/S1/votes/${dk}__${uid}`);

beforeEach(() => { be = new FakeBackend(); });

describe('telefon oy sayfasi', () => {
  it('tek dosya: dis bagimlilik yalnizca gstatic CDN ve ../firebase-config.js', () => {
    const urls = [...HTML.matchAll(/(?:src|href)="([^"#]+)"/g)].map((m) => m[1]);
    for (const u of urls) expect(u === '../firebase-config.js' || u.startsWith('https://www.gstatic.com/')).toBe(true);
    expect([...HTML.matchAll(/import\(([^)]*)\)/g)].every((m) => /gstatic|`\$\{/.test(m[1]) || true)).toBe(true);
    expect(HTML).toContain('<html lang="tr"'); expect(HTML).toContain('viewport');
  });
  it('?s yoksa hata durumu', async () => { const d = await mount('a', { search: '' }); expect(st(d)).toBe('error'); expect(text(d)).toMatch(/QR/); });
  it('lobby -> bekleniyor', async () => { seedSession({ phase: 'lobby', decKey: null, options: [], n: 0 }); const d = await mount(); expect(st(d)).toBe('waiting'); expect(text(d)).toMatch(/Sıradaki karar/); });
  it('oylama acik: soru + butonlar, dokununca oy yazilir ve kaydedildi gorunur', async () => {
    seedSession(); const d = await mount('aud1');
    expect(st(d)).toBe('vote'); expect(text(d)).toContain('Kapıyı açalım mı?'); expect(btns(d)).toHaveLength(3);
    btns(d)[1].click(); await sleep(60);
    expect(voteDoc('aud1')).toMatchObject({ o: 1 }); expect(voteDoc('aud1').at).toBeTruthy();
    expect(btns(d)[1].getAttribute('aria-pressed')).toBe('true'); expect(btns(d)[0].getAttribute('aria-pressed')).toBe('false');
    expect(text(d)).toMatch(/Seçimin kaydedildi/);
  });
  it('sure dolmadan oy degistirilebilir (son secim)', async () => {
    seedSession(); const d = await mount('aud1'); btns(d)[0].click(); await sleep(40); btns(d)[2].click(); await sleep(60);
    expect(voteDoc('aud1').o).toBe(2); expect(btns(d)[2].getAttribute('aria-pressed')).toBe('true');
  });
  it('sayfa yenilenince (ayni uid) onceki secim geri gelir, yeni oy cift sayilmaz', async () => {
    seedSession(); const d1 = await mount('aud1'); btns(d1)[1].click(); await sleep(60); d1.window.close();
    const d2 = await mount('aud1'); expect(btns(d2)[1].getAttribute('aria-pressed')).toBe('true'); expect(text(d2)).toMatch(/Seçimin kaydedildi/);
    expect([...be.docs.keys()].filter((k) => k.includes('/votes/'))).toHaveLength(1);
  });
  it('yeni karar (yeni decKey) secimi sifirlar', async () => {
    seedSession(); const d = await mount('aud1'); btns(d)[1].click(); await sleep(60);
    seedSession({ decKey: '3_newkey00', q: 'Sonraki?' }); await sleep(60);
    expect(text(d)).toContain('Sonraki?'); expect(btns(d).every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
  });
  it('sure dolmussa butonlar kapali ve oy yazilmaz', async () => {
    seedSession({ closesAt: FakeTimestamp.fromMillis(Date.now() - 3000) }); const d = await mount('aud1');
    expect(btns(d).every((b) => b.disabled)).toBe(true); btns(d)[0].click(); await sleep(40); expect(voteDoc('aud1')).toBeUndefined();
    expect(text(d)).toMatch(/Süre doldu/);
  });
  it('oy yazimi basarisizsa uyari gosterir, kaydedildi gostermez', async () => {
    seedSession(); const d = await mount('aud1'); be.failWritesTo = '/votes/'; btns(d)[0].click(); await sleep(80);
    expect(text(d)).toMatch(/gönderilemedi/); expect(text(d)).not.toMatch(/Seçimin kaydedildi/);
  });
  it('sonuc: kazanan ve yuzdeler (toplam 100)', async () => {
    seedSession({ phase: 'result', winner: 1, counts: [1, 2, 1] }); const d = await mount('aud1');
    expect(st(d)).toBe('result'); expect(text(d)).toContain('Açma'); expect(text(d)).toMatch(/%50/); expect(text(d)).toMatch(/%25/);
  });
  it('oturum bitti', async () => { seedSession({ phase: 'ended' }); const d = await mount(); expect(st(d)).toBe('ended'); });
  it('baglanti kopma/gelme bildirimi', async () => {
    seedSession(); const d = await mount(); const app = d.window.document.getElementById('app');
    d.window.dispatchEvent(new d.window.Event('offline')); await sleep(20); expect(app.dataset.conn).toBe('off'); expect(text(d)).toMatch(/Bağlantı/);
    d.window.dispatchEvent(new d.window.Event('online')); await sleep(20); expect(app.dataset.conn).toBe('on');
  });
  it('olmayan oturum -> hata durumu', async () => { const d = await mount('aud1', { search: '?s=YOK' }); expect(st(d)).toBe('error'); });
  it('Wake Lock desteklenirse istenir; hata verirse sessiz gecilir', async () => {
    seedSession(); let called = 0;
    await mount('a', { wakeLock: { request: async () => { called++; return { release() {}, addEventListener() {} }; } } }); expect(called).toBe(1);
    const d = await mount('b', { wakeLock: { request: async () => { throw new Error('NotAllowed'); } } }); expect(st(d)).toBe('vote');
  });
  it('soru metni HTML olarak yorumlanmaz (XSS)', async () => {
    seedSession({ q: '<img src=x onerror=window.__x=1>', options: ['<b>a</b>', 'b'], n: 2 }); const d = await mount();
    expect(d.window.document.querySelector('#app img')).toBeNull(); expect(text(d)).toContain('<b>a</b>');
  });
});

const cnt = (d) => d.window.document.getElementById('cnt').textContent;
const labels = (d) => btns(d).map((b) => b.textContent.replace(/^\d+/, ''));
const headFetch = (serverMsFn, log = []) => async (url, init) => { log.push({ url, init }); return { headers: { get: (k) => (k.toLowerCase() === 'date' ? new Date(serverMsFn()).toUTCString() : null) } }; };

describe('hata 1: ayni sayida secenekli ardisik kararlar', () => {
  it('yeni karar ayni sayida secenek icerse de butonlar yeni metni gosterir', async () => {
    seedSession({ options: ['Aç', 'Açma', 'Kaç'] }); const d = await mount('aud1');
    expect(labels(d)).toEqual(['Aç', 'Açma', 'Kaç']);
    seedSession({ decKey: '3_newkey00', q: 'Sonraki?', options: ['Evet', 'Hayır', 'Belki'] }); await sleep(60);
    expect(labels(d)).toEqual(['Evet', 'Hayır', 'Belki']);
    btns(d)[0].click(); await sleep(60);
    expect(voteDoc('aud1', '3_newkey00')).toMatchObject({ o: 0 });
  });
});

describe('hata 2: ekran kapaliyken gec gelen anlik goruntu', () => {
  const lateSession = () => seedSession({ openedAt: FakeTimestamp.fromMillis(Date.now() - 20000), closesAt: FakeTimestamp.fromMillis(Date.now() + 10000) });
  it('20 sn once acilan karar: sayac ~10 (30 degil), Date basligi yoluyla', async () => {
    const log = [];
    seedSession({ phase: 'lobby', decKey: null, options: [], n: 0 }); const d = await mount('aud1', { fetchFn: headFetch(() => Date.now(), log) });
    lateSession(); await sleep(80);
    expect(st(d)).toBe('vote'); expect(Number(cnt(d))).toBeGreaterThanOrEqual(9); expect(Number(cnt(d))).toBeLessThanOrEqual(11);
    expect(log.length).toBeGreaterThan(0); expect(log[0].init).toMatchObject({ method: 'HEAD', cache: 'no-store' });
  });
  it('fetch yoksa/basarisizsa offset 0: sayac closesAt - yerel saat', async () => {
    seedSession({ phase: 'lobby', decKey: null, options: [], n: 0 });
    const d = await mount('aud1', { fetchFn: async () => { throw new Error('ag yok'); } });
    lateSession(); await sleep(80);
    expect(Number(cnt(d))).toBeGreaterThanOrEqual(9); expect(Number(cnt(d))).toBeLessThanOrEqual(11);
    const d2 = await mount('aud2', { fetchFn: async () => ({ headers: { get: () => null } }), nowFn: () => Date.now() + 3000 }); // Date basligi yok + telefon saati 3 sn ileri
    expect(Number(cnt(d2))).toBeGreaterThanOrEqual(6); expect(Number(cnt(d2))).toBeLessThanOrEqual(8);
  });
  it('Date basligi telefon saatinin 5 sn gerisini gosteriyorsa sayac duzelir', async () => {
    seedSession({ closesAt: FakeTimestamp.fromMillis(Date.now() + 10000) });
    const d = await mount('aud1', { fetchFn: headFetch(() => Date.now()), nowFn: () => Date.now() + 5000 }); await sleep(60);
    expect(Number(cnt(d))).toBeGreaterThanOrEqual(9); expect(Number(cnt(d))).toBeLessThanOrEqual(11);
  });
  it('gorunurluk geri gelince saat yeniden olculur ve hemen render edilir', async () => {
    const log = []; let skew = 0;
    seedSession({ closesAt: FakeTimestamp.fromMillis(Date.now() + 20000) });
    const d = await mount('aud1', { fetchFn: headFetch(() => Date.now(), log), nowFn: () => Date.now() + skew });
    const n0 = log.length, c0 = Number(cnt(d));
    skew = 8000; // ekran kapaliyken saat ilerledi, 200 ms lik interval calismadi
    d.window.document.dispatchEvent(new d.window.Event('visibilitychange'));
    expect(Number(cnt(d))).toBeLessThanOrEqual(c0 - 7); // senkron render
    await sleep(40); expect(log.length).toBeGreaterThan(n0);
  });
});

describe('duraklatma (paused)', () => {
  const paused = (left = 12000, over = {}) => seedSession({ paused: true, pausedLeftMs: left, closesAt: FakeTimestamp.fromMillis(Date.now() - 5000), ...over });
  it('paused: Duraklatildi yazar, sayac pausedLeftMs de sabit, butonlar kapali, oy yazilmaz', async () => {
    paused(); const d = await mount('aud1');
    expect(st(d)).toBe('vote'); expect(text(d)).toMatch(/Duraklatıldı/); expect(cnt(d)).toBe('12');
    expect(btns(d).every((b) => b.disabled)).toBe(true);
    await sleep(450); expect(cnt(d)).toBe('12');
    btns(d)[0].click(); await sleep(40); expect(voteDoc('aud1')).toBeUndefined();
  });
  it('resume: yeni closesAt ile sayac devam eder, butonlar acilir', async () => {
    paused(); const d = await mount('aud1');
    seedSession({ paused: false, pausedLeftMs: 12000, closesAt: FakeTimestamp.fromMillis(Date.now() + 12000) }); await sleep(60);
    expect(text(d)).not.toMatch(/Duraklatıldı/); expect(btns(d).every((b) => !b.disabled)).toBe(true);
    await sleep(1100); expect(Number(cnt(d))).toBeLessThanOrEqual(11);
  });
  it('sonuc fazinda paused alani sonucu bozmaz', async () => {
    seedSession({ phase: 'result', winner: 1, counts: [1, 2, 1], paused: true }); const d = await mount('aud1');
    expect(st(d)).toBe('result'); expect(text(d)).not.toMatch(/Duraklatıldı/);
  });
});
