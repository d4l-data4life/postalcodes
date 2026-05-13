export interface CountryData {
  /** Format version of this record. */
  v: number;
  /** ISO-3166-1 alpha-2 country code (uppercase). */
  country: string;
  /**
   * Per-position character class, one code per position up to `maxLen`. Codes:
   *   - 'D' = digit         (0-9)
   *   - 'A' = ASCII letter  (A-Z, normalized to uppercase)
   *   - 'X' = alphanumeric  (0-9 or A-Z)
   *
   * Positions at index >= `minLen` are optional (variable-length countries).
   */
  charsets: string;
  /** Min normalized length observed in the dataset. */
  minLen: number;
  /** Max normalized length observed in the dataset. */
  maxLen: number;
  /** Number of unique postal codes encoded in `data`. */
  count: number;
  /** base64( gzip( packed-binary ) ) — see binary-format.ts */
  data: string;
}

/**
 * Discriminated outcome of {@link validatePostalCode}. Drives UI state in a
 * single switch:
 *
 *   - `'valid'`     → complete, known postal code present in the reference
 *                     dataset. Accept.
 *   - `'unknown'`   → input matches the country's structural pattern but is
 *                     not in the dataset. The dataset is not exhaustive, so
 *                     callers should treat this as a soft warning rather than
 *                     a hard validation failure.
 *   - `'partial'`   → format is correct so far AND the input could still grow
 *                     into a known code (it is a prefix of one). Use to
 *                     suppress errors while the user is typing.
 *   - `'malformed'` → input violates the country's structural pattern
 *                     (digit-vs-letter classes or length bounds). Hard fail.
 */
export type ValidationVerdict = 'valid' | 'unknown' | 'partial' | 'malformed';

export interface ValidationResult {
  /** See {@link ValidationVerdict}. */
  verdict: ValidationVerdict;
  /** Normalized form actually used for the lookup (uppercase, separators stripped). */
  normalized: string;
}

/**
 * Structural description of a country's postal codes — useful for configuring
 * an input field up front (max length, keyboard type, …) without having to
 * validate anything first.
 */
export interface CountryFormat {
  /** Min normalized length observed in the dataset. */
  minLen: number;
  /** Max normalized length observed in the dataset. */
  maxLen: number;
  /** Per-position character class: one of `D` / `A` / `X` per position. Length = `maxLen`. */
  charsets: string;
  /** True when every position only accepts digits 0-9. Drives `numeric` keyboard. */
  digitsOnly: boolean;
  /** True when every position only accepts letters A-Z. */
  lettersOnly: boolean;
  /** True when at least one position accepts digits. */
  hasDigits: boolean;
  /** True when at least one position accepts letters. */
  hasLetters: boolean;
}

export interface DecodedCountry {
  country: string;
  charsets: string;
  minLen: number;
  maxLen: number;
  count: number;
  /** Concatenated normalized codes. */
  buf: Uint8Array;
  /** True if every code has the same length. */
  fixed: boolean;
  /** Length of each code when `fixed` is true; otherwise 0. */
  fixedLen: number;
  /** Offsets into `buf` for the start of each code (length = count + 1). Only set when !fixed. */
  offsets: Uint32Array | null;
}

export interface Manifest {
  /** Source data download date (ISO 8601). */
  generatedAt: string;
  /** GeoNames source URL. */
  source: string;
  /** Format version of the country files. */
  formatVersion: number;
  /** Country code → relative file path. */
  countries: Record<string, { file: string; count: number; bytes: number }>;
}
