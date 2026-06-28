import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { otpRequestSchema } from '@tayfa/shared/schemas';
import { Button, Screen, Text, TextField } from '@/design-system';
import { supabase, supabaseReady } from '@/lib/supabase';
import { track } from '@/lib/analytics';
import { useSession } from '@/stores/session';

/**
 * Step 1 — phone entry. Phone OTP is the mandatory, free baseline verification
 * (ID + liveness come later, also free). We normalize to E.164 and validate with
 * the shared schema before asking Supabase to send the code.
 */
export default function PhoneScreen(): React.ReactElement {
  const router = useRouter();
  const setPhone = useSession((s) => s.setPhone);
  const [value, setValue] = useState('+90');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    track('signup_started', {});
  }, []);

  async function onContinue(): Promise<void> {
    setError(null);
    const phone = value.replace(/\s+/g, '');
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
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-between py-6"
      >
        <View className="gap-8 pt-8">
          <View className="gap-3">
            <Text variant="display">What's your{'\n'}number?</Text>
            <Text variant="callout" className="text-ink-muted">
              We text you a 6-digit code to confirm it's really you. Tayfa is verified-only — that's
              what keeps meetups safe.
            </Text>
          </View>

          <TextField
            label="Phone number"
            value={value}
            onChangeText={setValue}
            error={error}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="+90 5XX XXX XX XX"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void onContinue()}
          />
        </View>

        <View className="gap-3">
          <Button label="Send code" loading={loading} onPress={() => void onContinue()} />
          <Text variant="footnote" className="text-center text-ink-subtle">
            By continuing you agree to Tayfa's Terms and acknowledge the Privacy Notice (KVKK/GDPR).
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
