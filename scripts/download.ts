#!/usr/bin/env tsx
/**
 * Download GeoNames allCountries.zip and extract the TSV.
 *
 * Output: .tmp/allCountries.txt (the raw, tab-delimited file)
 *         .tmp/source.json     (metadata about the source download)
 *
 * GeoNames is licensed under CC BY 4.0. See ATTRIBUTION.md.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';

const SOURCE_URL = 'https://download.geonames.org/export/zip/allCountries.zip';
const TMP_DIR = new URL('../.tmp/', import.meta.url);
const ZIP_PATH = new URL('allCountries.zip', TMP_DIR);
const TSV_PATH = new URL('allCountries.txt', TMP_DIR);
const META_PATH = new URL('source.json', TMP_DIR);

async function main(): Promise<void> {
  await mkdir(TMP_DIR, { recursive: true });

  console.log(`Downloading ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const lastModified = res.headers.get('last-modified') ?? new Date().toUTCString();
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(ZIP_PATH));

  console.log(`Unzipping ...`);
  const zipBuf = new Uint8Array(await readFile(ZIP_PATH));
  const files = unzipSync(zipBuf, {
    filter: (f) => f.name.endsWith('.txt') && !f.name.includes('readme'),
  });
  const entries = Object.entries(files);
  if (entries.length === 0) {
    throw new Error('No .txt file found inside allCountries.zip');
  }
  const [tsvName, tsvBytes] = entries[0]!;
  console.log(`  → ${tsvName} (${tsvBytes.byteLength.toLocaleString()} bytes)`);
  await writeFile(TSV_PATH, tsvBytes);

  await writeFile(
    META_PATH,
    JSON.stringify(
      { source: SOURCE_URL, downloadedAt: new Date().toISOString(), lastModified },
      null,
      2,
    ),
  );
  console.log(`Done.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
