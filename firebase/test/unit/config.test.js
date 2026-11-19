import { describe, it, expect } from 'vitest';
import fs from 'node:fs'; import path from 'node:path';
const root = new URL('../../', import.meta.url).pathname;
const j = (f) => JSON.parse(fs.readFileSync(root + f, 'utf8'));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
describe('firebase.json / yayin', () => {
  const cfg = j('firebase.json');
  it('hosting yalnizca public/ yayimlar', () => { expect(cfg.hosting.public).toBe('public'); });
  it('ignore listesi wav, key, node_modules, noktali dosyalari kapsar', () => {
    for (const g of ['**/*.wav', '**/*key*', '**/node_modules/**', '**/.*']) expect(cfg.hosting.ignore).toContain(g);
  });
  it('firestore kurallari baglanmis ve dosya mevcut, tek parca', () => {
    expect(cfg.firestore.rules).toBe('firestore.rules');
    const r = fs.readFileSync(root + 'firestore.rules', 'utf8');
    expect(r).toMatch(/rules_version = '2'/); expect(r).not.toMatch(/\bimport\b/);
  });
  it('emulator ayarlari: firestore portu tanimli', () => { expect(cfg.emulators.firestore.port).toBe(8080); });
  it('.firebaserc varsayilan proje cenga-mezuniyet', () => { expect(j('.firebaserc').projects.default).toBe('cenga-mezuniyet'); });
  it('public/ altinda ses, anahtar veya gizli dosya yok', () => {
    for (const f of walk(root + 'public')) { expect(f).not.toMatch(/\.wav$/); expect(path.basename(f).toLowerCase()).not.toContain('key'); expect(path.basename(f)).not.toMatch(/^\./); }
  });
  it('public/firebase-config.js gercek proje kimligini icerir, example yer tutucu', () => {
    expect(fs.readFileSync(root + 'public/firebase-config.js', 'utf8')).toContain('cenga-mezuniyet');
    expect(fs.readFileSync(root + 'firebase-config.example.js', 'utf8')).toContain('YOUR_PROJECT_ID');
  });
  it('package.json scriptleri: test:unit, test:rules, test:int, test', () => {
    const s = j('package.json').scripts; for (const k of ['test:unit', 'test:rules', 'test:int', 'test']) expect(s[k]).toBeTruthy();
  });
});
