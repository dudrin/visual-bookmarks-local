// vite.config.ts
import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

function resolveBackgroundEntry() {
  const candidates = [
    "background.ts",
    "background.js",
    "src/background.ts",
    "src/background.js",
  ];
  for (const rel of candidates) {
    const p = path.resolve(__dirname, rel);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `Не найден файл фонового скрипта. Ожидались один из:\n` +
      candidates.map((c) => `  - ${c}`).join("\n")
  );
}

export default defineConfig({
  root: ".",
  resolve: {
    // Шимы только для браузерного бандла (убирают "fs/path/crypto" внутри зависимостей)
    alias: {
      fs: path.resolve(__dirname, "src/shims/empty.ts"),
      path: path.resolve(__dirname, "src/shims/empty.ts"),
      crypto: path.resolve(__dirname, "src/shims/empty.ts"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        panel: path.resolve(__dirname, "src/panel/panel.html"),
        popup: path.resolve(__dirname, "src/popup/popup.html"),
        background: resolveBackgroundEntry(),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    target: "es2022",
    sourcemap: false,
    outDir: "dist",
    emptyOutDir: true,
  },
});
