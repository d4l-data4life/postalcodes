import { decodeCountry } from './binary-format.js';
import { normalizeCountry } from './normalize.js';
import type { CountryData, DecodedCountry } from './types.js';

const REGISTRY = new Map<string, DecodedCountry>();

export function registerCountry(record: CountryData): void {
  const key = normalizeCountry(record.country);
  REGISTRY.set(key, decodeCountry(record));
}

export function unregisterCountry(code: string): boolean {
  return REGISTRY.delete(normalizeCountry(code));
}

export function isCountryLoaded(code: string): boolean {
  return REGISTRY.has(normalizeCountry(code));
}

export function loadedCountries(): string[] {
  return [...REGISTRY.keys()].sort();
}

export function getDecoded(code: string): DecodedCountry | undefined {
  return REGISTRY.get(normalizeCountry(code));
}
