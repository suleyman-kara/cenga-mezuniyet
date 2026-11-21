// Testler için küçük statik sunucu: Range (206), dizin → index.html, istek kaydı, kökü sonradan değiştirme.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.wav': 'audio/wav', '.css': 'text/css' };

export function sunucuBaslat(kok, port = 0) {
  const durum = { kok, kayit: [], bozuk: new Set() };   // bozuk: 503 dönecek yollar (ağ kopması benzetimi)
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    durum.kayit.push({ yontem: req.method, yol: u.pathname, arama: u.search, range: req.headers.range || null });
    if (durum.bozuk.has(u.pathname)) { res.writeHead(503).end(); return; }
    let p;
    try { p = path.join(durum.kok, decodeURIComponent(u.pathname)); } catch { res.writeHead(400).end(); return; }
    if (!p.startsWith(path.resolve(durum.kok))) { res.writeHead(403).end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      if (!u.pathname.endsWith('/')) { res.writeHead(301, { Location: u.pathname + '/' + u.search }).end(); return; }
      p = path.join(p, 'index.html');
    }
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('yok'); return; }
    const boy = fs.statSync(p).size;
    const bas = { 'Content-Type': TUR[path.extname(p)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] !== '' || m[2] !== '')) {
      let a, b;
      if (m[1] === '') { a = Math.max(0, boy - +m[2]); b = boy - 1; } else { a = +m[1]; b = m[2] === '' ? boy - 1 : Math.min(+m[2], boy - 1); }
      if (a > b || a >= boy) { res.writeHead(416, { 'Content-Range': `bytes */${boy}` }).end(); return; }
      res.writeHead(206, { ...bas, 'Content-Length': b - a + 1, 'Content-Range': `bytes ${a}-${b}/${boy}` });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(p, { start: a, end: b }).pipe(res); return;
    }
    res.writeHead(200, { ...bas, 'Content-Length': boy });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(ok => srv.listen(port, '127.0.0.1', () => {
    durum.port = srv.address().port;
    durum.url = `http://127.0.0.1:${durum.port}`;
    durum.kapat = () => new Promise(r => { srv.closeAllConnections?.(); srv.close(() => r()); });
    ok(durum);
  }));
}
