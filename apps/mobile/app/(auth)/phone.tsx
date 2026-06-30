import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { otpRequestSchema } from '@tayfa/shared/schemas';
import { Button, colors, Screen, Text, TrustRow } from '@/design-system';
import { AuthHeader } from '@/components/AuthHeader';
import { illustrations } from '@/lib/illustrations';
import { supabase, supabaseReady } from '@/lib/supabase';
import { track } from '@/lib/analytics';
import { useSession } from '@/stores/session';

/**
 * Step 1 — phone entry (redesign `o1-auth-phone`). Phone OTP is the mandatory,
 * free baseline verification (ID + liveness come later, also free). We normalize
 * to E.164 and validate with the shared schema before asking Supabase to send the
 * code. Turkey-only beachhead → the +90 country prefix is fixed for now.
 */
export default function PhoneScreen(): React.ReactElement {
  const router = useRouter();
  const setPhone = useSession((s) => s.setPhone);
  const [local, setLocal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    track('signup_started', {});
  }, []);

  async function onContinue(): Promise<void> {
    setError(null);
    const phone = `+90${local.replace(/\D/g, '')}`;
    const parsed = otpRequestSchema.safeParse({ phone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      if (supabaseReady) {
        const { error: otpError } = await supabase.auth.signInWithOtp({ phone: parsed.data.phone });
        if (otpError) throw otpError;
      }
      setPhone(parsed.data.phone);
      router.push('/(auth)/otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AuthHeader
          showBack={false}
          progress={{ steps: 3, current: 1 }}
          right={
            <View className="flex-row items-center gap-1 rounded-full bg-surface px-3 py-2">
              <Ionicons name="globe-outline" size={15} color={colors.inkMuted} />
              <Text variant="subhead" className="font-semibold text-ink">
                EN
              </Text>
              <Ionicons name="chevron-down" size={13} color={colors.inkSubtle} />
            </View>
          }
        />

        {/* Two-tone headline */}
        <Text
          style={{ fontSize: 40, lineHeight: 46 }}
          className="mt-7 font-extrabold tracking-tight text-ink"
        >
          What&apos;s your{'\n'}
          <Text
            style={{ fontSize: 40, lineHeight: 46 }}
            className="font-extrabold tracking-tight text-ember"
          >
            number?
          </Text>
        </Text>
        <Text variant="callout" className="mt-3 text-ink-muted">
          We text you a 6-digit code to confirm it&apos;s really you. Tayfa is verified-only —
          that&apos;s what keeps meetups safe.
        </Text>

        {/* Clay mascot */}
        <Image
          source={illustrations.authPhone}
          style={{ width: '100%', height: 200 }}
          contentFit="contain"
          transition={200}
          accessibilityLabel="A friendly mascot verifying a phone number"
        />

        <TrustRow
          className="mt-1"
          items={[
            {
              icon: <Ionicons name="shield-checkmark" size={18} color={colors.ember} />,
              label: 'Verified profiles only',
            },
            {
              icon: <Ionicons name="lock-closed" size={18} color={colors.ember} />,
              label: 'Your number is private',
            },
            {
              icon: <Ionicons name="people" size={18} color={colors.ember} />,
              label: 'Safer meetups',
            },
          ]}
        />

        {/* Phone input with fixed +90 prefix */}
        <Text variant="label" className="mb-2 mt-7 text-ink">
          Phone number
        </Text>
        <View className="h-16 flex-row items-center rounded-2xl border border-line-strong bg-surface px-2">
          <View className="flex-row items-center gap-1.5 rounded-xl bg-surface-alt px-2.5 py-2">
            <View className="rounded-md bg-[#E30A17] px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">TR</Text>
            </View>
            <Ionicons name="chevron-down" size={13} color={colors.inkSubtle} />
          </View>
          <Text style={{ fontSize: 18 }} className="px-3 font-semibold text-ink">
            +90
          </Text>
          <View className="h-7 w-px bg-line" />
          <TextInput
            value={local}
            onChangeText={(t) => setLocal(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="5XX XXX XX XX"
            placeholderTextColor={colors.inkSubtle}
            selectionColor={colors.ember}
            className="ml-2 flex-1 text-[18px] text-ink"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void onContinue()}
          />
        </View>
        {error ? (
          <Text variant="footnote" className="mt-2 text-danger">
            {error}
          </Text>
        ) : (
          <View className="mt-2 flex-row items-center gap-1.5">
            <Ionicons name="shield-checkmark" size={14} color={colors.verified} />
            <Text variant="footnote" className="text-ink-subtle">
              We never share your number with anyone.
            </Text>
          </View>
        )}

        <Button
          label="Send code"
          className="mt-7"
          loading={loading}
          onPress={() => void onContinue()}
          rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.inkInverse} />}
        />
        <Text variant="footnote" className="mt-4 text-center text-ink-subtle">
          By continuing you agree to Tayfa&apos;s Terms and acknowledge the Privacy Notice
          (KVKK/GDPR).
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}
