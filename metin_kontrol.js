// Dondurulmuş hikâye metninin değişmediğini doğrular.
// Kullanım: node metin_kontrol.js <oyun>            -> <oyun>/ses/donmus.json ile karşılaştırır
//           node metin_kontrol.js <oyun> --dondur   -> şimdiki metni dondurur (yalnızca yönetici çalıştırır)
const fs = require('fs'), path = require('path');
const KULLANIM = 'Kullanım: node metin_kontrol.js <oyun>            (ör. node metin_kontrol.js oyun)\n' +
                 '          node metin_kontrol.js <oyun> --dondur   (şimdiki metni dondurur)';
if (!process.argv[2] || process.argv[2].startsWith('--')) { console.error('HATA: oyun klasörü verilmedi.\n' + KULLANIM); process.exit(2); }
const dir = path.resolve(process.cwd(), process.argv[2]);
const htmlYol = path.join(dir, 'index.html');
if (!fs.existsSync(htmlYol)) { console.error('HATA: ' + htmlYol + ' yok.\n' + KULLANIM); process.exit(2); }
const html = fs.readFileSync(htmlYol, 'utf8');
const a = html.indexOf('/* ---------- HİKÂYE'), b = html.indexOf('/* ---------- SES');
if (a < 0 || b < 0) { console.log('HATA: HİKÂYE / SES işaret yorumları yok'); process.exit(1); }
const G = new Function(html.slice(a, b) + ';return {build,A,VOICE,hid,decVid,endVid};')();
const now = {};
(function gez(c) {
  const s = G.build(c), d = s.find(x => x.k === 'dec' && c[x.id] === undefined);
  if (d) { for (let i = 0; i < d.d.o.length; i++) gez(c.concat(i)); return; }
  for (const st of s) {
    if (st.k === 'beat' && st.text !== '...') now[G.hid(st.text)] = G.VOICE[st.who] + ' | ' + st.text;
    if (st.k === 'card' && st.type === 'end') now[G.endVid(st)] = 'son | ' + st.title + ' | ' + st.moral;
    if (st.k === 'dec') now[G.decVid(st.d)] = 'karar | ' + st.d.q + ' | ' + st.d.o.map(o => o[0]).join(' | ');
  }
})([]);
const f = path.join(dir, 'ses', 'donmus.json');
if (process.argv.includes('--dondur')) { fs.writeFileSync(f, JSON.stringify(now, null, 1), 'utf8'); console.log('donduruldu:', Object.keys(now).length, 'kimlik'); process.exit(0); }
if (!fs.existsSync(f)) {
  console.error('HATA: ' + path.relative(process.cwd(), f) + ' yok — önce `node metin_kontrol.js ' + process.argv[2] + ' --dondur` ile dondurun.');
  process.exit(2);
}
const eski = JSON.parse(fs.readFileSync(f, 'utf8'));
const kayip = Object.keys(eski).filter(k => now[k] !== eski[k]), yeni = Object.keys(now).filter(k => !(k in eski));
if (!kayip.length && !yeni.length) { console.log('METİN AYNI:', Object.keys(now).length, 'kimlik'); process.exit(0); }
console.log('METİN DEĞİŞMİŞ! Seslendirme eşleşmesi kopar. Geri al.');
kayip.forEach(k => console.log(' - kayıp/değişmiş:', eski[k]));
yeni.forEach(k => console.log(' + yeni:', now[k]));
process.exit(1);
