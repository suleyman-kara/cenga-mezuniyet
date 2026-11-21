// LinkedIn tanıtım videosu: oyunun seçilmiş anlarını gerçek zamanlı kaydeder (görüntü + oyunun kendi sesi), ffmpeg ile birleştirir.
// Kullanım:  node tanitim/video_kaydet.js            → tanitim/linkedin-16x9.mp4 (1920×1080) ve tanitim/linkedin-kare.mp4 (1080×1080)
//            node tanitim/video_kaydet.js --yalniz-birlestir   → kayıtları yeniden almadan yalnızca birleştirir (tanitim/_kayit/ durmalı)
// Gerekenler: Node 22, playwright (+ chromium), ffmpeg. Sunucu gerekmez: betik repo kökünü kendisi sunar.
//
// Nasıl çalışır:
//  - Her parça için oyun ?yol=...&adim=N&oto=0&ses=1&sahte=1 ile o adımda açılır (sahte=1: canlı oy çubukları, Firebase yok).
//  - Görüntü: CDP Page.startScreencast (JPEG kareler + zaman damgası) → değişken kare süreleriyle 30 fps'e çevrilir.
//  - Ses: sayfaya enjekte edilen betik Web Audio grafiğini (müzik, efektler) ve <audio> seslendirmeleri bir MediaStreamDestination'a
//    da bağlar, MediaRecorder ile kaydeder. Yani videodaki ses oyunun o anda gerçekten çaldığı sestir.
//  - Son kart (tanitim/son-kart.html) da aynı yolla kaydedilir; kare sürüm için tanitim/kare-cerceve.html çerçevesi PNG'ye çizilir.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), http = require('http');

const KOK = path.resolve(__dirname, '..');
const KAYIT = path.join(__dirname, '_kayit');
const YOL = '0,0,0,2,0,0,0,0';          // dürümlü fotoğraf (karar 4: 3. seçenek) → "Viral Kaza" sonu
const W = 1920, H = 1080, FPS = 30;

// Parçalar (sırayla). adim: o yolun adım numarası (bkz. build(); node ile dökmek için README'deki komut).
//  sure: sn (yoksa replik sesi + kuyruk), bas: baştan atılacak sn, yazi: ekrana eklenecek kısa açıklama, eylem: kayıt sırasında yapılacaklar
const PARCALAR = [
  { ad: '01-baslik', adim: 0, sure: 4.2, eylem: async p => { await p.waitForTimeout(700); await p.evaluate(() => titleRun()); } },
  { ad: '02-dolmus', adim: 3 },
  { ad: '03-karar', adim: 46, sure: 13.4, bas: 1.3, yazi: 'Salon QR’ı okutuyor, telefondan oy veriyor',
    eylem: async p => { await p.waitForTimeout(8000); await p.evaluate(() => forceWin(2)); } },
  { ad: '04-sonuc', adim: 47 },
  { ad: '05-toren', adim: 51 },
  { ad: '06-bayram', adim: 73 },
  { ad: '07-viral', adim: 87 },
  { ad: '08-son', adim: 95, sure: 7.2, bas: 0.7 },
  { ad: '09-final', adim: 96, sure: 3.6 },
  { ad: '10-kapanis', url: '/tanitim/son-kart.html', sure: 5.5 },
];

