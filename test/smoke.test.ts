import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { encodeCountry } from '../src/binary-format.js';
import {
  registerCountry,
  unregisterCountry,
  isCountryLoaded,
  validatePostalCode,
  isValidPostalCode,
  isValidPrefix,
  regexForCountry,
  UnknownCountryError,
} from '../src/index.js';

/** Build a synthetic country with 5-digit fixed-length codes (US-like). */
function makeFixed(country: string, codes: string[]) {
  return encodeCountry({ country, codes: [...codes].sort(), charsets: 'DDDDD' });
}

/** Build a synthetic country with variable-length codes (UK-outward-like). */
function makeVariable(country: string, codes: string[]) {
  const sorted = [...codes].sort();
  let maxLen = 0;
  for (const c of sorted) if (c.length > maxLen) maxLen = c.length;
  return encodeCountry({ country, codes: sorted, charsets: 'X'.repeat(maxLen) });
}

describe('binary format round-trip', () => {
  it('exact match works for fixed-length codes', () => {
    registerCountry(makeFixed('XF', ['00501', '10001', '20500', '90210', '99999']));
    try {
      assert.equal(isValidPostalCode('XF', '90210'), true);
      assert.equal(isValidPostalCode('XF', '12345'), false);
      assert.equal(isValidPostalCode('XF', '00501'), true);
      assert.equal(isValidPostalCode('XF', '99999'), true);
    } finally {
      unregisterCountry('XF');
    }
  });

  it('exact match works for variable-length codes', () => {
    registerCountry(makeVariable('XV', ['A1', 'AB1', 'AB12', 'XYZ99']));
    try {
      assert.equal(isValidPostalCode('XV', 'A1'), true);
      assert.equal(isValidPostalCode('XV', 'AB12'), true);
      assert.equal(isValidPostalCode('XV', 'XYZ99'), true);
      assert.equal(isValidPostalCode('XV', 'AB'), false);
      assert.equal(isValidPostalCode('XV', 'XYZ'), false);
    } finally {
      unregisterCountry('XV');
    }
  });
});

describe('validatePostalCode result shape', () => {
  it('reports prefix correctly while user types', () => {
    registerCountry(makeFixed('XF', ['00501', '10001', '20500', '90210']));
    try {
      const empty = validatePostalCode('XF', '');
      assert.deepEqual(empty, { valid: false, isPrefix: true, formatOk: true, normalized: '' });

      const partial = validatePostalCode('XF', '902');
      assert.equal(partial.valid, false);
      assert.equal(partial.isPrefix, true);
      assert.equal(partial.formatOk, true);

      const dead = validatePostalCode('XF', '977');
      assert.equal(dead.valid, false);
      assert.equal(dead.isPrefix, false);
      assert.equal(dead.formatOk, true);

      const bad = validatePostalCode('XF', '9X');
      assert.equal(bad.valid, false);
      assert.equal(bad.formatOk, false);

      const tooLong = validatePostalCode('XF', '902109');
      assert.equal(tooLong.valid, false);
      assert.equal(tooLong.isPrefix, false);
      assert.equal(tooLong.formatOk, false);

      const complete = validatePostalCode('XF', '90210');
      assert.equal(complete.valid, true);
      assert.equal(complete.isPrefix, true);
      assert.equal(complete.formatOk, true);
    } finally {
      unregisterCountry('XF');
    }
  });
});

describe('input normalization', () => {
  it('strips separators and uppercases', () => {
    registerCountry(makeVariable('XC', ['A1A0B1', 'K1A0B1']));
    try {
      assert.equal(isValidPostalCode('XC', 'k1a 0b1'), true);
      assert.equal(isValidPostalCode('XC', 'K1A-0B1'), true);
      assert.equal(isValidPostalCode('XC', '  K1A0B1  '), true);
    } finally {
      unregisterCountry('XC');
    }
  });
});

describe('registry hygiene', () => {
  it('throws UnknownCountryError for unregistered country', () => {
    assert.throws(() => validatePostalCode('ZZ', '12345'), UnknownCountryError);
  });

  it('isCountryLoaded reflects registration', () => {
    assert.equal(isCountryLoaded('XF'), false);
    registerCountry(makeFixed('XF', ['00501']));
    assert.equal(isCountryLoaded('XF'), true);
    unregisterCountry('XF');
    assert.equal(isCountryLoaded('XF'), false);
  });
});

describe('regexForCountry', () => {
  it('produces a regex matching the declared format', () => {
    registerCountry(makeFixed('XF', ['00501', '12345']));
    try {
      const re = regexForCountry('XF');
      assert.match('12345', re);
      assert.doesNotMatch('1234', re);
      assert.doesNotMatch('12A45', re);
    } finally {
      unregisterCountry('XF');
    }
  });

  it('marks trailing positions optional for variable-length countries', () => {
    registerCountry(makeVariable('XV', ['AB', 'ABCD']));
    try {
      const re = regexForCountry('XV');
      assert.match('AB', re);
      assert.match('ABCD', re);
      assert.doesNotMatch('A', re);
    } finally {
      unregisterCountry('XV');
    }
  });
});

describe('isValidPrefix', () => {
  it('answers true when the input could grow into a code', () => {
    registerCountry(makeFixed('XF', ['90210', '90211', '90212']));
    try {
      assert.equal(isValidPrefix('XF', '9'), true);
      assert.equal(isValidPrefix('XF', '902'), true);
      assert.equal(isValidPrefix('XF', '903'), false);
      assert.equal(isValidPrefix('XF', '90210'), true);
    } finally {
      unregisterCountry('XF');
    }
  });
});
