// Mezuniyet.exe · hikâye doğrulaması.  Kullanım: node hikaye/dogrula.js [index.html]
// Argüman verilirse hikâye bölümü o dosyadan (HİKÂYE..SES arası), verilmezse hikaye/build.js'ten okunur.
const fs = require('fs'), path = require('path');
const arg = process.argv[2];
let src;
if (arg) { const h = fs.readFileSync(arg, 'utf8'); src = h.slice(h.indexOf('/* ---------- HİKÂYE'), h.indexOf('/* ---------- SES')); }
else src = fs.readFileSync(path.join(__dirname, 'build.js'), 'utf8');
const G = new Function(src + ';return {build,A,VOICE,hid,decVid,endVid,sonSec:typeof sonSec!=="undefined"?sonSec:null};')();

// ---- sözleşme listeleri (oyun/sahne-sozlesmesi.md) ----
const BG = 'yokus koridor cayocagi holding startup oda soylesi kahve lab kariyer hackathon mezuniyet mulakat kafe bayram ofis bank dolmus'.split(' ');
const V = ['', 'gece', 'aksam', 'pizza', 'asistan', 'lobi'];
const POZ = 'look wave point shrug facepalm think cheer clap shock sad worry panic phone laptop type present smug calm heart bow brow sip write wag weigh alarm sit tired selfie'.split(' ');
const IFADE = 'happy sad shock skeptic smug stern worried tired'.split(' ');
const KAR = 'deniz ozan buse tolga asuman'.split(' ');
const PANEL = 'hava github repo yaka klasor linkedin lbildirim lgonderi akis ilan mail mailkutu jira jirakart leetcode fotokopi kartvizit insta defter afis tablo arama dosya fis whatsapp davet takvim caps reels dm kayit etkinlik cv3 balonlar durum kod mulakat kolay epilog pencere'.split(' ');
const FX = /^(shake|confetti|flash|sweat|kep|plus0|ding|click|whoosh|thud|zoom|korna|big:.+|bubble:.+|stamp:.+|p:.+)$/;
const MUZIK = 'lofi synth toren gergin melankoli bayram s1 s2 s3 s4 s5 epilog none'.split(' ');
const HUDP = ['deniz', 'ozan', 'buse', 'tolga', 'asuman', 0];
const sorun = new Set(); const hata = m => sorun.add(m);

const pozOk = (p, ctx) => { const [a, e] = String(p).split(':'); if (!POZ.includes(a)) hata(`bilinmeyen poz "${a}" @ ${ctx}`); if (e && !IFADE.includes(e)) hata(`bilinmeyen ifade "${e}" @ ${ctx}`); };
const castOk = (c, ctx) => (c || []).forEach(x => { if (!KAR.includes(x[0])) hata(`bilinmeyen karakter ${x[0]} @ ${ctx}`); pozOk(x[2] || 'look', ctx); if (x[3] && !['inL', 'inR'].includes(x[3])) hata(`giriş ${x[3]} @ ${ctx}`); });
const panelOk = (p, ctx) => { if (p && !PANEL.includes(p.type)) hata(`bilinmeyen panel ${p.type} @ ${ctx}`); };
const fxOk = (f, ctx) => [].concat(f || []).forEach(x => { if (!FX.test(x)) hata(`bilinmeyen fx ${x} @ ${ctx}`); });

