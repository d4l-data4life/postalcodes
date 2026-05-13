import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { encodeCountry } from '../src/binary-format.js';
import {
  registerCountry,
  unregisterCountry,
  isCountryLoaded,
  validatePostalCode,
  isValidPostalCode,
  isAcceptablePostalCode,
  getCountryFormat,
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

describe('validatePostalCode verdicts', () => {
  it('reports each verdict for the four UX cases', () => {
    registerCountry(makeFixed('XF', ['00501', '10001', '20500', '90210']));
    try {
      assert.deepEqual(
        validatePostalCode('XF', ''),
        { verdict: 'partial', normalized: '' },
        'empty input is "partial" so the user can keep typing without errors',
      );

      assert.equal(validatePostalCode('XF', '902').verdict, 'partial', 'prefix of a known code');

      assert.equal(
        validatePostalCode('XF', '977').verdict,
        'unknown',
        'format ok, no known code starts with this — soft warning territory',
      );

      assert.equal(
        validatePostalCode('XF', '9X').verdict,
        'malformed',
        'digit position with a letter is a format violation',
      );

      assert.equal(
        validatePostalCode('XF', '902109').verdict,
        'malformed',
        'past the max length is a format violation',
      );

      assert.equal(validatePostalCode('XF', '90210').verdict, 'valid', 'exact known code');
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

describe('getCountryFormat', () => {
  it('reports digitsOnly for pure-digit countries', () => {
    registerCountry(makeFixed('XF', ['10001', '20500', '90210']));
    try {
      const fmt = getCountryFormat('XF');
      assert.ok(fmt);
      assert.equal(fmt.minLen, 5);
      assert.equal(fmt.maxLen, 5);
      assert.equal(fmt.charsets, 'DDDDD');
      assert.equal(fmt.digitsOnly, true);
      assert.equal(fmt.lettersOnly, false);
      assert.equal(fmt.hasDigits, true);
      assert.equal(fmt.hasLetters, false);
    } finally {
      unregisterCountry('XF');
    }
  });

  it('reports mixed when positions allow alphanumeric', () => {
    registerCountry(makeVariable('XM', ['A1', 'A1A0B1']));
    try {
      const fmt = getCountryFormat('XM');
      assert.ok(fmt);
      assert.equal(fmt.maxLen, 6);
      assert.equal(fmt.charsets, 'XXXXXX');
      assert.equal(fmt.digitsOnly, false);
      assert.equal(fmt.lettersOnly, false);
      assert.equal(fmt.hasDigits, true);
      assert.equal(fmt.hasLetters, true);
    } finally {
      unregisterCountry('XM');
    }
  });

  it('returns undefined for unregistered countries', () => {
    assert.equal(getCountryFormat('ZZ'), undefined);
  });
});

describe('isAcceptablePostalCode', () => {
  it('passes for both known and dataset-missing codes, fails only on format violations', () => {
    registerCountry(makeFixed('XF', ['90210', '90211', '90212']));
    try {
      // Known: obviously acceptable.
      assert.equal(isAcceptablePostalCode('XF', '90210'), true);
      // Format ok, not in dataset — the dataset is not exhaustive, so the
      // caller should still let the user proceed (soft warning territory).
      assert.equal(isAcceptablePostalCode('XF', '99999'), true);
      // Letter where a digit is expected — hard fail.
      assert.equal(isAcceptablePostalCode('XF', '9021A'), false);
      // Too long — hard fail.
      assert.equal(isAcceptablePostalCode('XF', '902100'), false);
    } finally {
      unregisterCountry('XF');
    }
  });
});
