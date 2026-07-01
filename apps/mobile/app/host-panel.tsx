import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  canUseHostProTools,
  computePayoutSplit,
  hostPayoutEligibility,
} from '@tayfa/shared/domain';
import { HOST_PRO_TOOLS, TAKE_RATES_BPS } from '@tayfa/shared/constants';
import { useHostStanding } from '@/api';
import { Badge, Button, Card, colors, Screen, Text, VerifiedBadge } from '@/design-system';
import { formatMinor } from '@/lib/format';

const PRO_TOOLS = [
  { icon: 'repeat', label: 'Recurring meetups', desc: 'Turn a great night into a weekly ritual.' },
  {
    icon: 'ticket',
    label: 'Ticketing & waitlists',
    desc: 'Sell spots and auto-manage a waitlist.',
  },
  {
    icon: 'stats-chart',
    label: 'Host analytics',
    desc: 'See turnout, repeat guests and reliability.',
  },
] as const;

/**
 * Host Panel (P10). The supply-side home: standing, pro-tool eligibility, payout
 * readiness and transparent take rates. Every gate is the SHARED domain rule —
 * pro-tools need hosted meetups + reliability; payouts are KYC + ID gated (money
 * is a compliance surface). Take rates come from config, shown in full.
 */
export default function HostPanelScreen(): React.ReactElement {
  const router = useRouter();
  const query = useHostStanding();

  if (query.isLoading || !query.data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.ember} />
      </Screen>
    );
  }

  const s = query.data;
  const standing = {
    verificationLevel: s.verificationLevel,
    reliabilityScore: s.reliabilityScore,
    completedHostedEvents: s.completedHostedEvents,
    kycComplete: s.kycComplete,
  };
  const pro = canUseHostProTools(standing);
  const payout = hostPayoutEligibility(standing);
  const split = computePayoutSplit(10_000, 'ticketed');
  const eventsToGo = Math.max(0, HOST_PRO_TOOLS.minCompletedHostedEvents - s.completedHostedEvents);

  return (
    <Screen padded={false} edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/marketplace')}
          hitSlop={8}
          accessibilityLabel="Marketplace"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="storefront-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-16 gap-5" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text variant="display">
            Your hosting,{' '}
            <Text variant="display" className="text-ember">
              leveled up
            </Text>
          </Text>
          <Text variant="callout" className="text-ink-muted">
            Track your standing, unlock pro tools, and get set up to earn — all held to the same
            safety bar as everything on Tayfa.
          </Text>
        </View>

        {/* Standing */}
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="bodyStrong">Your standing</Text>
            <VerifiedBadge level={s.verificationLevel === 'none' ? 'phone' : s.verificationLevel} />
          </View>
          <View className="flex-row">
            <StandingStat
              label="Reliability"
              value={`${Math.round(s.reliabilityScore * 100)}`}
              tint={colors.success}
            />
            <View className="w-px bg-line" />
            <StandingStat label="Hosted" value={`${s.completedHostedEvents}`} tint={colors.ember} />
            <View className="w-px bg-line" />
            <StandingStat label="Tickets sold" value={`${s.ticketsSold}`} tint={colors.grape} />
          </View>
        </Card>

        {/* Earnings */}
        <Card className="gap-2">
          <Text variant="bodyStrong">Earnings</Text>
          <View className="flex-row items-end gap-2">
            <Text variant="title">{formatMinor(s.lifetimeNetMinor, s.currency)}</Text>
            <Text variant="footnote" className="pb-1 text-ink-muted">
              lifetime net
            </Text>
          </View>
          <Text variant="footnote" className="text-ink-muted">
            {s.pendingPayoutMinor > 0
              ? `${formatMinor(s.pendingPayoutMinor, s.currency)} pending payout`
              : 'Ticket your first meetup to start earning. Free meetups are always free to host.'}
          </Text>
        </Card>

        {/* Pro tools */}
        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            Host pro tools
          </Text>
          <Card className="gap-3">
            {pro.allowed ? (
              <Badge
                label="Unlocked"
                tone="success"
                icon="checkmark-circle"
                className="self-start"
              />
            ) : (
              <View className="flex-row items-start gap-2 rounded-2xl bg-amber-soft p-3">
                <Ionicons name="lock-closed" size={16} color={colors.amber} />
                <Text variant="footnote" className="flex-1 text-ink">
                  {eventsToGo > 0
                    ? `Host ${eventsToGo} more meetup${eventsToGo === 1 ? '' : 's'} to unlock pro tools.`
                    : 'Raise your reliability a little to unlock pro tools.'}
                </Text>
              </View>
            )}
            {PRO_TOOLS.map((t) => (
              <View key={t.label} className="flex-row items-center gap-3">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    pro.allowed ? 'bg-ember-soft' : 'bg-surface-sunken'
                  }`}
                >
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={pro.allowed ? colors.ember : colors.inkSubtle}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    variant="bodyStrong"
                    className={pro.allowed ? 'text-ink' : 'text-ink-muted'}
                  >
                    {t.label}
                  </Text>
                  <Text variant="footnote" className="text-ink-muted">
                    {t.desc}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* Payouts */}
        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            Payouts
          </Text>
          <Card className="gap-3">
            {payout.eligible ? (
              <View className="flex-row items-start gap-2">
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text variant="footnote" className="flex-1 text-ink">
                  You&apos;re set up for payouts. Your first payout is held{' '}
                  {payout.firstPayoutHoldDays} days for fraud review, then funds land automatically.
                </Text>
              </View>
            ) : (
              <>
                <Text variant="footnote" className="text-ink-muted">
                  Moving money needs a couple of compliance steps — safety and anti-fraud come
                  first.
                </Text>
                {payout.blockers.includes('id_verification_required') ? (
                  <PayoutStep
                    label="Verify your ID"
                    desc="ID + liveness (Verified+) is required before any payout."
                    cta="Verify"
                    onPress={() => router.push('/verify-to-host')}
                  />
                ) : null}
                {payout.blockers.includes('kyc_incomplete') ? (
                  <PayoutStep
                    label="Set up payout details"
                    desc="Secure Stripe Connect onboarding (bank + tax)."
                    cta="Start"
                    onPress={() =>
                      Alert.alert(
                        'Payout setup',
                        'Secure Stripe Connect onboarding is coming soon.',
                      )
                    }
                  />
                ) : null}
                {payout.blockers.includes('reliability_too_low') ? (
                  <PayoutStep
                    label="Raise your reliability"
                    desc="Show up and host well — reliability unlocks payouts."
                  />
                ) : null}
              </>
            )}
          </Card>
        </View>

        {/* Take rates — full transparency */}
        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            What Tayfa takes
          </Text>
          <Card className="gap-3">
            <TakeRow label="Peer ticketed meetups" bps={TAKE_RATES_BPS.ticketed} />
            <TakeRow label="Featured / boosted" bps={TAKE_RATES_BPS.featured} />
            <TakeRow label="Venue & brand partners" bps={TAKE_RATES_BPS.venue} />
            <View className="h-px bg-line" />
            <Text variant="footnote" className="text-ink-muted">
              You keep the rest — the math is exact, no hidden fees. On a{' '}
              {formatMinor(split.grossMinor)} peer ticket you keep{' '}
              <Text variant="footnote" className="font-bold text-success">
                {formatMinor(split.hostNetMinor)}
              </Text>
              .
            </Text>
          </Card>
        </View>

        <Pressable
          onPress={() => router.push('/marketplace')}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-surface-alt"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-grape-soft">
            <Ionicons name="storefront" size={18} color={colors.grape} />
          </View>
          <View className="flex-1">
            <Text variant="bodyStrong">Marketplace</Text>
            <Text variant="footnote" className="text-ink-muted">
              See featured & partner events near you.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function StandingStat({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}): React.ReactElement {
  return (
    <View className="flex-1 items-center gap-1">
      <Text variant="h1" style={{ color: tint }}>
        {value}
      </Text>
      <Text variant="footnote" className="text-ink-subtle">
        {label}
      </Text>
    </View>
  );
}

function PayoutStep({
  label,
  desc,
  cta,
  onPress,
}: {
  label: string;
  desc: string;
  cta?: string;
  onPress?: () => void;
}): React.ReactElement {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-verified-soft">
        <Ionicons name="shield-checkmark" size={16} color={colors.verified} />
      </View>
      <View className="flex-1">
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="footnote" className="text-ink-muted">
          {desc}
        </Text>
      </View>
      {cta && onPress ? (
        <Button label={cta} variant="secondary" size="sm" fullWidth={false} onPress={onPress} />
      ) : null}
    </View>
  );
}

function TakeRow({ label, bps }: { label: string; bps: number }): React.ReactElement {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="body" className="text-ink">
        {label}
      </Text>
      <Text variant="bodyStrong" className="text-ink">
        {bps / 100}%
      </Text>
    </View>
  );
}