const ID = new Map();               // hid -> {who,text}
const benzersiz = new Map();        // beat metni -> who
const yollar = []; const sonSay = {}; const sonSayK = {};
const sure = st => {
  let t = 0, n = 0, mon = 0, kar = 0;
  for (const x of st) {
    if (x.k === 'beat') { if (x.text !== '...') { n++; t += x.text.length / 13 + 0.8; } }
    else if (x.k === 'dec') t += 40;
    else if (x.k === 'montage') { const m = x.frames.reduce((a, f) => a + f.ms, 0) / 1000; t += m; mon += m; }
    else if (x.k === 'card') { t += 5; kar++; }
  }
  return { t, n, mon, kar };
};
const kontrolBeat = (x, ctx) => {
  if (!BG.includes(x.bg)) hata(`bilinmeyen bg ${x.bg} @ ${ctx}`);
  if (!V.includes(x.v || '')) hata(`bilinmeyen v ${x.v} @ ${ctx}`);
  if (!G.VOICE[x.who]) hata(`VOICE yok: ${x.who}`);
  castOk(x.c, ctx); panelOk(x.panel, ctx); fxOk(x.fx, ctx);
  if (x.muzik && !MUZIK.includes(x.muzik)) hata(`bilinmeyen müzik ${x.muzik}`);
  if (x.hudp !== undefined && !HUDP.includes(x.hudp)) hata(`hudp ${x.hudp}`);
  const kadro = (x.c || []).map(y => y[0]);
  (x.cue || []).forEach(q => {
    if (q[1] === 'fx') fxOk(q[2], ctx);
    else { if (!kadro.includes(q[1])) hata(`cue kadroda olmayan karakter ${q[1]} @ ${ctx}`); if (String(q[2])[0] !== '@') pozOk(q[2], ctx); }
    if (!(q[0] >= 0 && q[0] <= 1)) hata(`cue oranı ${q[0]} @ ${ctx}`);
  });
  const id = G.hid(x.text), e = ID.get(id);
  if (e && (e.text !== x.text || e.who !== x.who)) hata(`hid çakışması: [${e.who}] ${e.text} / [${x.who}] ${x.text}`);
  ID.set(id, { who: x.who, text: x.text });
  if (benzersiz.has(x.text) && benzersiz.get(x.text) !== x.who) hata(`aynı metin farklı karakter: ${x.text}`);
  benzersiz.set(x.text, x.who);
};

(function gez(c) {
  const s = G.build(c);
  const d = s.find(x => x.k === 'dec' && c[x.id] === undefined);
  if (d) {
    if (d.id !== c.length) hata(`karar id sırası bozuk: ${d.id} beklenen ${c.length}`);
    if (d.d.o.length < 2 || d.d.o.length > 4) hata('seçenek sayısı');
    for (let i = 0; i < d.d.o.length; i++) gez(c.concat(i)); return;
  }
  const ctx0 = c.join(',');
  s.forEach((x, i) => {
    const ctx = `yol ${ctx0} adım ${i}`;
    if (x.k === 'beat') kontrolBeat(x, ctx);
    if (x.k === 'montage') { let bg = null; x.frames.forEach(f => { if (f.bg) bg = f.bg; if (!BG.includes(bg)) hata(`montaj bg ${bg} @ ${x.id}`); if (f.v !== undefined && !V.includes(f.v)) hata(`montaj v ${f.v}`); castOk(f.c, x.id); panelOk(f.panel, x.id); fxOk(f.fx, x.id); if (!(f.ms > 0)) hata('montaj ms'); }); }
    if (x.k === 'dec') { const id = G.decVid(x.d), e = ID.get(id); if (e && e.text !== x.d.q) hata('karar kimliği çakışması'); ID.set(id, { who: 'karar', text: x.d.q }); }
    if (x.k === 'card' && x.type === 'end') { const id = G.endVid(x), e = ID.get(id); if (e && e.text !== x.title) hata('son kimliği çakışması'); ID.set(id, { who: 'son', text: x.title }); }
  });
  const end = s.filter(x => x.k === 'card' && x.type === 'end'); const fin = s[s.length - 1];
  if (end.length !== 1) hata(`yol ${ctx0}: ${end.length} son kartı`);
  if (fin.k !== 'card' || fin.type !== 'final') hata(`yol ${ctx0}: final kartıyla bitmiyor`);
  const e = end[0] ? end[0].title : '?';
  sonSay[e] = (sonSay[e] || 0) + 1;
  if (c[4] === 0 && c[7] === 0) sonSayK[e] = (sonSayK[e] || 0) + 1;   // 729 gerçek karar birleşimi
  yollar.push(Object.assign({ c: ctx0, e }, sure(s)));
})([]);

// ---- incil betiğiyle karşılaştırma ----
const BEK = { 'Referans Kapısı': 169, 'Viral Kaza': 112, 'Remote Dolar': 134, 'Mükemmel CV · Sıfır Dönüş': 118, 'Yüksek Lisans Döngüsü': 196 };
const toplamK = Object.values(sonSayK).reduce((a, b) => a + b, 0);
const uyum = Object.keys(BEK).every(k => sonSayK[k] === BEK[k]) && toplamK === 729;

