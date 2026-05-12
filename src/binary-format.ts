import { gunzipSync, gzipSync } from 'fflate';
import { base64ToBytes, bytesToBase64 } from './base64.js';
import type { CountryData, DecodedCountry } from './types.js';

/*
 * Per-country packed format v1
 * -----------------------------
 *   Offset  Size  Field
 *   0       1     version (= 1)
 *   1       1     flags (bit 0 = fixed-length, bits 1-7 reserved = 0)
 *   2       1     fixed length when flag set, else 0
 *   3       1     reserved (= 0)
 *   4       4     count (LE uint32)
 *   8+      ...   sorted, normalized codes (ASCII)
 *                   fixed:    count * fixedLen bytes
 *                   variable: per code, 1 length byte + length ASCII bytes
 *
 * The whole packed buffer is gzipped, then base64-encoded for storage inside
 * a JSON file. The JSON wrapper keeps the format usable from any bundler
 * (Metro, webpack, Vite) without special loaders.
 */

export const FORMAT_VERSION = 1;
const FLAG_FIXED = 1 << 0;

const ENCODER = new TextEncoder();

export interface EncodeInput {
  country: string;
  /** Sorted, deduplicated, normalized codes. */
  codes: string[];
  /** Per-position char-class string ('D'|'A'|'X' per position), length === maxLen. */
  charsets: string;
}

export function encodeCountry(input: EncodeInput): CountryData {
  const { country, codes, charsets } = input;
  if (codes.length === 0) {
    throw new Error(`encodeCountry: refusing to encode empty set for ${country}`);
  }
  let minLen = Infinity;
  let maxLen = 0;
  for (const c of codes) {
    if (c.length < minLen) minLen = c.length;
    if (c.length > maxLen) maxLen = c.length;
  }
  if (charsets.length !== maxLen) {
    throw new Error(
      `encodeCountry(${country}): charsets length ${charsets.length} != maxLen ${maxLen}`,
    );
  }
  const fixed = minLen === maxLen;
  const fixedLen = fixed ? minLen : 0;

  let bodySize = 0;
  if (fixed) {
    bodySize = codes.length * fixedLen;
  } else {
    for (const c of codes) bodySize += 1 + c.length;
  }
  const buf = new Uint8Array(8 + bodySize);
  buf[0] = FORMAT_VERSION;
  buf[1] = fixed ? FLAG_FIXED : 0;
  buf[2] = fixed ? fixedLen : 0;
  buf[3] = 0;
  writeUint32LE(buf, 4, codes.length);

  let off = 8;
  if (fixed) {
    for (const c of codes) {
      const bytes = ENCODER.encode(c);
      buf.set(bytes, off);
      off += fixedLen;
    }
  } else {
    for (const c of codes) {
      const bytes = ENCODER.encode(c);
      buf[off++] = bytes.length;
      buf.set(bytes, off);
      off += bytes.length;
    }
  }

  const gz = gzipSync(buf, { level: 9 });
  return {
    v: FORMAT_VERSION,
    country,
    charsets,
    minLen,
    maxLen,
    count: codes.length,
    data: bytesToBase64(gz),
  };
}

export function decodeCountry(record: CountryData): DecodedCountry {
  if (record.v !== FORMAT_VERSION) {
    throw new Error(
      `@d4l/postalcodes: unsupported format version ${record.v} (expected ${FORMAT_VERSION}). Re-run the data update script.`,
    );
  }
  const gz = base64ToBytes(record.data);
  const buf = gunzipSync(gz);
  const version = buf[0];
  if (version !== FORMAT_VERSION) {
    throw new Error(`@d4l/postalcodes: packed buffer has unexpected version ${version}`);
  }
  const flags = buf[1] ?? 0;
  const fixed = (flags & FLAG_FIXED) !== 0;
  const fixedLen = fixed ? (buf[2] ?? 0) : 0;
  const count = readUint32LE(buf, 4);

  const body = buf.subarray(8);
  let offsets: Uint32Array | null = null;
  if (!fixed) {
    // offsets[i] points at the length-byte of code i in `body`.
    // The code's data occupies `body[offsets[i]+1 .. offsets[i]+1+body[offsets[i]])`.
    // offsets[count] is a sentinel pointing one byte past the last code's data.
    offsets = new Uint32Array(count + 1);
    let o = 0;
    for (let i = 0; i < count; i++) {
      offsets[i] = o;
      const len = body[o] ?? 0;
      o += 1 + len;
    }
    offsets[count] = o;
  }

  return {
    country: record.country,
    charsets: record.charsets,
    minLen: record.minLen,
    maxLen: record.maxLen,
    count,
    buf: body,
    fixed,
    fixedLen,
    offsets,
  };
}

function writeUint32LE(buf: Uint8Array, off: number, v: number): void {
  buf[off] = v & 0xff;
  buf[off + 1] = (v >>> 8) & 0xff;
  buf[off + 2] = (v >>> 16) & 0xff;
  buf[off + 3] = (v >>> 24) & 0xff;
}

function readUint32LE(buf: Uint8Array, off: number): number {
  return (
    (buf[off] ?? 0) |
    ((buf[off + 1] ?? 0) << 8) |
    ((buf[off + 2] ?? 0) << 16) |
    ((buf[off + 3] ?? 0) << 24)
  ) >>> 0;
}

/** Starting byte offset of code i's data in the body buffer (skips the length byte for variable-length). */
export function codeOffset(c: DecodedCountry, i: number): number {
  if (c.fixed) return i * c.fixedLen;
  return c.offsets![i]! + 1;
}

/** Byte length of code i. */
export function codeLen(c: DecodedCountry, i: number): number {
  if (c.fixed) return c.fixedLen;
  return c.buf[c.offsets![i]!]!;
}
