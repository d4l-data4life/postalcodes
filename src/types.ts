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

export interface ValidationResult {
  /** Input matches a complete, known postal code for the country. */
  valid: boolean;
  /** Input is a prefix of at least one known postal code (true when `valid` is true). */
  isPrefix: boolean;
  /** Input matches the country's structural format (digits vs letters at each position, length bounds). */
  formatOk: boolean;
  /** Normalized form actually used for the lookup (uppercase, separators stripped). */
  normalized: string;
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