// ---- taslakla birebirlik ----
const md = fs.readFileSync(path.join(__dirname, 'replikler-taslak.md'), 'utf8');
const KISA = { A: G.A, D: 'DENİZ', O: 'OZAN', B: 'BUSE', T: 'TOLGA', S: 'ASUMAN' };
const mdSat = new Map();
md.split('\n').forEach(l => { const m = l.match(/^(?:- \([^)]*\) )?([ADOBTS]): (.+)$/); if (m) mdSat.set(m[2].trim(), KISA[m[1]]); });
const mdEksik = [...benzersiz.keys()].filter(t => !mdSat.has(t));
const kodEksik = [...mdSat.keys()].filter(t => !benzersiz.has(t));
const kisiFark = [...benzersiz].filter(([t, w]) => mdSat.has(t) && mdSat.get(t) !== w).map(([t]) => t);

// ---- rapor ----
const n = yollar.map(y => y.n), t = yollar.map(y => y.t / 60);
const mn = a => Math.min(...a), mx = a => Math.max(...a), ort = a => a.reduce((x, y) => x + y, 0) / a.length;
const uz = [...benzersiz.keys()].map(x => x.length);
console.log(`Yol sayısı (nabızlar dahil): ${yollar.length}`);
console.log(`Son dağılımı, 729 gerçek karar birleşimi: ${JSON.stringify(sonSayK)}  -> incil betiğiyle ${uyum ? 'AYNI' : 'FARKLI!'}`);
console.log(`Son dağılımı, bütün yollar: ${JSON.stringify(sonSay)}`);
console.log(`Yol başına seslendirilen replik: ${mn(n)}–${mx(n)} (ort. ${ort(n).toFixed(1)})`);
console.log(`Yol başına tahmini süre: ${mn(t).toFixed(1)}–${mx(t).toFixed(1)} dk (ort. ${ort(t).toFixed(1)})  [replik=kar/13+0.8 sn, oylama 40 sn, kart 5 sn, montaj kendi süresi]`);
const kisaY = yollar.reduce((a, b) => a.t < b.t ? a : b), uzunY = yollar.reduce((a, b) => a.t > b.t ? a : b);
console.log(`  en kısa: ${kisaY.c} (${kisaY.e}), en uzun: ${uzunY.c} (${uzunY.e})`);
console.log(`Benzersiz replik: ${benzersiz.size} (karakter: ${uz.reduce((a, b) => a + b, 0)}, ~${(uz.reduce((a, b) => a + b, 0) / 13 / 60).toFixed(1)} dk ses) + ${[...ID.values()].filter(x => x.who === 'karar').length} karar + ${[...ID.values()].filter(x => x.who === 'son').length} son kartı`);
const kisiSay = {}; benzersiz.forEach(w => kisiSay[w] = (kisiSay[w] || 0) + 1); console.log('Kişi başına:', JSON.stringify(kisiSay));
const disari = [...benzersiz.keys()].filter(x => x.length < 90 || x.length > 170);
console.log(`90–170 dışı replik: ${disari.length}`); disari.forEach(x => console.log(`   (${x.length}) ${x}`));
console.log(`Taslak ↔ kod: taslakta olmayan ${mdEksik.length}, kodda olmayan ${kodEksik.length}, kişi farkı ${kisiFark.length}`);
mdEksik.forEach(x => console.log('   taslakta yok:', x)); kodEksik.forEach(x => console.log('   kodda yok:', x)); kisiFark.forEach(x => console.log('   kişi farkı:', x));
const sayi = [...benzersiz.keys()].filter(x => /elli kişi|\b50\b|kişilik salon/.test(x));
if (sayi.length) hata('salon büyüklüğüne gönderme: ' + sayi.join(' | '));
console.log(sorun.size ? `\nSORUNLAR (${sorun.size}):\n - ` + [...sorun].slice(0, 40).join('\n - ') : '\nSözleşme/kimlik/yol denetimi: SORUN YOK');
process.exit(sorun.size || !uyum || mdEksik.length || kodEksik.length ? 1 : 0);
