import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ageGateSchema } from '@tayfa/shared/schemas';
import { MIN_AGE_YEARS } from '@tayfa/shared/constants';
import { Button, Screen, Text, TextField } from '@/design-system';
import { track } from '@/lib/analytics';

/**
 * Hard 18+ age gate (RISK_ANALYSIS, non-negotiable). The client validates with
 * the SAME `ageGateSchema` the server enforces — fail-closed: an invalid or
 * under-18 birthdate cannot proceed. The server re-checks against the verified
 * identity later; the client never just "asserts" an age.
 */
function ageFromBirthdate(birthdate: string): number {
  const dob = new Date(birthdate);
  const now = new Date();
  return (
    now.getFullYear() -
    dob.getFullYear() -
    (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
  );
}

export default function AgeGateScreen(): React.ReactElement {
  const router = useRouter();
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onContinue(): void {
    setError(null);
    const normalized = birthdate.trim();
    const parsed = ageGateSchema.safeParse({ birthdate: normalized });
    if (!parsed.success) {
      const age = /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? ageFromBirthdate(normalized) : null;
      if (age !== null && age >= 0) track('age_gate_failed', { age });
      setError(parsed.error.issues[0]?.message ?? `You must be at least ${MIN_AGE_YEARS}`);
      return;
    }
    track('age_gate_passed', { age: ageFromBirthdate(parsed.data.birthdate) });
    router.replace('/(onboarding)/interests');
  }

  return (
    <Screen>
      <View className="flex-1 justify-between py-6">
        <View className="gap-8 pt-8">
          <View className="gap-3">
            <Text variant="display">How old{'\n'}are you?</Text>
            <Text variant="callout" className="text-ink-muted">
              Tayfa is strictly for adults {MIN_AGE_YEARS} and over. This is a one-time check.
            </Text>
          </View>

          <TextField
            label="Date of birth"
            value={birthdate}
            onChangeText={(t) => {
              // Light YYYY-MM-DD mask for a clean, validateable input.
              const digits = t.replace(/\D/g, '').slice(0, 8);
              let out = digits.slice(0, 4);
              if (digits.length > 4) out += `-${digits.slice(4, 6)}`;
              if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
              setBirthdate(out);
            }}
            error={error}
            keyboardType="number-pad"
            placeholder="YYYY-MM-DD"
            maxLength={10}
            autoFocus
          />
        </View>

        <Button label="Continue" disabled={birthdate.length !== 10} onPress={onContinue} />
      </View>
    </Screen>
  );
}
