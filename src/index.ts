export type {
  CountryData,
  CountryFormat,
  ValidationResult,
  ValidationVerdict,
  Manifest,
} from './types.js';

export {
  registerCountry,
  unregisterCountry,
  isCountryLoaded,
  loadedCountries,
} from './registry.js';

export {
  validatePostalCode,
  isValidPostalCode,
  isAcceptablePostalCode,
  getCountryFormat,
  UnknownCountryError,
} from './validator.js';

export { normalizePostalCode } from './normalize.js';

export { regexForCountry } from './regex.js';
