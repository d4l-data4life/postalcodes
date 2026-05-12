export type { CountryData, ValidationResult, Manifest } from './types.js';

export {
  registerCountry,
  unregisterCountry,
  isCountryLoaded,
  loadedCountries,
} from './registry.js';

export {
  validatePostalCode,
  isValidPostalCode,
  isValidPrefix,
  UnknownCountryError,
} from './validator.js';

export { normalizePostalCode } from './normalize.js';

export { regexForCountry } from './regex.js';
