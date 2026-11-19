// Bir oyunu otomatik oynatmayla baştan sona oynatır ve oyunun kendi kayıt özelliğiyle (K tuşu) sesli videosunu alır.
// Kullanım: node kaydet.js <oyun> [cikti_klasoru]      Ön koşul: 8765 portunda yerel sunucu.
// Edge tam ekran (kiosk) açılır; "bu sekmeyi paylaş" izni komut satırı bayrağıyla otomatik verilir. Kayıt gerçek zamanlıdır (~9 dk).
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const oyun = process.argv[2], out = path.resolve(process.argv[3] || 'videolar'), CDP = 9350, PORT = process.env.PORT || 8765;
fs.mkdirSync(out, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const url = `http://localhost:${PORT}/${oyun}/index.html`;
  const prof = path.join(os.tmpdir(), 'edge-kayit');
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--kiosk', url, '--edge-kiosk-type=fullscreen', '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', '--auto-accept-this-tab-capture', '--disable-features=msEdgeSidebarV2,msUndersideButton', '--disable-infobars',
    `--remote-debugging-port=${CDP}`, `--user-data-dir=${prof}`], { stdio: 'ignore' });
  let tabs;
  for (let i = 0; i < 60; i++) { await wait(500); try { tabs = (await (await fetch(`http://127.0.0.1:${CDP}/json`)).json()).filter(t => t.type === 'page' && t.url.includes(oyun)); if (tabs.length) break; } catch (e) { } }
  if (!tabs || !tabs.length) { console.log('SAYFA BULUNAMADI'); edge.kill(); process.exit(1); }
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(), errs = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result || m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise(r => { pend.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
  const key = async (k, code, vk) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, text: k === ' ' ? ' ' : k }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: out });
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: out });
  await send('Page.bringToFront'); await wait(2500);
  const once = new Set(fs.readdirSync(out));
  console.log('pencere', await ev('innerWidth+"x"+innerHeight+" dpr "+devicePixelRatio'));
  await key('k', 'KeyK', 75);
  let armed = false;
  for (let i = 0; i < 30 && !armed; i++) { await wait(500); armed = await ev('recArmed'); }
  if (!armed) { console.log('KAYIT HAZIRLANAMADI (paylaşım izni verilmedi)'); ws.close(); edge.kill(); process.exit(2); }
  await key(' ', 'Space', 32);
  await wait(1500);
  console.log('kayıt başladı:', await ev('!!rec && rec.state'), 'otomatik:', await ev('auto'));
  const t0 = Date.now(); let son = '';
  while (Date.now() - t0 < 16 * 60000) {
    await wait(5000);
    const d = await ev('JSON.stringify({rec:!!rec,auto,pos,len:script.length,k:script[pos].k,type:script[pos].type||""})');
    if (d !== son && process.env.AYRINTI) console.log(Math.round((Date.now() - t0) / 1000) + ' sn', d);
    son = d;
    if (d && !JSON.parse(d).rec) break;
  }
  await wait(4000);
  const yeni = fs.readdirSync(out).filter(f => !once.has(f) && !f.endsWith('.crdownload'));
  console.log('süre', Math.round((Date.now() - t0) / 1000), 'sn; son durum', son, '; hata', errs.length, errs.slice(0, 3));
  for (const f of yeni) console.log('VİDEO', path.join(out, f), (fs.statSync(path.join(out, f)).size / 1048576).toFixed(1) + ' MB');
  if (!yeni.length) console.log('VİDEO DOSYASI OLUŞMADI');
  ws.close(); edge.kill(); await wait(1000); process.exit(yeni.length ? 0 : 3);
})();
