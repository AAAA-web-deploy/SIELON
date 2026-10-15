import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.env.SIELON_ROOT || 'site');
const port = Number(process.env.SIELON_PORT || 8000);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
http.createServer((request, response) => {
  let decoded;
  try { decoded = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end('Bad path'); return; }
  const file = path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded));
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
  const send = target => {
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    fs.createReadStream(target).pipe(response);
  };
  fs.stat(file, (error, stat) => {
    if (!error && stat.isDirectory()) {
      const index = path.join(file, 'index.html');
      fs.stat(index, (indexError, indexStat) => {
        if (indexError || !indexStat.isFile()) { response.writeHead(404); response.end('Not found'); return; }
        send(index);
      });
      return;
    }
    if (error || !stat.isFile()) { response.writeHead(404); response.end('Not found'); return; }
    send(file);
  });
}).listen(port, '127.0.0.1', () => console.log(`SIELON preview: http://127.0.0.1:${port}`));
