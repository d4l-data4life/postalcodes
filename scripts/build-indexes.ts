#!/usr/bin/env tsx
/**
 * Read .tmp/allCountries.txt, group rows by country, normalize/dedupe/sort
 * postal codes, and emit one JSON file per country plus a top-level manifest.
 *
 * Output:
 *   data/<CC>.json        per-country packed record
 *   data/manifest.json    index of available countries + metadata
 *   data/ATTRIBUTION.md   GeoNames attribution (CC BY 4.0)
 */
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { mkdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { normalizePostalCode } from '../src/normalize.js';
import { encodeCountry } from '../src/binary-format.js';
import type { Manifest } from '../src/types.js';

const TMP_DIR = new URL('../.tmp/', import.meta.url);
const TSV_PATH = new URL('allCountries.txt', TMP_DIR);
const META_PATH = new URL('source.json', TMP_DIR);
const DATA_DIR = new URL('../data/', import.meta.url);

interface SourceMeta {
  source: string;
  downloadedAt: string;
  lastModified: string;
}

async function main(): Promise<void> {
  const meta: SourceMeta = JSON.parse(await readFile(META_PATH, 'utf8'));

  console.log(`Parsing ${new URL('allCountries.txt', TMP_DIR).pathname} ...`);
  const byCountry = new Map<string, Set<string>>();
  let rowCount = 0;
  let skippedEmpty = 0;

  const rl = createInterface({
    input: createReadStream(TSV_PATH),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.length === 0) continue;
    const tabIdx = line.indexOf('\t');
    if (tabIdx <= 0) continue;
    const country = line.slice(0, tabIdx).toUpperCase();
    const restStart = tabIdx + 1;
    const tabIdx2 = line.indexOf('\t', restStart);
    if (tabIdx2 < 0) continue;
    const rawCode = line.slice(restStart, tabIdx2);
    if (!rawCode) {
      skippedEmpty++;
      continue;
    }
    const norm = normalizePostalCode(rawCode);
    if (!norm) {
      skippedEmpty++;
      continue;
    }
    let set = byCountry.get(country);
    if (!set) {
      set = new Set<string>();
      byCountry.set(country, set);
    }
    set.add(norm);
    rowCount++;
    if (rowCount % 200_000 === 0) console.log(`  ${rowCount.toLocaleString()} rows ...`);
  }
  console.log(`Parsed ${rowCount.toLocaleString()} rows; ${skippedEmpty} skipped (empty code).`);
  console.log(`Found ${byCountry.size} countries.`);

  await rm(DATA_DIR, { recursive: true, force: true });
  await mkdir(DATA_DIR, { recursive: true });

  const countries: Manifest['countries'] = {};

  for (const country of [...byCountry.keys()].sort()) {
    const set = byCountry.get(country)!;
    const codes = [...set].sort();
    const charsets = deriveCharsets(codes);
    const record = encodeCountry({ country, codes, charsets });
    const json = JSON.stringify(record);
    const file = `${country}.json`;
    const path = new URL(file, DATA_DIR);
    await writeFile(path, json);
    const { size } = await stat(path);
    countries[country] = { file, count: codes.length, bytes: size };
  }

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    source: meta.source,
    formatVersion: 1,
    countries,
  };
  await writeFile(new URL('manifest.json', DATA_DIR), JSON.stringify(manifest, null, 2));

  await writeFile(
    new URL('ATTRIBUTION.md', DATA_DIR),
    [
      '# Data attribution',
      '',
      'The postal-code data in this directory is derived from the GeoNames Postal',
      'Code dataset, distributed by GeoNames under the Creative Commons Attribution',
      '4.0 License (CC BY 4.0).',
      '',
      `- Source: ${meta.source}`,
      `- Downloaded: ${meta.downloadedAt}`,
      `- Upstream Last-Modified: ${meta.lastModified}`,
      '',
      '© GeoNames — https://www.geonames.org/',
      'License: https://creativecommons.org/licenses/by/4.0/',
      '',
    ].join('\n'),
  );

  const total = Object.values(countries).reduce((a, c) => a + c.bytes, 0);
  console.log(
    `Wrote ${Object.keys(countries).length} country files, total ${(total / 1024 / 1024).toFixed(2)} MiB on disk.`,
  );
}

/**
 * For each position 0..maxLen-1, observe character categories across all codes
 * that have a character at that position. Classify as:
 *   'D' digits only, 'A' letters only, 'X' mixed.
 */
function deriveCharsets(codes: string[]): string {
  let maxLen = 0;
  for (const c of codes) if (c.length > maxLen) maxLen = c.length;
  const out: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    let sawDigit = false;
    let sawLetter = false;
    for (const c of codes) {
      if (i >= c.length) continue;
      const ch = c.charCodeAt(i);
      if (ch >= 48 && ch <= 57) sawDigit = true;
      else if (ch >= 65 && ch <= 90) sawLetter = true;
      else {
        // Non-ASCII or unexpected char: treat as 'X' (permissive).
        sawDigit = sawLetter = true;
        break;
      }
      if (sawDigit && sawLetter) break;
    }
    out.push(sawDigit && sawLetter ? 'X' : sawDigit ? 'D' : sawLetter ? 'A' : 'X');
  }
  return out.join('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
