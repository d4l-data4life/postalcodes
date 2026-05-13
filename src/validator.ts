import { normalizeCountry, normalizePostalCode } from './normalize.js';
import { getDecoded } from './registry.js';
import { containsExact, hasPrefix } from './search.js';
import type { CountryFormat, DecodedCountry, ValidationResult } from './types.js';

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
 * Validate a postal code for a country and return a discriminated verdict.
 * See {@link ValidationVerdict} for the meaning of each value; the typical
 * UI mapping is: `'valid'` → accept, `'unknown'` → soft warning, `'partial'`
 * → suppress errors (user is still typing), `'malformed'` → hard fail.
 *
 * @throws {UnknownCountryError} if the country has not been registered.
 */
export function validatePostalCode(country: string, raw: string): ValidationResult {
  const cc = normalizeCountry(country);
  const decoded = getDecoded(cc);
  if (!decoded) throw new UnknownCountryError(cc);

  const normalized = normalizePostalCode(raw);

  if (normalized.length === 0) {
    return { verdict: 'partial', normalized };
  }
  if (normalized.length > decoded.maxLen) {
    return { verdict: 'malformed', normalized };
  }
  if (!matchesCharsets(decoded, normalized)) {
    return { verdict: 'malformed', normalized };
  }

  if (normalized.length >= decoded.minLen && containsExact(decoded, normalized)) {
    return { verdict: 'valid', normalized };
  }
  if (hasPrefix(decoded, normalized)) {
    return { verdict: 'partial', normalized };
  }
  return { verdict: 'unknown', normalized };
}

/** True iff `raw` is a complete, known postal code in the reference dataset. */
export function isValidPostalCode(country: string, raw: string): boolean {
  return validatePostalCode(country, raw).verdict === 'valid';
}

/**
 * True iff `raw` is structurally well-formed for the country (length + digit/
 * letter classes), regardless of whether the exact code is present in the
 * dataset. Use this for the "can the user proceed" check: the dataset is not
 * exhaustive, but a format violation is a hard error.
 */
export function isAcceptablePostalCode(country: string, raw: string): boolean {
  return validatePostalCode(country, raw).verdict !== 'malformed';
}

/**
 * Return the structural format of a country's postal codes — length bounds
 * and per-position character classes — without validating an input. Useful
 * for configuring an input field (max length, numeric keyboard, …) up front.
 *
 * Returns `undefined` when no data has been registered for the country.
 */
export function getCountryFormat(country: string): CountryFormat | undefined {
  const cc = normalizeCountry(country);
  const decoded = getDecoded(cc);
  if (!decoded) return undefined;

  let hasDigits = false;
  let hasLetters = false;
  for (let i = 0; i < decoded.charsets.length; i++) {
    const cls = decoded.charsets.charCodeAt(i);
    if (cls === C_D || cls === C_X) hasDigits = true;
    if (cls === C_A || cls === C_X) hasLetters = true;
  }

  return {
    minLen: decoded.minLen,
    maxLen: decoded.maxLen,
    charsets: decoded.charsets,
    digitsOnly: hasDigits && !hasLetters,
    lettersOnly: hasLetters && !hasDigits,
    hasDigits,
    hasLetters,
  };
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
