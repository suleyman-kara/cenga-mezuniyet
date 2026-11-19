// Başsız Edge'i gerçek zamanlı sürer (sanal zaman yok): adıma gider, bekler, ekran görüntüsü alır, sayfada ifade çalıştırır.
// Kullanım: node cdp.js <cikti_klasoru> <is1> <is2> ...
//   iş biçimi:  oyun|yol|adim|ms[,ms2,...]|ad      örn.  son-sifre|2,0,1|14|1500,5000|silah
//   yol "-" = boş yol. Her ms için ayrı görüntü: <ad>_<ms>.png. Ön koşul: 8765 portunda yerel sunucu.
//   ortam: PORT (varsayılan 8765), CDP (varsayılan 9333), JS="ifade" (her işin sonunda değerlendirilir ve yazılır)
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = process.env.PORT || 8765, CDP = +(process.env.CDP || 9333);
const out = path.resolve(process.argv[2]); fs.mkdirSync(out, { recursive: true });
const jobs = process.argv.slice(3).map(s => { const [oyun, yol, adim, ms, ad] = s.split('|'); return { oyun, yol: yol === '-' ? '' : yol, adim: +adim, ms: ms.split(',').map(Number), ad }; });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless=new', '--no-first-run', '--mute-audio', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--window-size=1920,1080', `--remote-debugging-port=${CDP}`, `--user-data-dir=${path.join(os.tmpdir(), 'edge-cdp-' + CDP)}`, 'about:blank'], { stdio: 'ignore' });
  let tabs;
  for (let i = 0; i < 40; i++) { await wait(250); try { tabs = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); if (tabs.some(t => t.type === 'page')) break; } catch (e) { } }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(), errs = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result || m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('konsol: ' + m.params.args.map(a => a.value || a.description).join(' ')); };
  const send = (method, params = {}) => new Promise(r => { pend.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  for (const j of jobs) {
    await send('Page.navigate', { url: `http://localhost:${PORT}/${j.oyun}/index.html?yol=${j.yol}&adim=${j.adim}${process.env.EK || ''}` });
    if (process.env.ONCE) await send('Runtime.evaluate', { expression: process.env.ONCE, awaitPromise: true });
    let t = 0;
    for (const ms of j.ms) {
      await wait(ms - t); t = ms;
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
      fs.writeFileSync(path.join(out, `${j.ad}_${ms}.jpg`), Buffer.from(r.data, 'base64'));
    }
    if (process.env.JS) { const r = await send('Runtime.evaluate', { expression: process.env.JS, awaitPromise: true, returnByValue: true }); console.log(j.ad, '=>', JSON.stringify(r.result?.value ?? r)); }
  }
  if (process.env.SAYFA) { const fl = fs.readdirSync(out).filter(f => f.endsWith('.jpg') && !f.startsWith('sayfa')).sort(); for (let p = 0; p * 9 < fl.length; p++) { const h = '<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(3,640px);font:16px Consolas;color:#fff">' + fl.slice(p * 9, p * 9 + 9).map(f => '<div style="position:relative;height:360px"><img src="' + f + '" width=640 height=360><b style="position:absolute;left:0;top:0;background:#000a;padding:1px 6px">' + f + '</b></div>').join(''); fs.writeFileSync(path.join(out, 'sayfa.html'), h); await send('Page.navigate', { url: 'file:///' + path.join(out, 'sayfa.html').split('\\').join('/') }); await wait(900); const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 }); fs.writeFileSync(path.join(out, 'sayfa' + p + '.jpg'), Buffer.from(r.data, 'base64')); } }
  console.log(jobs.length, 'iş bitti;', errs.length, 'hata', errs.slice(0, 10));
  ws.close(); edge.kill(); process.exit(0);
})();
