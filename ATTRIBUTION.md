# Data attribution

The postal-code datasets distributed with this package are derived from the
[GeoNames Postal Code dataset](https://download.geonames.org/export/zip/),
which is made available by GeoNames under the
[Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

> © GeoNames — https://www.geonames.org/

## What we use

- Source archive: `https://download.geonames.org/export/zip/allCountries.zip`
- Fields used: `country_code`, `postal_code` (other columns are dropped)
- Transformations applied:
  - postal codes are normalized to uppercase ASCII with spaces and hyphens stripped
  - duplicates are removed per country
  - codes are sorted and packed into a compact per-country binary index, then gzipped

The exact upstream `Last-Modified` timestamp for the data shipped with each
release is recorded in `data/manifest.json` and `data/ATTRIBUTION.md` inside
the published package.

## Reuse

You are free to reuse the data under CC BY 4.0 as long as you preserve this
attribution. If you redistribute the data (modified or not), retain a notice
crediting GeoNames and link back to https://www.geonames.org/.

## Reporting upstream issues

Errors in the data itself (wrong codes, missing countries, etc.) usually need
to be fixed upstream. See https://www.geonames.org/ for how to contribute or
report data issues.
