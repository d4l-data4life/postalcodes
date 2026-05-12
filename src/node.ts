/**
 * Node-only convenience loader. Reads the bundled per-country JSON files from
 * disk and registers them. In browser / React Native builds, do NOT import
 * this module — register countries explicitly instead:
 *
 *     import US from '@d4l/postalcodes/data/US.json';
 *     import { registerCountry } from '@d4l/postalcodes';
 *     registerCountry(US);
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { registerCountry, isCountryLoaded } from './registry.js';
import type { CountryData, Manifest } from './types.js';

const dataDir = fileURLToPath(new URL('../data/', import.meta.url));

/**
 * Load the bundled data for one country. No-op (returns false) if already loaded.
 * Throws if the country has no bundled data.
 */
export async function loadCountry(code: string): Promise<boolean> {
  const cc = code.toUpperCase();
  if (isCountryLoaded(cc)) return false;
  const raw = await readFile(`${dataDir}${cc}.json`, 'utf8');
  const data: CountryData = JSON.parse(raw);
  registerCountry(data);
  return true;
}

/** Load every country present in the bundled manifest. */
export async function loadAllCountries(): Promise<string[]> {
  const manifest = await readManifest();
  const codes = Object.keys(manifest.countries);
  await Promise.all(codes.map((c) => loadCountry(c)));
  return codes;
}

/** Read the bundled manifest. */
export async function readManifest(): Promise<Manifest> {
  const raw = await readFile(`${dataDir}manifest.json`, 'utf8');
  return JSON.parse(raw) as Manifest;
}
