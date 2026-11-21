// public/k/index.html telefon kumandasi - jsdom + SAHTE Firestore (kurallar burada uygulanmaz; bkz. test/rules).
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { FakeBackend } from '../helpers/fake-firestore.js';

const HTML = fs.readFileSync(new URL('../../public/k/index.html', import.meta.url), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RID = 'Gizli0123456789abcdefXYZ';
const RPATH = `sessions/S1/remotes/${RID}`;
let be;
const ST = (over = {}) => ({ pos: 4, toplam: 80, faz: '', duraklat: false, oto: true, sessiz: false, kim: 'DENİZ', metin: 'Staj zorunlu: kırk iş günü.', karar: null, sonraki: 'OZAN: Ben staja başvurmadım.', ...over });
const seedRemote = (over = {}) => { be.docs.set(RPATH, { owner: null, st: null, ...over }); be.notify(); };
const setSt = (st) => { be.docs.set(RPATH, { ...be.docs.get(RPATH), st }); be.notify(); };
const mount = async (uid = 'tel1', { search = `?s=S1&r=${RID}`, wakeLock, vibrate } = {}) => {
  const c = be.client(uid); c.auth.currentUser = { uid };
  const dom = new JSDOM(HTML, { url: 'https://x.web.app/k/index.html' + search, runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) {
    w.__FB__ = { db: c.db, fs: c.fs, uid }; w.FIREBASE_CONFIG = { projectId: 'demo' };
    if (wakeLock) Object.defineProperty(w.navigator, 'wakeLock', { value: wakeLock, configurable: true });
    if (vibrate) Object.defineProperty(w.navigator, 'vibrate', { value: vibrate, configurable: true });
  } });
  await sleep(60); return dom;
};
const $ = (d, id) => d.window.document.getElementById(id);
const st = (d) => $(d, 'app').dataset.state;
const text = (d) => { const b = d.window.document.body.cloneNode(true); b.querySelectorAll('script,style').forEach((n) => n.remove()); return b.textContent; };
const cmds = () => [...be.docs.entries()].filter(([k]) => k.startsWith(RPATH + '/cmds/')).map(([, v]) => v);
const winBtns = (d) => [...d.window.document.querySelectorAll('[data-win]')];

beforeEach(() => { be = new FakeBackend(); });

