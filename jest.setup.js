// Pre-define Expo's winter runtime globals to avoid Jest lazy-getter issues
// Expo SDK 55 lazily installs these via Object.defineProperty getters; pre-defining
// them prevents Jest from throwing "import outside test scope" errors.
global.__ExpoImportMetaRegistry = { url: null };
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (v) => JSON.parse(JSON.stringify(v));
}
