// src/shims/empty.ts
// Пустой shim для модулей Node (fs, path, crypto) в браузере.
// Экспортируем что-то, чтобы import'ы не падали.

export default {};
export const promises = {};
export function randomBytes() { return new Uint8Array(0); }
export function createHash() { return { update() { return this; }, digest() { return ""; } }; }
