# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v0.4.0] - 2026-05-13

### Added

- `regexForCountry` and `normalizePostalCode` are now also re-exported from `./bundled` (`regexForCountry` returns `undefined` for unbundled countries instead of throwing). Enables a single-line hard gate: `regexForCountry(cc).test(normalizePostalCode(raw))`.

## [v0.3.0] - 2026-05-13

### Added

- `isAcceptablePostalCode(country, raw)` — `verdict !== 'malformed'`, for the proceed gate.
- `getCountryFormat(country)` — structural metadata (`minLen`, `maxLen`, `charsets`, `digitsOnly`, …) for configuring an `<input>` up front.

### Changed

- **Breaking:** `ValidationResult` is now `{ verdict: 'valid' | 'unknown' | 'partial' | 'malformed', normalized }` instead of `{ valid, isPrefix, formatOk, normalized }`.

### Removed

- `isValidPrefix(country, raw)` — use `validatePostalCode(...).verdict === 'partial'`.

## [v0.2.0] - 2026-05-13

### Added

- `./bundled` entry — static-bundler-friendly variant that statically `require`s every per-country JSON file. Lets RN / webpack / Rollup consumers drop their own loader map.

## [v0.1.0] - 2026-05-12

Initial release. Per-country postal-code validator with packed offline indexes (GeoNames, CC BY 4.0). Main + Node entries; `./data/*` and `./manifest` exports. Public API: `validatePostalCode`, `isValidPostalCode`, `isValidPrefix`, `normalizePostalCode`, `regexForCountry`, `registerCountry`, `unregisterCountry`, `isCountryLoaded`, `loadedCountries`.

[Unreleased]: https://github.com/d4l-data4life/postalcodes/compare/v0.4.0...HEAD
[v0.4.0]: https://github.com/d4l-data4life/postalcodes/compare/v0.3.0...v0.4.0
[v0.3.0]: https://github.com/d4l-data4life/postalcodes/compare/v0.2.0...v0.3.0
[v0.2.0]: https://github.com/d4l-data4life/postalcodes/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/d4l-data4life/postalcodes/releases/tag/v0.1.0