const SES_ENJEKTE = `(() => {
  const OrigAC = window.AudioContext; if (!OrigAC) return;
  const REC = new OrigAC(); const recDest = REC.createMediaStreamDestination();
  const oc = AudioNode.prototype.connect;
  class PAC extends OrigAC { constructor(...a) { super(...a); this.__msd = this.createMediaStreamDestination(); REC.createMediaStreamSource(this.__msd.stream).connect(recDest); } }
  window.AudioContext = PAC; window.webkitAudioContext = PAC;
  AudioNode.prototype.connect = function (t, ...r) { const res = oc.call(this, t, ...r); if (t instanceof AudioDestinationNode && this.context.__msd) oc.call(this, this.context.__msd); return res; };
  const cmes = BaseAudioContext.prototype.createMediaElementSource;
  BaseAudioContext.prototype.createMediaElementSource = function (el) { el.__routed = true; return cmes.call(this, el); };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (!this.__routed) { try { REC.createMediaElementSource(this).connect(recDest); this.__routed = true; } catch (e) {} } return play.call(this); };
  window.__kayitBasla = () => { REC.resume(); const mr = new MediaRecorder(recDest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
    const ch = []; mr.ondataavailable = e => ch.push(e.data); mr.start(); window.__mr = { mr, ch }; return Date.now(); };
  window.__kayitBitir = () => new Promise(ok => { const { mr, ch } = window.__mr; mr.onstop = async () => {
    const buf = new Uint8Array(await new Blob(ch).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); ok(btoa(s)); }; mr.stop(); });
})();`;
const CSS_EKLE = `#oyDurum,#swDurum,.swDurum{display:none!important}
#tanitimYazi{position:fixed;left:57%;top:26px;transform:translateX(-50%);z-index:9999;font:800 28px Inter,"Segoe UI",sans-serif;color:#1d2a4a;background:#ffc93c;
 padding:12px 30px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.35);animation:tyGir .5s cubic-bezier(.2,1.4,.4,1) both .4s;white-space:nowrap}
@keyframes tyGir{from{opacity:0;transform:translate(-50%,-30px)}}
#tanitimDamga{position:fixed;right:18px;bottom:6px;z-index:9999;font:700 20px "JetBrains Mono",Consolas,monospace;color:#fff;opacity:.85;text-shadow:0 1px 3px #000}`;

function sunucu() {
  const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let p = path.join(KOK, u); if (!p.startsWith(KOK)) return res.writeHead(403).end();
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TUR[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

const wavSure = f => { const b = fs.readFileSync(f); let o = 12; while (o < b.length - 8) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'data') return n / b.readUInt32LE(28); o += 8 + n + (n & 1); } return 0; };
const ff = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

