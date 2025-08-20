// run-vite-watch.mjs — программный запуск Vite в watch
import { build } from 'vite';

const watcher = await build({
  build: {
    watch: {},          // включаем watch
    outDir: 'dist'
  }
});

// В watch-режиме Vite возвращает rollup watcher с .on('event')
if (watcher && typeof watcher.on === 'function') {
  watcher.on('event', (e) => {
    if (e.code === 'ERROR') {
      console.error('[Vite ERROR]', e.error?.message || e);
    }
    if (e.code === 'END') {
      console.log('BUILD_END'); // маркер для dev-watch.cjs
    }
  });
} else {
  // На всякий случай — одноразовая сборка
  console.log('BUILD_END');
}
