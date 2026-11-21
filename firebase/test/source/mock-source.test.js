import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { createMockSource } from '../../src/mock-source.js';
globalThis.VoteCore = createRequire(import.meta.url)('../../vote-core.js');

const seeded = (seed = 7) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('MockSource (eski sahte oylama davranisi)', () => {
  it('createSession bir sid doner, voteUrl ?s=SID icerir', async () => {
    const s = createMockSource({ rng: seeded() }); const sid = await s.createSession();
    expect(sid).toMatch(/^[a-z0-9]{6}$/); expect(s.voteUrl(sid)).toContain(`?s=${sid}`);
  });
  it('100 ms de bir rastgele oy akitir; toplam artar, kalan sure azalir', async () => {
    const s = createMockSource({ rng: seeded() }); await s.createSession(); const ups = []; s.onUpdate((u) => ups.push(u));
    s.open({ decKey: 'k', q: 'q', options: ['a', 'b', 'c'], poll: false, durMs: 5000 });
    await vi.advanceTimersByTimeAsync(2000);
    const last = ups[ups.length - 1];
    expect(ups.length).toBeGreaterThanOrEqual(19); expect(last.total).toBeGreaterThan(5);
    expect(last.counts.reduce((a, b) => a + b, 0)).toBe(last.total);
    expect(last.remainingMs).toBeLessThanOrEqual(3100); expect(last.remainingMs).toBeGreaterThanOrEqual(2900);
    await vi.advanceTimersByTimeAsync(5000);
    expect(ups[ups.length - 1].remainingMs).toBe(0);
  });
  it('anket (poll) agirliklari neredeyse esit, normal karar agirliklari dengesiz olabilir', async () => {
    const run = async (poll) => {
      const s = createMockSource({ rng: seeded(11) }); await s.createSession(); let last;
      s.onUpdate((u) => { last = u; });
      s.open({ decKey: 'k', q: 'q', options: ['a', 'b'], poll, durMs: 60000 });
      await vi.advanceTimersByTimeAsync(40000); const r = await s.close(); return r.counts;
    };
    const p = await run(true); const t = p[0] + p[1];
    expect(Math.abs(p[0] - p[1]) / t).toBeLessThan(0.15);
  });
  it('close: en cok oy alan kazanir ve sayilarda net onde olur', async () => {
    const s = createMockSource({ rng: seeded(3) }); await s.createSession();
    s.open({ decKey: 'k', q: 'q', options: ['a', 'b', 'c'], poll: false, durMs: 3000 });
    await vi.advanceTimersByTimeAsync(3100);
    const r = await s.close();
    const others = r.counts.filter((_, i) => i !== r.winner);
    expect(r.counts[r.winner]).toBeGreaterThan(Math.max(...others)); expect(r.error).toBeNull();
  });
  it('forceWin: sure 1.5 sn ye kisalir, secilen kazanir', async () => {
    const s = createMockSource({ rng: seeded(5) }); await s.createSession(); const ups = []; s.onUpdate((u) => ups.push(u));
    s.open({ decKey: 'k', q: 'q', options: ['a', 'b', 'c'], poll: false, durMs: 30000 });
    await vi.advanceTimersByTimeAsync(1000); s.forceWin(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(ups[ups.length - 1].remainingMs).toBeLessThanOrEqual(1500);
    await vi.advanceTimersByTimeAsync(1600);
    const r = await s.close(); expect(r.winner).toBe(1); expect(r.forced).toBe(true);
    expect(r.counts[1]).toBeGreaterThan(Math.max(r.counts[0], r.counts[2]));
  });
  it('forceWin gecersiz indeksi yok sayar; ikinci forceWin yok sayilir', async () => {
    const s = createMockSource({ rng: seeded(5) }); await s.createSession();
    s.open({ decKey: 'k', q: 'q', options: ['a', 'b'], poll: false, durMs: 3000 });
    s.forceWin(5); s.forceWin(0); s.forceWin(1);
    await vi.advanceTimersByTimeAsync(2000); const r = await s.close(); expect(r.winner).toBe(0);
  });
  it('sifir oyda close rastgele secenek doner (rng enjekte)', async () => {
    const s = createMockSource({ rng: () => 0.9, votesPerTick: 0 }); await s.createSession();
    s.open({ decKey: 'k', q: 'q', options: ['a', 'b', 'c'], poll: false, durMs: 500 });
    await vi.advanceTimersByTimeAsync(600); const r = await s.close(); expect(r.winner).toBe(2); expect(r.total).toBeGreaterThanOrEqual(0);
  });
  it('pause: sahte akis duraksar, kalan sure ve oylar sabit; resume devam ettirir', async () => {
    const s = createMockSource({ rng: seeded(9) }); await s.createSession(); const ups = []; s.onUpdate((u) => ups.push(u));
    s.open({ decKey: 'k', q: 'q', options: ['a', 'b', 'c'], poll: false, durMs: 10000 });
    await vi.advanceTimersByTimeAsync(2000); const r = await s.pause(); expect(r.ok).toBe(true);
    const a = ups[ups.length - 1]; await vi.advanceTimersByTimeAsync(5000); const b = ups[ups.length - 1];
    expect(b.remainingMs).toBe(a.remainingMs); expect(b.total).toBe(a.total); expect(b.remainingMs).toBeGreaterThan(0);
    await s.resume(); await vi.advanceTimersByTimeAsync(1000);
    const c = ups[ups.length - 1]; expect(c.remainingMs).toBeLessThan(a.remainingMs); expect(c.remainingMs).toBeGreaterThan(a.remainingMs - 1200);
  });
  it('pause/resume karar yokken de cokmez', async () => {
    const s = createMockSource({ rng: seeded() }); expect((await s.pause()).ok).toBe(true); expect((await s.resume()).ok).toBe(true);
  });
});

describe('MockSource: oturum surdurme ve kumanda (bos surumler)', () => {
  it('resumeSession sid yi aynen doner; bos sid reddedilir', async () => {
    const s = createMockSource({ rng: seeded() });
    await expect(s.resumeSession('abc123')).resolves.toBe('abc123');
    await expect(s.resumeSession('')).rejects.toThrow();
  });
  it('kumanda metotlari zararsiz: url null, dinleyiciler kapatilabilir, push firlatmaz', async () => {
    const s = createMockSource({ rng: seeded() }); await s.createSession();
    expect(await s.createRemote()).toEqual({ secret: null, url: null });
    expect(await s.resumeRemote('x')).toMatchObject({ url: null, paired: false });
    expect(await s.resetRemote()).toEqual({ secret: null, url: null });
    const off1 = s.onRemoteCommand(() => {}), off2 = s.onRemoteStatus(() => {});
    expect(typeof off1).toBe('function'); expect(typeof off2).toBe('function'); off1(); off2();
    expect(() => s.pushRemoteState({ pos: 1 })).not.toThrow();
    await expect(s.end()).resolves.toBeUndefined();
  });
});
