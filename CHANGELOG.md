# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [v0.3.0] - 2026-05-13

### Added

- `isAcceptablePostalCode(country, raw)` — boolean helper for the "can the user proceed" gate. True when the input is structurally well-formed regardless of dataset presence.
- `getCountryFormat(country)` — returns `{ minLen, maxLen, charsets, digitsOnly, lettersOnly, hasDigits, hasLetters }` for a registered country. Useful for configuring an input field (max length, numeric keyboard, capitalization) without first running a validation. Returns `undefined` when no data is registered for the country.

### Changed

- **Breaking:** `ValidationResult` now returns a single `verdict: 'valid' | 'unknown' | 'partial' | 'malformed'` discriminator in place of the previous `{ valid, isPrefix, formatOk }` triple. The verdict maps directly to UI state — hard-fail on `'malformed'`, soft-warn on `'unknown'`, suppress errors on `'partial'`, accept on `'valid'`.
- `isValidPostalCode` semantics unchanged (still strict: only `'valid'`).

### Removed

- `isValidPrefix(country, raw)` — superseded by `validatePostalCode(...).verdict === 'partial'`.

## [v0.2.0] - 2026-05-13

### Added

- `./bundled` entry - static-bundler-friendly variant that statically `require`s every per-country JSON file shipped in `data/`. Exposes `ensureCountry`, `registerAllCountries`, `validatePostalCode`, `isValidPostalCode`, and `SUPPORTED_COUNTRIES`. Lets React-Native / webpack / Rollup consumers drop their own loader map.

## [v0.1.0] - 2026-05-12

### Added

- Initial release.
- Per-country postal-code validator with packed offline indexes (GeoNames, CC BY 4.0).
- ESM + CJS entry, plus a Node-only convenience loader (`./node`) that reads bundled JSON files from disk.
- Per-country JSON data exposed under `./data/*` and indexed by `./manifest`.
- Public API: `validatePostalCode`, `isValidPostalCode`, `isValidPrefix`, `normalizePostalCode`, `regexForCountry`, `registerCountry`, `unregisterCountry`, `isCountryLoaded`, `loadedCountries`.

[Unreleased]: https://github.com/d4l-data4life/postalcodes/compare/v0.3.0...HEAD
[v0.3.0]: https://github.com/d4l-data4life/postalcodes/compare/v0.2.0...v0.3.0
[v0.2.0]: https://github.com/d4l-data4life/postalcodes/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/d4l-data4life/postalcodes/releases/tag/v0.1.0