async function kaydet() {
  const srv = await sunucu(), port = srv.address().port;
  const tarayici = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] });
  fs.rmSync(KAYIT, { recursive: true, force: true });
  for (const pr of PARCALAR) {
    const dir = path.join(KAYIT, pr.ad); fs.mkdirSync(dir, { recursive: true });
    const ctx = await tarayici.newContext({ viewport: { width: W, height: H } });
    await ctx.addInitScript(SES_ENJEKTE);
    const p = await ctx.newPage(), hatalar = [];
    p.on('pageerror', e => hatalar.push(e.message));
    const url = pr.url ? `http://127.0.0.1:${port}${pr.url}` : `http://127.0.0.1:${port}/oyun/index.html?yol=${YOL}&adim=${pr.adim}&oto=0&ses=1&sw=0&sahte=1`;
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.addStyleTag({ content: CSS_EKLE });
    await p.evaluate(([yazi, damga]) => {
      if (yazi) { const d = document.createElement('div'); d.id = 'tanitimYazi'; d.textContent = yazi; document.body.appendChild(d); }
      if (damga) { const d = document.createElement('div'); d.id = 'tanitimDamga'; d.textContent = 'cenga-mezuniyet.pages.dev'; document.body.appendChild(d); }
    }, [pr.yazi || '', !pr.url]);
    let sure = pr.sure;
    if (!sure) {   // replik: ses süresi + oyunun 0,45 sn gecikmesi + kuyruk
      const id = await p.evaluate(() => hid(script[pos].text));
      sure = wavSure(path.join(KOK, 'oyun/ses', id + '.wav')) + 0.45 + 1.0;
    }
    const cdp = await ctx.newCDPSession(p), kareler = [];
    cdp.on('Page.screencastFrame', f => { kareler.push({ t: f.metadata.timestamp, d: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
    const t0 = await p.evaluate(() => { if (typeof audio === 'function') audio(); return __kayitBasla(); });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H });
    const bitis = Date.now() + sure * 1000 + 300;
    if (pr.eylem) await pr.eylem(p);
    await p.waitForTimeout(Math.max(0, bitis - Date.now()));
    await cdp.send('Page.stopScreencast');
    const tSon = Date.now();
    const ses = await p.evaluate(() => __kayitBitir());
    fs.writeFileSync(path.join(dir, 'ses.webm'), Buffer.from(ses, 'base64'));
    kareler.forEach((k, i) => fs.writeFileSync(path.join(dir, `k${String(i).padStart(5, '0')}.jpg`), Buffer.from(k.d, 'base64')));
    // kare süreleri (concat listesi); ses, ilk kareden (t0 → ilk kare) kadar önce başladı
    const ilk = kareler[0].t * 1000;
    let liste = '';
    kareler.forEach((k, i) => { const son = i + 1 < kareler.length ? kareler[i + 1].t * 1000 : tSon; liste += `file 'k${String(i).padStart(5, '0')}.jpg'\nduration ${((son - k.t * 1000) / 1000).toFixed(4)}\n`; });
    liste += `file 'k${String(kareler.length - 1).padStart(5, '0')}.jpg'\n`;
    fs.writeFileSync(path.join(dir, 'liste.txt'), liste);
    fs.writeFileSync(path.join(dir, 'bilgi.json'), JSON.stringify({ sesKaymasi: (ilk - t0) / 1000, sure, kare: kareler.length, hatalar }, null, 1));
    console.log(`${pr.ad}: ${sure.toFixed(1)} sn, ${kareler.length} kare (${(kareler.length / sure).toFixed(1)} fps)${hatalar.length ? ', HATA: ' + hatalar.join(' | ') : ''}`);
    await ctx.close();
  }
  // kare sürümün çerçevesi
  const ctx = await tarayici.newContext({ viewport: { width: 1080, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${port}/tanitim/kare-cerceve.html`); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(KAYIT, 'kare-cerceve.png'), omitBackground: true });
  await tarayici.close(); srv.close();
}

function birlestir() {
  const parcalar = [];
  for (const pr of PARCALAR) {
    const dir = path.join(KAYIT, pr.ad), b = JSON.parse(fs.readFileSync(path.join(dir, 'bilgi.json'), 'utf8'));
    const bas = pr.bas || 0, sure = b.sure - bas;
    const sesBas = Math.max(0, b.sesKaymasi + bas);
    const sesF = path.join(dir, 'ses.webm'), sesVar = fs.statSync(sesF).size > 1000;   // ses grafiği olmayan sayfa (kapanış kartı): sessiz
    ff(['-f', 'concat', '-safe', '0', '-i', path.join(dir, 'liste.txt'), ...(sesVar ? ['-ss', String(sesBas), '-i', sesF] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']),
      '-filter_complex', `[0:v]fps=${FPS},trim=start=${bas}:duration=${sure},setpts=PTS-STARTPTS,scale=${W}:${H},format=yuv420p[v];` +
      `[1:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration=${sure},afade=t=in:d=0.06,afade=t=out:st=${Math.max(0, sure - 0.3)}:d=0.3[a]`,
      '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-r', String(FPS), '-c:a', 'pcm_s16le', '-t', String(sure), path.join(dir, 'parca.mkv')]);
    parcalar.push(path.join(dir, 'parca.mkv'));
  }
  const liste = path.join(KAYIT, 'parcalar.txt');
  fs.writeFileSync(liste, parcalar.map(f => `file '${f}'`).join('\n') + '\n');
  ff(['-f', 'concat', '-safe', '0', '-i', liste, '-c', 'copy', path.join(KAYIT, 'tum.mkv')]);
  const out169 = path.join(__dirname, 'linkedin-16x9.mp4'), outKare = path.join(__dirname, 'linkedin-kare.mp4');
  const ses = 'loudnorm=I=-15:TP=-1.5:LRA=11';
  ff(['-i', path.join(KAYIT, 'tum.mkv'), '-af', ses, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', out169]);
  // 1080×1080: 16:9 görüntü ortada (1080×608), üstte/altta çerçeve yazıları
  ff(['-i', path.join(KAYIT, 'tum.mkv'), '-loop', '1', '-i', path.join(KAYIT, 'kare-cerceve.png'),
    '-filter_complex', '[0:v]scale=1080:608:flags=lanczos[s];[1:v][s]overlay=0:236:shortest=1,format=yuv420p[v]', '-map', '[v]', '-map', '0:a', '-af', ses,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '5M', '-bufsize', '10M', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', outKare]);
  for (const f of [out169, outKare]) console.log(path.relative(KOK, f), (fs.statSync(f).size / 1048576).toFixed(1) + ' MB');
}

(async () => {
  if (!process.argv.includes('--yalniz-birlestir')) await kaydet();
  birlestir();
})().catch(e => { console.error(e); process.exit(1); });
