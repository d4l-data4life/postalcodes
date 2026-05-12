#!/usr/bin/env tsx
/**
 * Orchestrator: download fresh data from GeoNames, then rebuild per-country
 * indexes. Intended to be run by maintainers and by the scheduled CI job.
 *
 *   npm run update-data
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function run(script: string): void {
  const path = fileURLToPath(new URL(script, import.meta.url));
  const result = spawnSync('node', ['--import', 'tsx', path], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('./download.ts');
run('./build-indexes.ts');
console.log('\nData updated. Review `data/manifest.json` and commit when ready.');
