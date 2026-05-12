/**
 * Cross-platform base64 helpers using the global `atob` / `btoa`. These are
 * available in Node 16+, all modern browsers, and React Native (Hermes 0.65+).
 * We deliberately avoid `Buffer` so the runtime stays portable.
 */

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const len = bin.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let s = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    s += String.fromCharCode(...slice);
  }
  return btoa(s);
}
