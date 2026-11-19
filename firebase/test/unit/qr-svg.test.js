import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import jsQR from 'jsqr';
const require = createRequire(import.meta.url);
const { qrSvg } = require('../../qr-svg.js');

// SVG'yi (kendi cikti bicimimiz) RGBA piksel dizisine rasterlestirir.
function rasterize(svg, scale = 8) {
  const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/); expect(vb).toBeTruthy();
  const S = Number(vb[1]); expect(Number(vb[2])).toBe(S);
  const W = S * scale, px = new Uint8ClampedArray(W * W * 4).fill(255);
  const d = svg.match(/<path[^>]* d="([^"]+)"/)[1];
  for (const m of d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    const x0 = Number(m[1]) * scale, y0 = Number(m[2]) * scale;
    for (let y = y0; y < y0 + scale; y++) for (let x = x0; x < x0 + scale; x++) { const i = (y * W + x) * 4; px[i] = px[i + 1] = px[i + 2] = 0; px[i + 3] = 255; }
  }
  return { data: px, width: W, height: W, S };
}

describe('qrSvg', () => {
  const URLS = ['https://x.web.app/v/?s=ab12cd', 'https://mezuniyet-oylama-2026.web.app/v/?s=k7m2pq', 'https://example.com/v/?s=' + 'a'.repeat(60)];
  it('gecerli, kare, beyaz zeminli SVG string doner', () => {
    const s = qrSvg(URLS[0]);
    expect(typeof s).toBe('string'); expect(s.startsWith('<svg')).toBe(true); expect(s.endsWith('</svg>')).toBe(true);
    expect(s).toContain('xmlns="http://www.w3.org/2000/svg"'); expect(s).toContain('fill="#fff"');
    const r = rasterize(s); expect(r.S).toBeGreaterThanOrEqual(21 + 8); // en az v1 + 4'er sessiz bolge
  });
  it('boyut URL uzunluguyla buyur, ayni girdi ayni cikti', () => {
    expect(qrSvg(URLS[0])).toBe(qrSvg(URLS[0]));
    expect(rasterize(qrSvg(URLS[2])).S).toBeGreaterThan(rasterize(qrSvg(URLS[0])).S);
  });
  for (const u of URLS) {
    it(`jsQR ile cozulur: ${u.slice(0, 45)}...`, () => {
      const r = rasterize(qrSvg(u));
      const res = jsQR(r.data, r.width, r.height);
      expect(res).not.toBeNull(); expect(res.data).toBe(u);
    });
  }
  it('bos / gecersiz girdi hata firlatir', () => {
    expect(() => qrSvg('')).toThrow(); expect(() => qrSvg(null)).toThrow();
  });
  it('tarayicida global qrcode ile <script> olarak calisir', async () => {
    const fs = require('node:fs'), vm = require('node:vm');
    const sb = {}; sb.window = sb; sb.self = sb; vm.createContext(sb);
    vm.runInContext(fs.readFileSync(require.resolve('../../vendor/qr.js'), 'utf8'), sb);
    vm.runInContext(fs.readFileSync(require.resolve('../../qr-svg.js'), 'utf8'), sb);
    expect(sb.QrSvg.qrSvg(URLS[0]).startsWith('<svg')).toBe(true);
  });
});
