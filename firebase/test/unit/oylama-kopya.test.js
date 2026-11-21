// oyun/oylama/ altindaki kaynak kopyalari firebase/src/ ile bayt bayt ayni olmali (oyun derlemesiz, dosyalari dogrudan yukler).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
const root = new URL('../../', import.meta.url).pathname;
describe('oyun/oylama kopyalari', () => {
  for (const f of ['firebase-source.js', 'mock-source.js']) {
    it(`${f} src/ ile ayni (degistirdiyseniz: cp firebase/src/${f} oyun/oylama/)`, () => {
      const kopya = root + '../oyun/oylama/' + f;
      if (!fs.existsSync(kopya)) return; // depo disinda (yalniz firebase/) calistirildiysa
      expect(fs.readFileSync(kopya, 'utf8')).toBe(fs.readFileSync(root + 'src/' + f, 'utf8'));
    });
  }
});
