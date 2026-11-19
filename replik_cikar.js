// Bir oyunun index.html dosyasındaki hikâyeden seslendirilecek replikleri çıkarır -> <oyun>/ses/replikler.json
// Kullanım: node replik_cikar.js <oyun_klasoru>
// Hikâye bölümü ("/* ---------- HİKÂYE" ile "/* ---------- SES" arası) Node'da çalıştırılır: orada DOM erişimi olmamalı.
// Okunuş düzeltmeleri: <oyun>/okunus.js  ->  module.exports = [[aranan(string|RegExp), okunacak], ...]
//   (ekrandaki yazı değişmez; yalnızca seslendirilecek metin değişir. Sıra önemlidir: uzun/özel olan önce.)
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.cwd(), process.argv[2] || '.');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const a = html.indexOf('/* ---------- HİKÂYE'), b = html.indexOf('/* ---------- SES');
if (a < 0 || b < 0) throw new Error('HİKÂYE / SES işaret yorumları bulunamadı');
const G = new Function(html.slice(a, b) + ';return {build,A,VOICE,hid,decVid,endVid};')();

const okunusYol = path.join(dir, 'okunus.js');
const DUZELT = (fs.existsSync(okunusYol) ? require(okunusYol) : []).concat([[/[«»]/g, ''], [/\s+\.\.\.\s+/g, ' ... ']]);
const oku = t => DUZELT.reduce((s, [x, y]) => typeof x === 'string' ? s.split(x).join(y) : s.replace(x, y), t).trim();
const SAY = ['Bir', 'İki', 'Üç', 'Dört'];
const kararMetni = d => oku(d.q + ' ' + d.o.map((o, i) => `${SAY[i]}: ${o[0]}.`).join(' '));

const out = new Map(), sonlar = {}, uzunluk = [];
const ekle = (id, voice, text, ham) => {
  if (!voice) throw new Error('VOICE eşlemesi yok: ' + ham);
  const eski = out.get(id);
  if (eski && eski.ham !== ham) throw new Error(`özet çakışması: "${eski.ham}" / "${ham}"`);
  out.set(id, { id, voice, text, ham });
};
(function gez(c) {
  const s = G.build(c);
  const d = s.find(x => x.k === 'dec' && c[x.id] === undefined);
  if (d) { for (let i = 0; i < d.d.o.length; i++) gez(c.concat(i)); return; }
  uzunluk.push(s.filter(x => x.k === 'beat').length);
  for (const st of s) {
    if (st.k === 'beat' && st.text !== '...') ekle(G.hid(st.text), G.VOICE[st.who], oku(st.text), st.text);
    if (st.k === 'card' && st.type === 'end') { sonlar[st.title] = (sonlar[st.title] || 0) + 1; ekle(G.endVid(st), G.VOICE[G.A], oku(st.title + '. ' + st.moral), st.title); }
    if (st.k === 'dec') ekle(G.decVid(st.d), G.VOICE[G.A], kararMetni(st.d), st.d.q);
  }
})([]);

fs.mkdirSync(path.join(dir, 'ses'), { recursive: true });
fs.writeFileSync(path.join(dir, 'ses', 'replikler.json'), JSON.stringify([...out.values()], null, 1), 'utf8');
const say = {}; out.forEach(l => say[l.voice] = (say[l.voice] || 0) + 1);
const kar = [...out.values()].reduce((n, l) => n + l.text.length, 0);
console.log(`${out.size} replik, ${kar} karakter (~${Math.round(kar / 15 / 6) / 10} dk ses)`, JSON.stringify(say));
console.log(`${uzunluk.length} yol, yol başına ${Math.min(...uzunluk)}-${Math.max(...uzunluk)} replik; sonlar:`, JSON.stringify(sonlar));
// okunuşta sorun çıkarabilecek kalıntılar: rakam, iki nokta üst üste, Latin dışı işaret, büyük harf kısaltma
const supheli = [...out.values()].filter(l => /\d|[%_\/\\<>=#@]|\b[A-ZÇĞİÖŞÜ]{2,}\b/.test(l.text));
if (supheli.length) { console.log(`\nOKUNUŞ İÇİN GÖZDEN GEÇİR (${supheli.length}):`); supheli.forEach(l => console.log(' -', l.voice + ':', l.text)); }
