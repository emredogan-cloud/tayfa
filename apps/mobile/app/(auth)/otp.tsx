import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { otpVerifySchema } from '@tayfa/shared/schemas';
import { asId } from '@tayfa/shared/types';
import { Button, Card, colors, Screen, Text } from '@/design-system';
import { AuthHeader } from '@/components/AuthHeader';
import { OtpInput } from '@/components/OtpInput';
import { illustrations } from '@/lib/illustrations';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useSession } from '@/stores/session';

/**
 * Step 2 — verify the SMS code (redesign `02-auth-otp`). On success Supabase
 * mints a session; we hydrate the store with the user id so the route gate treats
 * us as authenticated, then move to the hard 18+ age gate.
 */
const CODE_TTL_SECONDS = 300;

function formatPhone(p: string | null): string {
  const m = p?.match(/^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+90 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : (p ?? 'your phone');
}

export default function OtpScreen(): React.ReactElement {
  const router = useRouter();
  const phone = useSession((s) => s.phone);
  const hydrate = useSession((s) => s.hydrate);
  const setVerificationLevel = useSession((s) => s.setVerificationLevel);

  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secs, setSecs] = useState(CODE_TTL_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

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
    setError(null);
    setSecs(CODE_TTL_SECONDS);
    if (phone && supabaseReady) await supabase.auth.signInWithOtp({ phone });
  }

  return (
    <Screen scroll>
      <AuthHeader pill={{ icon: 'shield-checkmark-outline', label: 'Secure verification' }} />

      <View className="mt-6 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text
            style={{ fontSize: 36, lineHeight: 42 }}
            className="font-extrabold tracking-tight text-ink"
          >
            Enter the code
          </Text>
          <Text variant="callout" className="mt-3 text-ink-muted">
            We sent a 6-digit code to{' '}
            <Text variant="callout" className="font-bold text-ember">
              {formatPhone(phone)}
            </Text>
            . It expires in a few minutes.
          </Text>
        </View>
        <Image
          source={illustrations.authOtp}
          style={{ width: 110, height: 110 }}
          contentFit="contain"
          transition={200}
          accessibilityLabel=""
        />
      </View>

      {/* Info card */}
      <Card className="mt-6 flex-row items-stretch p-3">
        <View className="flex-1 flex-row items-center gap-2.5 px-1">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-ember-soft">
            <Ionicons name="time-outline" size={18} color={colors.ember} />
          </View>
          <View>
            <Text variant="footnote" className="text-ink-muted">
              Code expires in
            </Text>
            <Text variant="bodyStrong" className="text-ember">
              {mmss}
            </Text>
          </View>
        </View>
        <View className="w-px self-stretch bg-line" />
        <View className="flex-1 flex-row items-center gap-2.5 px-1 pl-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-ember-soft">
            <Ionicons name="lock-closed" size={17} color={colors.ember} />
          </View>
          <Text variant="footnote" className="flex-1 font-semibold text-ink">
            Your security is our priority
          </Text>
        </View>
      </Card>

      {/* Code input */}
      <Text variant="label" className="mb-3 mt-7 text-ink">
        6-digit code
      </Text>
      <OtpInput value={token} onChange={setToken} onComplete={() => void onVerify()} autoFocus />
      {error ? (
        <Text variant="footnote" className="mt-2 text-danger">
          {error}
        </Text>
      ) : null}

      {/* Resend */}
      <Pressable
        onPress={() => void onResend()}
        className="mt-4 flex-row items-center rounded-2xl border border-line bg-surface p-3 active:opacity-80"
      >
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-ember-soft">
          <Ionicons name="paper-plane-outline" size={18} color={colors.ember} />
        </View>
        <View className="ml-3 flex-1">
          <Text variant="footnote" className="text-ink-muted">
            Didn&apos;t get it?
          </Text>
          <Text variant="bodyStrong" className="text-ember">
            Resend code
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
      </Pressable>

      <Button
        label="Verify"
        className="mt-8"
        loading={loading}
        disabled={token.length !== 6}
        onPress={() => void onVerify()}
        rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.inkInverse} />}
      />
      <View className="mt-4 flex-row items-center justify-center gap-1.5">
        <Ionicons name="lock-closed" size={14} color={colors.verified} />
        <Text variant="footnote" className="text-ink-subtle">
          Your code is private and secure.
        </Text>
      </View>
    </Screen>
  );
}
