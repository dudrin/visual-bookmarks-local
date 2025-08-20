const { spawn, execFile } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const viteWatchScript = path.join(root, 'scripts', 'run-vite-watch.mjs');

const vite = spawn(process.execPath, [viteWatchScript], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe']
});

function runPostbuild() {
  execFile(process.execPath, [path.join(root, 'scripts', 'postbuild.cjs')], (err, stdout, stderr) => {
    if (err) {
      console.error('[postbuild] ERROR:', err.message);
      if (stderr) console.error(stderr);
      return;
    }
    if (stdout) process.stdout.write(stdout);
  });
}

vite.stdout.on('data', (chunk) => {
  const s = chunk.toString();
  process.stdout.write(s);
  if (s.includes('BUILD_END')) {
    runPostbuild(); // копируем manifest/icons и переносим HTML в корень dist
  }
});
vite.stderr.on('data', (d) => process.stderr.write(d));
vite.on('exit', (code) => console.log('[vite] exited with', code));
