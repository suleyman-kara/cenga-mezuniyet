import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const VC = require('../../vote-core.js');

const T = 1_000_000; // closesAt (ms)
const seq = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };

describe('tally', () => {
  it('sifir oy -> sifirlardan olusan dizi', () => {
    expect(VC.tally([], 3, T)).toEqual([0, 0, 0]);
  });
  it('oylari secenege gore sayar', () => {
    const v = [{ o: 0, at: 1 }, { o: 2, at: 2 }, { o: 2, at: 3 }, { o: 1, at: 4 }, { o: 2, at: T }];
    expect(VC.tally(v, 3, T)).toEqual([1, 1, 3]);
  });
  it('gec oyu (at > closesAt) haric tutar, tam sinir dahil', () => {
    const v = [{ o: 0, at: T }, { o: 0, at: T + 1 }, { o: 1, at: T + 900 }];
    expect(VC.tally(v, 2, T)).toEqual([1, 0]);
  });
  it('sinir disi / gecersiz o yok sayilir', () => {
    const v = [{ o: -1, at: 1 }, { o: 3, at: 1 }, { o: 1.5, at: 1 }, { o: '1', at: 1 }, { o: null, at: 1 }, { o: NaN, at: 1 }, { o: 1, at: 1 }];
    expect(VC.tally(v, 3, T)).toEqual([0, 1, 0]);
  });
  it('at eksikse (sunucu zamani henuz yok) sayilmaz', () => {
    expect(VC.tally([{ o: 0 }, { o: 0, at: null }], 2, T)).toEqual([0, 0]);
  });
  it('Firestore Timestamp benzeri (toMillis) at kabul eder', () => {
    const ts = (ms) => ({ toMillis: () => ms });
    expect(VC.tally([{ o: 1, at: ts(5) }, { o: 1, at: ts(T + 1) }], 2, T)).toEqual([0, 1]);
  });
  it('closesAt de Timestamp benzeri olabilir', () => {
    expect(VC.tally([{ o: 0, at: 5 }], 1, { toMillis: () => 10 })).toEqual([1]);
  });
});

describe('pickWinner', () => {
  it('en cok oy alan kazanir', () => {
    expect(VC.pickWinner([1, 5, 2], { rng: () => 0.5 })).toBe(1);
  });
  it('esitlikte yalnizca esit olanlar arasindan rng ile secer (deterministik)', () => {
    expect(VC.pickWinner([4, 1, 4], { rng: () => 0 })).toBe(0);
    expect(VC.pickWinner([4, 1, 4], { rng: () => 0.99 })).toBe(2);
    // 1. indeks asla secilmez
    for (const r of [0, 0.2, 0.49, 0.5, 0.8, 0.999]) expect([0, 2]).toContain(VC.pickWinner([4, 1, 4], { rng: () => r }));
  });
  it('hic oy yoksa ve forced yoksa tum secenekler arasindan rastgele', () => {
    expect(VC.pickWinner([0, 0, 0], { rng: () => 0 })).toBe(0);
    expect(VC.pickWinner([0, 0, 0], { rng: () => 0.5 })).toBe(1);
    expect(VC.pickWinner([0, 0, 0], { rng: () => 0.999 })).toBe(2);
  });
  it('forced her zaman kazanir (oy olsa da)', () => {
    expect(VC.pickWinner([9, 0, 0], { forced: 2, rng: () => 0 })).toBe(2);
    expect(VC.pickWinner([0, 0], { forced: 0, rng: () => 0.99 })).toBe(0);
  });
  it('gecersiz forced yok sayilir', () => {
    expect(VC.pickWinner([1, 5], { forced: 7, rng: () => 0 })).toBe(1);
    expect(VC.pickWinner([1, 5], { forced: -1, rng: () => 0 })).toBe(1);
    expect(VC.pickWinner([1, 5], { forced: null, rng: () => 0 })).toBe(1);
  });
  it('rng verilmezse Math.random kullanir ve gecerli indeks doner', () => {
    for (let i = 0; i < 50; i++) { const w = VC.pickWinner([0, 0, 0]); expect([0, 1, 2]).toContain(w); }
  });
  it('rng 1 e cok yakin olsa bile aralik disina cikmaz', () => {
    expect(VC.pickWinner([0, 0], { rng: () => 1 })).toBe(1);
  });
  it('esitlik dagilimi yaklasik esit (rastgelelik gercek)', () => {
    const c = [0, 0]; for (let i = 0; i < 2000; i++) c[VC.pickWinner([3, 3])]++;
    expect(c[0]).toBeGreaterThan(800); expect(c[1]).toBeGreaterThan(800);
  });
});

