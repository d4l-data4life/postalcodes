#!/usr/bin/env tsx
/**
 * Tiny Node CLI: `npx tsx examples/node-cli.ts US 90210`
 * Prints the full ValidationResult so you can see how each field reacts.
 */
import { loadCountry } from '@d4l/postalcodes/node';
import { validatePostalCode, regexForCountry } from '@d4l/postalcodes';

const [, , countryArg, codeArg] = process.argv;
if (!countryArg || !codeArg) {
  console.error('usage: tsx examples/node-cli.ts <country> <postal-code>');
  process.exit(2);
}

await loadCountry(countryArg);
const result = validatePostalCode(countryArg, codeArg);
console.log(JSON.stringify(result, null, 2));
console.log(`structural regex: ${regexForCountry(countryArg)}`);
