// scripts/postbuild.cjs
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

function cp(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}
function exists(p) { return fs.existsSync(p); }

// 1) Переместить HTML в корень dist (vite складывает в dist/src/…)
const panelSrc = path.join(dist, "src/panel/panel.html");
const popupSrc = path.join(dist, "src/popup/popup.html");
if (exists(panelSrc)) cp(panelSrc, path.join(dist, "panel.html"));
if (exists(popupSrc)) cp(popupSrc, path.join(dist, "popup.html"));

// 2) Скопировать manifest.json
const manifestSrc = path.join(root, "manifest.json");
cp(manifestSrc, path.join(dist, "manifest.json"));

// 3) Иконки: если есть папка icons — копируем; если нет — создаём заглушки
const iconsSrcDir = path.join(root, "icons");
const iconsDstDir = path.join(dist, "icons");
fs.mkdirSync(iconsDstDir, { recursive: true });

if (exists(iconsSrcDir)) {
  for (const f of fs.readdirSync(iconsSrcDir)) {
    cp(path.join(iconsSrcDir, f), path.join(iconsDstDir, f));
  }
} else {
  // 1×1 прозрачный PNG (base64). Да, размер 1×1, как временная заглушка.
  const blankPngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
  const buf = Buffer.from(blankPngB64, "base64");
  const sizes = [16, 32, 48, 128];
  for (const s of sizes) {
    fs.writeFileSync(path.join(iconsDstDir, `${s}.png`), buf);
  }
  console.log("[postbuild] icons/ not found, wrote placeholder PNGs");
}

// 4) Положить wasm для sql.js (initSqlJs → locateFile('assets/sql-wasm.wasm'))
const assetsDir = path.join(dist, "assets");
fs.mkdirSync(assetsDir, { recursive: true });
const wasmSrc = require.resolve("sql.js/dist/sql-wasm.wasm");
cp(wasmSrc, path.join(assetsDir, "sql-wasm.wasm"));

console.log("[postbuild] HTML, manifest, icons (ok) и sql-wasm.wasm скопированы в dist/");
