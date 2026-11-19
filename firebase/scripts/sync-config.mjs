// ../firebase-config.js (gercek web config) -> public/firebase-config.js (statik, GitHub Pages / Hosting icin yanina kopya)
import fs from 'node:fs';
const src = new URL('../../firebase-config.js', import.meta.url), dst = new URL('../public/firebase-config.js', import.meta.url);
if (!fs.existsSync(src)) { console.error('Bulunamadi: ../firebase-config.js. firebase-config.example.js dosyasini kopyalayip doldurun.'); process.exit(1); }
fs.copyFileSync(src, dst); console.log('public/firebase-config.js guncellendi');
