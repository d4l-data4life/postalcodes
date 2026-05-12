/**
 * React Native: a postal-code TextInput with live validation.
 *
 * Important: in RN, statically import the country files you want to ship in
 * your app bundle. Metro can't follow dynamic template imports reliably, so
 * the explicit import pattern is the supported one.
 *
 * Run inside any RN project after `npm install @d4l/postalcodes`.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';

import US from '@d4l/postalcodes/data/US.json';
import DE from '@d4l/postalcodes/data/DE.json';
import GB from '@d4l/postalcodes/data/GB.json';
import CA from '@d4l/postalcodes/data/CA.json';
import {
  registerCountry,
  validatePostalCode,
  type ValidationResult,
  type CountryData,
} from '@d4l/postalcodes';

const COUNTRIES: Record<string, CountryData> = {
  US: US as CountryData,
  DE: DE as CountryData,
  GB: GB as CountryData,
  CA: CA as CountryData,
};

// Register once at module load. Cheap (just decoding gzipped buffers).
for (const data of Object.values(COUNTRIES)) registerCountry(data);

export function PostalCodeField({ country }: { country: keyof typeof COUNTRIES }) {
  const [raw, setRaw] = useState('');

  const result: ValidationResult = useMemo(
    () => validatePostalCode(country, raw),
    [country, raw],
  );

  // Keep the cursor predictable: just uppercase on input; don't strip separators
  // visually — let the user see what they typed. Validation normalizes internally.
  const tone = !raw
    ? 'neutral'
    : result.valid
      ? 'ok'
      : !result.formatOk
        ? 'error'
        : result.isPrefix
          ? 'pending'
          : 'error';

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Postal code ({country})</Text>
      <TextInput
        style={[styles.input, styles[tone]]}
        value={raw}
        onChangeText={setRaw}
        autoCapitalize="characters"
        autoCorrect={false}
        keyboardType="default"
        placeholder={country === 'US' ? '90210' : country === 'CA' ? 'K1A 0B1' : ''}
      />
      <Text style={styles.hint}>
        {!raw && 'enter a postal code'}
        {raw && tone === 'ok' && 'valid'}
        {raw && tone === 'pending' && 'keep typing…'}
        {raw && tone === 'error' && !result.formatOk && 'invalid characters'}
        {raw && tone === 'error' && result.formatOk && 'not a known postal code'}
      </Text>
    </View>
  );
}

export default function Demo() {
  const [country, setCountry] = useState<keyof typeof COUNTRIES>('US');
  // In a real app you'd render a Picker for `country`; omitted for brevity.
  useEffect(() => {
    const order: (keyof typeof COUNTRIES)[] = ['US', 'DE', 'GB', 'CA'];
    let i = 0;
    const id = setInterval(() => setCountry(order[(++i) % order.length]!), 4000);
    return () => clearInterval(id);
  }, []);
  return <PostalCodeField country={country} />;
}

const styles = StyleSheet.create({
  row: { padding: 16, gap: 8 },
  label: { fontSize: 13, color: '#555' },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  neutral: { borderColor: '#ccc' },
  pending: { borderColor: '#888' },
  ok: { borderColor: '#1a7f37', backgroundColor: '#eaffea' },
  error: { borderColor: '#cf222e', backgroundColor: '#ffeaea' },
  hint: { fontSize: 12, color: '#666' },
});