describe('telefon kumandasi', () => {
  it('tek dosya: dis bagimlilik yalnizca gstatic CDN ve ../firebase-config.js; Turkce, mobil', () => {
    const urls = [...HTML.matchAll(/(?:src|href)="([^"#]+)"/g)].map((m) => m[1]);
    for (const u of urls) expect(u === '../firebase-config.js' || u.startsWith('https://www.gstatic.com/')).toBe(true);
    expect(HTML).toContain('<html lang="tr"'); expect(HTML).toContain('viewport');
  });
  it('?s veya ?r yoksa hata durumu', async () => {
    const d = await mount('a', { search: '?s=S1' }); expect(st(d)).toBe('error'); expect(text(d)).toMatch(/QR/);
  });
  it('olmayan (sifirlanmis) kumanda -> hata', async () => { const d = await mount(); expect(st(d)).toBe('error'); expect(text(d)).toMatch(/geçerli değil/); });

  it('eslesme: owner null ise kendi uid sini yazar ve hazir duruma gecer', async () => {
    seedRemote(); const d = await mount('tel1');
    expect(be.docs.get(RPATH).owner).toBe('tel1');
    expect(st(d)).toBe('ready');
  });
  it('ayni telefon yenileyince (ayni uid) yine baglanir', async () => {
    seedRemote({ owner: 'tel1', st: ST() }); const d = await mount('tel1'); expect(st(d)).toBe('ready');
  });
  it('baska telefona bagliysa uyari gosterir, komut yazmaz', async () => {
    seedRemote({ owner: 'tel1', st: ST() }); const d = await mount('tel2');
    expect(st(d)).toBe('taken');
    expect(text(d)).toContain('Bu kumanda başka bir telefona bağlı. Sunucu ekranında Shift+U ile sıfırlayın.');
    expect(be.docs.get(RPATH).owner).toBe('tel1');
    $(d, 'ileri').click(); await sleep(40); expect(cmds()).toHaveLength(0);
  });
  it('durumu cizer: kim, metin, adim sayaci, sonraki, ses/oto etiketleri', async () => {
    seedRemote({ owner: 'tel1', st: ST() }); const d = await mount('tel1');
    expect($(d, 'kim').textContent).toBe('DENİZ');
    expect($(d, 'metin').textContent).toBe('Staj zorunlu: kırk iş günü.');
    expect($(d, 'adim').textContent).toBe('5 / 80');
    expect($(d, 'sonraki').textContent).toContain('OZAN');
    expect($(d, 'ses').textContent).toMatch(/Ses açık/); expect($(d, 'oto').textContent).toMatch(/Oto açık/);
    expect($(d, 'karar').classList.contains('on')).toBe(false);
    setSt(ST({ pos: 5, kim: 'BUSE', metin: 'Deniz!', sessiz: true, oto: false })); await sleep(30);
    expect($(d, 'kim').textContent).toBe('BUSE'); expect($(d, 'adim').textContent).toBe('6 / 80');
    expect($(d, 'ses').textContent).toMatch(/Ses kapalı/); expect($(d, 'oto').textContent).toMatch(/Oto kapalı/);
  });
  it('metin HTML olarak yorumlanmaz (XSS)', async () => {
    seedRemote({ owner: 'tel1', st: ST({ metin: '<img src=x onerror=window.__x=1>', kim: '<b>x</b>' }) }); const d = await mount('tel1');
    expect(d.window.document.querySelector('#app img')).toBeNull(); expect($(d, 'metin').textContent).toContain('<img');
  });
  it('ileri/geri/ses/oto komut belgesi yazar ({c, at}); titresir', async () => {
    seedRemote({ owner: 'tel1', st: ST() }); let vib = 0; const d = await mount('tel1', { vibrate: () => { vib++; return true; } });
    for (const id of ['ileri', 'geri', 'ses', 'oto']) { $(d, id).click(); await sleep(20); }
    const cs = cmds();
    expect(cs.map((c) => c.c)).toEqual(['ileri', 'geri', 'ses', 'oto']);
    for (const c of cs) { expect(Object.keys(c).sort()).toEqual(['at', 'c']); expect(c.at).toBeTruthy(); }
    expect(vib).toBe(4); expect(text(d)).toMatch(/Gönderildi/);
  });
  it('duraklat dugmesi duruma gore duraklat/devam gonderir; duraklatilmisken ileri kapali', async () => {
    seedRemote({ owner: 'tel1', st: ST() }); const d = await mount('tel1');
    expect($(d, 'dur').textContent).toMatch(/Duraklat/); $(d, 'dur').click(); await sleep(20);
    setSt(ST({ duraklat: true })); await sleep(30);
    expect($(d, 'dur').textContent).toMatch(/Devam/); expect($(d, 'faz').textContent).toMatch(/Duraklatıldı/); expect($(d, 'ileri').disabled).toBe(true);
    $(d, 'dur').click(); await sleep(20);
    expect(cmds().map((c) => c.c)).toEqual(['duraklat', 'devam']);
  });
  it('komut yazimi basarisizsa uyari gosterir', async () => {
    seedRemote({ owner: 'tel1', st: ST() }); const d = await mount('tel1'); be.failWritesTo = '/cmds/';
    $(d, 'ileri').click(); await sleep(40); expect(text(d)).toMatch(/Gönderilemedi/);
  });
  it('oylama: secenekler canli sayilarla, kalan sure; "Bunu kazandir" kazan+a, "Oylamayi bitir" bitir gonderir', async () => {
    const karar = { q: 'Hangi kapı?', o: ['Holding', 'Startup', 'Hoca'], c: [3, 7, 1], kalan: 21, acik: true };
    seedRemote({ owner: 'tel1', st: ST({ faz: 'vote', karar }) }); const d = await mount('tel1');
    expect($(d, 'karar').classList.contains('on')).toBe(true);
    expect($(d, 'kq').textContent).toBe('Hangi kapı?');
    expect(winBtns(d)).toHaveLength(3);
    expect(winBtns(d).map((b) => b.querySelector('.c').textContent)).toEqual(['3', '7', '1']);
    expect(winBtns(d)[1].textContent).toContain('Startup'); expect(winBtns(d)[1].textContent).toContain('Bunu kazandır');
    expect(Number($(d, 'kalan').textContent)).toBeGreaterThanOrEqual(20);
    setSt(ST({ faz: 'vote', karar: { ...karar, c: [4, 9, 1], kalan: 15 } })); await sleep(30);
    expect(winBtns(d).map((b) => b.querySelector('.c').textContent)).toEqual(['4', '9', '1']);
    expect(Number($(d, 'kalan').textContent)).toBeLessThanOrEqual(15);
    winBtns(d)[2].click(); await sleep(20); $(d, 'bitir').click(); await sleep(20);
    const cs = cmds(); expect(cs[0]).toMatchObject({ c: 'kazan', a: 2 }); expect(Object.keys(cs[0]).sort()).toEqual(['a', 'at', 'c']);
    expect(cs[1]).toMatchObject({ c: 'bitir' }); expect('a' in cs[1]).toBe(false);
  });
  it('oylama kapaninca (sonuc) secenek dugmeleri ve bitir kapali; karar bitince bolum gizlenir', async () => {
    const karar = { q: 'Q?', o: ['A', 'B'], c: [1, 2], kalan: 0, acik: false };
    seedRemote({ owner: 'tel1', st: ST({ faz: 'result', karar }) }); const d = await mount('tel1');
    expect(winBtns(d).every((b) => b.disabled)).toBe(true); expect($(d, 'bitir').disabled).toBe(true);
    setSt(ST()); await sleep(30); expect($(d, 'karar').classList.contains('on')).toBe(false);
  });
  it('sunucu kumandayi sifirlarsa (belge silinir) hata gosterir', async () => {
    seedRemote({ owner: 'tel1', st: ST() }); const d = await mount('tel1');
    be.docs.delete(RPATH); be.notify(); await sleep(30);
    expect(st(d)).toBe('error');
  });
  it('baglanti kopma/gelme bildirimi', async () => {
    seedRemote({ owner: 'tel1', st: ST() }); const d = await mount('tel1'); const app = $(d, 'app');
    d.window.dispatchEvent(new d.window.Event('offline')); await sleep(20); expect(app.dataset.conn).toBe('off'); expect(text(d)).toMatch(/Bağlantı/);
    d.window.dispatchEvent(new d.window.Event('online')); await sleep(20); expect(app.dataset.conn).toBe('on');
  });
  it('Wake Lock desteklenirse istenir; hata verirse sessiz gecilir', async () => {
    seedRemote({ owner: null }); let called = 0;
    await mount('a', { wakeLock: { request: async () => { called++; return { release() {} }; } } }); expect(called).toBe(1);
    const d = await mount('a', { wakeLock: { request: async () => { throw new Error('NotAllowed'); } } }); expect(st(d)).toBe('ready');
  });
});
