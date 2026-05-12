import { getDecoded } from './registry.js';
import { UnknownCountryError } from './validator.js';

/**
 * Derive a regex that matches any complete, normalized postal code for the country.
 * Useful for `<input pattern>` attributes or display purposes. Note that the regex
 * is *structural only* — it does not check the index. Always pair it with
 * `validatePostalCode` for an authoritative answer.
 *
 * @throws {UnknownCountryError} if the country has not been registered.
 */
export function regexForCountry(country: string): RegExp {
  const decoded = getDecoded(country.toUpperCase());
  if (!decoded) throw new UnknownCountryError(country.toUpperCase());

  const parts: string[] = [];
  for (let i = 0; i < decoded.charsets.length; i++) {
    const cls = decoded.charsets[i];
    const piece = cls === 'D' ? '[0-9]' : cls === 'A' ? '[A-Z]' : '[0-9A-Z]';
    parts.push(i >= decoded.minLen ? `${piece}?` : piece);
  }
  return new RegExp(`^${parts.join('')}$`);
}
