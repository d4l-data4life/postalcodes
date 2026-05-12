import { normalizeCountry, normalizePostalCode } from './normalize.js';
import { getDecoded } from './registry.js';
import { containsExact, hasPrefix } from './search.js';
import type { DecodedCountry, ValidationResult } from './types.js';

export class UnknownCountryError extends Error {
  readonly country: string;
  constructor(country: string) {
    super(
      `@d4l/postalcodes: no data registered for country "${country}". Register it first via registerCountry(...) or loadCountry("${country}").`,
    );
    this.name = 'UnknownCountryError';
    this.country = country;
  }
}

/**
 * Validate a postal code for a country.
 *
 * Returns a structured result so callers can drive an input field:
 *   - `valid`     → input is a complete, known code (mark the field green)
 *   - `isPrefix`  → input could still grow into a valid code (do not red-flag yet)
 *   - `formatOk`  → input matches the country's structural pattern (digits vs letters etc.)
 *
 * @throws {UnknownCountryError} if the country has not been registered.
 */
export function validatePostalCode(country: string, raw: string): ValidationResult {
  const cc = normalizeCountry(country);
  const decoded = getDecoded(cc);
  if (!decoded) throw new UnknownCountryError(cc);

  const normalized = normalizePostalCode(raw);

  if (normalized.length === 0) {
    return { valid: false, isPrefix: true, formatOk: true, normalized };
  }
  if (normalized.length > decoded.maxLen) {
    return { valid: false, isPrefix: false, formatOk: false, normalized };
  }

  const formatOk = matchesCharsets(decoded, normalized);
  const valid =
    formatOk && normalized.length >= decoded.minLen && containsExact(decoded, normalized);
  const isPrefix = valid || (formatOk && hasPrefix(decoded, normalized));

  return { valid, isPrefix, formatOk, normalized };
}

/** Convenience: just the boolean. */
export function isValidPostalCode(country: string, raw: string): boolean {
  return validatePostalCode(country, raw).valid;
}

/** Convenience: true if `raw` could be extended into a valid code for `country`. */
export function isValidPrefix(country: string, raw: string): boolean {
  return validatePostalCode(country, raw).isPrefix;
}

/**
 * Per-position structural check. Faster than a regex and naturally handles
 * partial input — we only check the positions the user has typed so far.
 */
function matchesCharsets(c: DecodedCountry, normalized: string): boolean {
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    const cls = c.charsets.charCodeAt(i);
    if (!charMatches(cls, ch)) return false;
  }
  return true;
}

const C_D = 'D'.charCodeAt(0);
const C_A = 'A'.charCodeAt(0);
const C_X = 'X'.charCodeAt(0);
const D_0 = '0'.charCodeAt(0);
const D_9 = '9'.charCodeAt(0);
const L_A = 'A'.charCodeAt(0);
const L_Z = 'Z'.charCodeAt(0);

function charMatches(cls: number, ch: number): boolean {
  if (cls === C_D) return ch >= D_0 && ch <= D_9;
  if (cls === C_A) return ch >= L_A && ch <= L_Z;
  if (cls === C_X) return (ch >= D_0 && ch <= D_9) || (ch >= L_A && ch <= L_Z);
  return false;
}
