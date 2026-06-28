import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { otpVerifySchema } from '@tayfa/shared/schemas';
import { asId } from '@tayfa/shared/types';
import { Button, Screen, Text, TextField } from '@/design-system';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useSession } from '@/stores/session';

/**
 * Step 2 — verify the SMS code. On success Supabase mints a session; we hydrate
 * the store with the user id so the route gate treats us as authenticated, then
 * move to the hard 18+ age gate.
 */
export default function OtpScreen(): React.ReactElement {
  const router = useRouter();
  const phone = useSession((s) => s.phone);
  const hydrate = useSession((s) => s.hydrate);
  const setVerificationLevel = useSession((s) => s.setVerificationLevel);

  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onVerify(): Promise<void> {
    setError(null);
    if (!phone) {
      router.replace('/(auth)/phone');
      return;
    }
    const parsed = otpVerifySchema.safeParse({ phone, token });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      if (supabaseReady) {
        const { data, error: vErr } = await supabase.auth.verifyOtp({
          phone: parsed.data.phone,
          token: parsed.data.token,
          type: 'sms',
        });
        if (vErr) throw vErr;
        const uid = data.user?.id;
        if (uid) hydrate({ userId: asId<'UserId'>(uid), verificationLevel: 'phone' });
      } else {
        // Mock/dev fallback so the flow is walkable without Supabase credentials.
        hydrate({
          userId: asId<'UserId'>('00000000-0000-0000-0000-000000000001'),
          verificationLevel: 'phone',
        });
      }
      setVerificationLevel('phone');
      router.replace('/(auth)/age-gate');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That code did not match. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onResend(): Promise<void> {
    if (!phone || !supabaseReady) return;
    setError(null);
    await supabase.auth.signInWithOtp({ phone });
  }

  return (
    <Screen>
      <View className="flex-1 justify-between py-6">
        <View className="gap-8 pt-8">
          <View className="gap-3">
            <Text variant="display">Enter the code</Text>
            <Text variant="callout" className="text-ink-muted">
              Sent to {phone ?? 'your phone'}. It expires in a few minutes.
            </Text>
          </View>

          <TextField
            label="6-digit code"
            value={token}
            onChangeText={(t) => setToken(t.replace(/\D/g, '').slice(0, 6))}
            error={error}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            placeholder="123456"
            autoFocus
            maxLength={6}
            onSubmitEditing={() => void onVerify()}
          />

          <Pressable onPress={() => void onResend()} className="self-start active:opacity-70">
            <Text variant="subhead" className="text-ember">
              Didn't get it? Resend code
            </Text>
          </Pressable>
        </View>

        <Button
          label="Verify"
          loading={loading}
          disabled={token.length !== 6}
          onPress={() => void onVerify()}
        />
      </View>
    </Screen>
  );
}
