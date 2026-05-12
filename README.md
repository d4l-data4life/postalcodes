# @d4l/postalcodes

Offline, world-wide **postal-code validation** for Node, modern browsers, and
React Native. Ships per-country indexes built from the
[GeoNames](https://www.geonames.org/) Postal Code dataset
([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).

- No network calls at runtime — everything you need is in the npm tarball.
- One small data file per country, gzipped + binary-packed, loaded lazily.
- Sub-millisecond exact-match **and** prefix lookup (great for live `<input>` validation).
- Zero Node-only APIs in the runtime path; works in browsers and React Native.

## Install

```sh
npm install @d4l/postalcodes
```

## Quick start — Node

```ts
import { loadCountry } from '@d4l/postalcodes/node';
import { validatePostalCode } from '@d4l/postalcodes';

await loadCountry('US');

validatePostalCode('US', '90210');
// → { valid: true,  isPrefix: true,  formatOk: true, normalized: '90210' }

validatePostalCode('US', '902');
// → { valid: false, isPrefix: true,  formatOk: true, normalized: '902'   }

validatePostalCode('US', '9X');
// → { valid: false, isPrefix: false, formatOk: false, normalized: '9X'   }
```

## Quick start — React Native / browser

Metro and most web bundlers handle JSON imports natively, so the cleanest
pattern is to register each country you care about explicitly. Only the data
files you import are bundled into your app.

```ts
import US from '@d4l/postalcodes/data/US.json';
import DE from '@d4l/postalcodes/data/DE.json';
import { registerCountry, validatePostalCode } from '@d4l/postalcodes';

registerCountry(US);
registerCountry(DE);

validatePostalCode('US', '90210').valid; // true
validatePostalCode('DE', '10117').valid; // true
```

## API

### `validatePostalCode(country, raw): ValidationResult`

```ts
interface ValidationResult {
  valid: boolean;       // complete and in the country's index
  isPrefix: boolean;    // could still grow into a valid code
  formatOk: boolean;    // matches per-position char-class (cheap structural check)
  normalized: string;   // uppercase, separators stripped
}
```

Inputs are normalized: spaces and hyphens are stripped, letters uppercased.
So `validatePostalCode('CA', 'k1a 0b1')` and `validatePostalCode('CA', 'K1A-0B1')`
behave identically.

Throws `UnknownCountryError` if the country has not been registered.

### Other exports

- `isValidPostalCode(country, raw): boolean` — sugar for `validate(...).valid`
- `isValidPrefix(country, raw): boolean` — sugar for `validate(...).isPrefix`
- `registerCountry(data: CountryData): void` — register data loaded by hand
- `unregisterCountry(code: string): boolean` — free memory
- `isCountryLoaded(code: string): boolean`
- `loadedCountries(): string[]`
- `normalizePostalCode(raw: string): string` — the same normalization used internally
- `regexForCountry(code: string): RegExp` — derive a structural regex (e.g. for `<input pattern>`)

From `@d4l/postalcodes/node` (Node-only convenience):

- `loadCountry(code: string): Promise<boolean>`
- `loadAllCountries(): Promise<string[]>`
- `readManifest(): Promise<Manifest>`

### Driving an `<input>` field

```ts
function onPostalChange(country: string, raw: string) {
  const r = validatePostalCode(country, raw);
  if (r.valid)             return 'ok';
  if (!r.formatOk)         return 'invalid characters';
  if (r.isPrefix)          return 'keep typing…';
  return 'not a known postal code';
}
```

## Supported countries

Whichever countries appear in the GeoNames `allCountries.zip` file at the
time of each release. The full list is in
[`data/manifest.json`](./data/manifest.json) — typically ~100 countries.
GeoNames postal-code coverage varies by country; some have only district
prefixes rather than full codes (notably GB).

## How it works

For each country we:

1. Parse the GeoNames TSV and keep only `(country_code, postal_code)` pairs.
2. Normalize codes to uppercase ASCII, strip spaces and hyphens, deduplicate.
3. Sort lexicographically and pack:
   - If every code has the same length: concatenate, no per-record overhead.
   - Otherwise: 1-byte length prefix + ASCII bytes per code.
4. Gzip the packed buffer, base64-encode it, wrap in a small JSON record with
   per-position character-class metadata.

At runtime, validation is:

- `O(L)` structural check against the per-position char-class (rejects garbage early)
- `O(log N · L)` binary search over the sorted buffer for exact match and prefix

`N` is the number of codes for the country (US ≈ 42k, DE ≈ 16k); `L` is the
code length. In practice, validation is well under a millisecond.

## Updating the data

The package re-publishes the data monthly via a scheduled GitHub Action
(`.github/workflows/update-data.yml`). To regenerate locally:

```sh
npm run update-data   # downloads allCountries.zip and rebuilds data/
```

The download is large (~150 MB). The resulting per-country files in `data/`
are committed to the repo so the npm publish is reproducible from a git tag.

## Attribution

Postal-code data © [GeoNames](https://www.geonames.org/),
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). When redistributing
this data, keep the attribution intact. See [ATTRIBUTION.md](./ATTRIBUTION.md).

## License

MIT for code. Data files under `data/` are CC BY 4.0 (see ATTRIBUTION.md).
