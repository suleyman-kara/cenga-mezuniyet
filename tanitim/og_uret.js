// site/vitrin/og.jpg (1200×627, LinkedIn/OG önizlemesi) üretir: tanitim/og-sablon.html → Playwright ekran görüntüsü.
// Kullanım: node tanitim/og_uret.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 627 } });
  await p.goto('file://' + path.join(__dirname, 'og-sablon.html'));
  await p.waitForLoadState('networkidle');
  const cikti = path.join(__dirname, '..', 'site', 'vitrin', 'og.jpg');
  await p.screenshot({ path: cikti, type: 'jpeg', quality: 86 });
  await b.close();
  console.log('yazıldı:', path.relative(process.cwd(), cikti));
})();