describe('remainingMs', () => {
  it('kalan sureyi hesaplar', () => { expect(VC.remainingMs(10_000, 4_000, 0)).toBe(6_000); });
  it('sunucu saat farkini (offset) dikkate alir', () => {
    // sunucu saati yerelden 2 sn ileri: simdi (sunucu) = 4000+2000
    expect(VC.remainingMs(10_000, 4_000, 2_000)).toBe(4_000);
  });
  it('negatif olmaz', () => { expect(VC.remainingMs(10_000, 20_000, 0)).toBe(0); });
  it('offset varsayilan 0', () => { expect(VC.remainingMs(10_000, 4_000)).toBe(6_000); });
});

describe('makeDecKey', () => {
  it('index_hash bicimi, "__" ve "/" icermez', () => {
    const k = VC.makeDecKey(3, { rng: seq(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8) });
    expect(k).toMatch(/^3_[a-z0-9]{6,}$/);
    expect(k).not.toContain('__'); expect(k).not.toContain('/');
  });
  it('ayni index icin bile her cagri benzersiz', () => {
    const s = new Set(); for (let i = 0; i < 500; i++) s.add(VC.makeDecKey(0));
    expect(s.size).toBe(500);
  });
  it('farkli index farkli anahtar', () => {
    const r = () => 0.123456;
    expect(VC.makeDecKey(1, { rng: r })).not.toBe(VC.makeDecKey(2, { rng: r }));
  });
});

describe('percents', () => {
  it('sifir oyda hepsi 0', () => { expect(VC.percents([0, 0, 0])).toEqual([0, 0, 0]); });
  it('toplam her zaman 100 (1/3 ornegi)', () => {
    const p = VC.percents([1, 1, 1]); expect(p.reduce((a, b) => a + b, 0)).toBe(100);
  });
  it('motordaki paintVotes ile ayni: yuvarla, farki en buyuge ekle', () => {
    expect(VC.percents([1, 1, 1])).toEqual([34, 33, 33]);
    expect(VC.percents([2, 1])).toEqual([67, 33]);
    expect(VC.percents([1, 2])).toEqual([33, 67]);
    expect(VC.percents([1, 0])).toEqual([100, 0]);
  });
  it('rastgele dagilimlarda toplam 100', () => {
    for (let t = 0; t < 300; t++) {
      const n = 2 + (t % 3); const c = Array.from({ length: n }, () => Math.floor(Math.random() * 40));
      if (c.every((x) => x === 0)) continue;
      const p = VC.percents(c);
      expect(p.reduce((a, b) => a + b, 0)).toBe(100);
      expect(p.every((x) => x >= 0 && x <= 100)).toBe(true);
    }
  });
});

describe('UMD', () => {
  it('Node da module.exports, tarayicida global VoteCore olarak yuklenir', () => {
    const fs = require('node:fs'); const vm = require('node:vm');
    const src = fs.readFileSync(require.resolve('../../vote-core.js'), 'utf8');
    const sandbox = {}; sandbox.window = sandbox; sandbox.self = sandbox; vm.createContext(sandbox);
    vm.runInContext(src, sandbox);
    expect(typeof sandbox.VoteCore.tally).toBe('function');
    expect(typeof sandbox.VoteCore.pickWinner).toBe('function');
  });
});
