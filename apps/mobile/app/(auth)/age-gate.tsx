import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ageGateSchema } from '@tayfa/shared/schemas';
import { MIN_AGE_YEARS } from '@tayfa/shared/constants';
import { Button, colors, Screen, Text, TrustRow } from '@/design-system';
import { AuthHeader } from '@/components/AuthHeader';
import { illustrations } from '@/lib/illustrations';
import { track } from '@/lib/analytics';

/**
 * Hard 18+ age gate (RISK_ANALYSIS, non-negotiable; redesign `03-age-gate`). The
 * client validates with the SAME `ageGateSchema` the server enforces — fail-closed:
 * an invalid or under-18 birthdate cannot proceed. The server re-checks against the
 * verified identity later; the client never just "asserts" an age.
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

  function onChange(t: string): void {
    const digits = t.replace(/\D/g, '').slice(0, 8);
    let out = digits.slice(0, 4);
    if (digits.length > 4) out += `-${digits.slice(4, 6)}`;
    if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
    setBirthdate(out);
  }

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
    <Screen scroll>
      <AuthHeader
        pill={{ icon: 'shield-checkmark-outline', label: 'One-time check' }}
        progress={{ steps: 3, current: 3 }}
      />

      <Text
        style={{ fontSize: 40, lineHeight: 46 }}
        className="mt-6 font-extrabold tracking-tight text-ink"
      >
        How old{'\n'}are you?
      </Text>
      <Text variant="callout" className="mt-3 text-ink-muted">
        Tayfa is strictly for adults {MIN_AGE_YEARS} and over. This is a one-time check to keep our
        community safe and trusted.
      </Text>

      <Image
        source={illustrations.authAgegate}
        style={{ width: '100%', height: 200 }}
        contentFit="contain"
        transition={200}
        accessibilityLabel="Friends meeting up together"
      />

      <TrustRow
        className="mt-1"
        items={[
          {
            icon: <Ionicons name="shield-checkmark" size={18} color={colors.ember} />,
            label: '18+ only',
          },
          {
            icon: <Ionicons name="lock-closed" size={18} color={colors.ember} />,
            label: 'One-time check',
          },
          {
            icon: <Ionicons name="people" size={18} color={colors.ember} />,
            label: 'Meet real people',
          },
        ]}
      />

      <Text variant="label" className="mb-2 mt-7 text-ink">
        Date of birth
      </Text>
      <View
        className={`h-16 flex-row items-center rounded-2xl border bg-surface px-2 ${error ? 'border-danger' : 'border-line-strong'}`}
      >
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-ember-soft">
          <Ionicons name="calendar-outline" size={18} color={colors.ember} />
        </View>
        <TextInput
          value={birthdate}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholder="YYYY - MM - DD"
          placeholderTextColor={colors.inkSubtle}
          selectionColor={colors.ember}
          maxLength={10}
          className="ml-3 flex-1 text-[18px] text-ink"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onContinue}
        />
      </View>
      {error ? (
        <Text variant="footnote" className="mt-2 text-danger">
          {error}
        </Text>
      ) : (
        <View className="mt-2 flex-row items-center gap-1.5">
          <Ionicons name="lock-closed" size={14} color={colors.verified} />
          <Text variant="footnote" className="text-ink-subtle">
            We don&apos;t store your age, only verify it.
          </Text>
        </View>
      )}

      <Button
        label="Continue"
        className="mt-8"
        disabled={birthdate.length !== 10}
        onPress={onContinue}
        rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.inkInverse} />}
      />
      <View className="mt-4 flex-row items-center justify-center gap-1.5">
        <Ionicons name="heart-outline" size={14} color={colors.ember} />
        <Text variant="footnote" className="text-ink-subtle">
          Tayfa is about real people, real connections, real life.
        </Text>
      </View>
    </Screen>
  );
}
