const SEPARATORS = /[\s\-]/g;

/** Uppercase and strip spaces / hyphens. Postal codes are ASCII; no Unicode folding needed. */
export function normalizePostalCode(input: string): string {
  return input.toUpperCase().replace(SEPARATORS, '');
}

/** Uppercase ISO-3166-1 alpha-2 country code, no validation. */
export function normalizeCountry(input: string): string {
  return input.toUpperCase();
}
