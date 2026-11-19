// MockSource: eski sahte oylama davranisi (rastgele oy akisi + agirliklar). Otomatik oynatma / video kaydi icin.
// VoteSource arayuzu: createSession, open, onUpdate, forceWin, close, voteUrl  (bkz. README)
const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';

export function createMockSource(opts = {}) {
  const VC = opts.VoteCore || globalThis.VoteCore;
  const rng = opts.rng || Math.random;
  const tickMs = opts.tickMs || 100;
  const base = opts.voteBaseUrl || 'https://example.web.app';
  let cb = null, timer = null, V = null;

  function paint() {
    if (cb && V) cb({ counts: V.c.slice(), total: V.c.reduce((a, b) => a + b, 0), remainingMs: Math.max(0, Math.round((V.end - V.el) * 1000)), error: null });
  }
  function tick() {
    V.el += tickMs / 1000;
    if (V.el <= V.end + 1e-9) { // eski tick(): sure bitince oy akmaz
      const burst = opts.votesPerTick != null ? opts.votesPerTick : (V.forced !== null ? 4 : (rng() < 0.7 ? Math.floor(rng() * 3) : 0));
      for (let i = 0; i < burst; i++) {
        let r = rng(), k = 0;
        while (k < V.n - 1 && r >= V.w[k]) { r -= V.w[k]; k++; }
        V.c[k]++;
      }
    }
    paint();
  }

  return {
    async createSession() { let s = ''; for (let i = 0; i < 6; i++) s += ALPHA[Math.floor(rng() * ALPHA.length)]; return s; },
    voteUrl(sid) { return `${base}/v/?s=${sid}`; },
    onUpdate(fn) { cb = fn; return () => { if (cb === fn) cb = null; }; },
    open({ decKey, q, options, poll, durMs }) {
      clearInterval(timer);
      const n = options.length;
      let w = options.map(() => (poll ? 1 + rng() * 0.3 : 0.55 + rng()));
      const ws = w.reduce((a, b) => a + b, 0); w = w.map((x) => x / ws);
      V = { decKey, n, poll: !!poll, c: options.map(() => 0), w, el: 0, end: (durMs || 30000) / 1000, forced: null };
      timer = setInterval(tick, tickMs);
      paint();
      return Promise.resolve({ ok: true, error: null });
    },
    forceWin(i) {
      if (!V || V.forced !== null || !(i >= 0 && i < V.n)) return;
      V.forced = i; V.w = V.c.map((_, k) => (k === i ? 1 - 0.06 * (V.n - 1) : 0.06)); V.end = Math.min(V.end, V.el + 1.5);
    },
    close() {
      clearInterval(timer); timer = null;
      if (!V) return Promise.resolve({ counts: [], winner: null, forced: false, total: 0, error: 'open cagrilmadi', errors: ['open cagrilmadi'] });
      const w = VC.pickWinner(V.c, { forced: V.forced, rng });
      let o = -1; V.c.forEach((x, i) => { if (i !== w && (o < 0 || x > V.c[o])) o = i; });
      if (o >= 0 && V.c[w] <= V.c[o]) { const x = V.c[w]; V.c[w] = V.c[o] + 1; V.c[o] = x; } // eski finalize: kazanan net onde gorunsun
      paint();
      return Promise.resolve({ counts: V.c.slice(), winner: w, forced: V.forced !== null, total: V.c.reduce((a, b) => a + b, 0), error: null, errors: [] });
    },
  };
}
