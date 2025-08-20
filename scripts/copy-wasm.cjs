// copy-wasm.cjs — копирует sql-wasm.wasm в extension/assets
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
const dstDir = path.resolve(__dirname, '../assets');
const dst = path.join(dstDir, 'sql-wasm.wasm');

fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log('[copy-wasm] copied ->', dst);
