import { codeLen, codeOffset } from './binary-format.js';
import type { DecodedCountry } from './types.js';

const ENCODER = new TextEncoder();

/**
 * Compare the i-th code in the country buffer to `needle`.
 * Returns negative if code < needle, positive if code > needle, 0 if equal.
 */
function compareAt(c: DecodedCountry, i: number, needle: Uint8Array): number {
  const off = codeOffset(c, i);
  const len = codeLen(c, i);
  const minLen = Math.min(len, needle.length);
  const buf = c.buf;
  for (let k = 0; k < minLen; k++) {
    const a = buf[off + k]!;
    const b = needle[k]!;
    if (a !== b) return a - b;
  }
  return len - needle.length;
}

/**
 * Same as compareAt but compares only the first `prefixLen` bytes of the code
 * against the full `needle`. Used to check whether the code at i starts with needle.
 */
function comparePrefixAt(c: DecodedCountry, i: number, needle: Uint8Array): number {
  const off = codeOffset(c, i);
  const len = codeLen(c, i);
  if (len < needle.length) {
    // Compare full code; if equal so far, needle is "greater" because longer.
    const buf = c.buf;
    for (let k = 0; k < len; k++) {
      const a = buf[off + k]!;
      const b = needle[k]!;
      if (a !== b) return a - b;
    }
    return -1;
  }
  const buf = c.buf;
  for (let k = 0; k < needle.length; k++) {
    const a = buf[off + k]!;
    const b = needle[k]!;
    if (a !== b) return a - b;
  }
  return 0;
}

/** True if `needle` is present as a full code. */
export function containsExact(c: DecodedCountry, needle: string): boolean {
  if (needle.length < c.minLen || needle.length > c.maxLen) return false;
  if (c.fixed && needle.length !== c.fixedLen) return false;
  const bytes = ENCODER.encode(needle);
  let lo = 0;
  let hi = c.count - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = compareAt(c, mid, bytes);
    if (cmp === 0) return true;
    if (cmp < 0) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

/**
 * True if any code in the set starts with `needle`.
 * Empty needle returns true (every code starts with "").
 */
export function hasPrefix(c: DecodedCountry, needle: string): boolean {
  if (needle.length === 0) return c.count > 0;
  if (needle.length > c.maxLen) return false;
  const bytes = ENCODER.encode(needle);
  // Lower-bound: leftmost i where comparePrefixAt(i, needle) >= 0
  let lo = 0;
  let hi = c.count;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (comparePrefixAt(c, mid, bytes) < 0) lo = mid + 1;
    else hi = mid;
  }
  if (lo >= c.count) return false;
  return comparePrefixAt(c, lo, bytes) === 0;
}
