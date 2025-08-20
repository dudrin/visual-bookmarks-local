// extension/scripts/dev-reload-server.cjs
const path = require('path');
const chokidar = require('chokidar');
const WebSocket = require('ws');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 13333;

const wss = new WebSocket.Server({ port: PORT }, () =>
  console.log(`[dev] LiveReload server: ws://localhost:${PORT}`)
);

function broadcast(msg) {
  for (const c of wss.clients) {
    if (c.readyState === 1) c.send(msg);
  }
}

let t;
chokidar.watch(DIST, { ignoreInitial: true }).on('all', () => {
  clearTimeout(t);
  t = setTimeout(() => {
    console.log('[dev] change detected → reload');
    broadcast('reload');
  }, 120);
});
