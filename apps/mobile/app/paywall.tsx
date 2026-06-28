import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PREMIUM_FEATURES,
  PRICING,
  type PlanPrice,
  type PremiumFeature,
} from '@tayfa/shared/constants';
import type { PricingRegion } from '@tayfa/shared/types';
import { Badge, Button, Card, colors, Screen, Text } from '@/design-system';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';

type Placement = 'P-1' | 'P-2' | 'P-3' | 'P-4' | 'P-5';
const PLACEMENTS: readonly Placement[] = ['P-1', 'P-2', 'P-3', 'P-4', 'P-5'];

const FEATURE_COPY: Record<
  PremiumFeature,
  { icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }
> = {
  unlimited_crews: {
    icon: 'people',
    label: 'Unlimited crews',
    desc: 'Keep every circle going at once',
  },
  extra_photos_prompts: {
    icon: 'images',
    label: 'More photos & prompts',
    desc: 'A richer profile that stands out',
  },
  premium_recap_cards: {
    icon: 'sparkles',
    label: 'Premium recap cards',
    desc: 'Beautiful shareable meetup recaps',
  },
  advanced_interest_filters: {
    icon: 'options',
    label: 'Advanced filters',
    desc: 'Filter by sub-genre, artist & more',
  },
  see_whos_interested: {
    icon: 'eye',
    label: "See who's interested",
    desc: 'Know who wants to meet before you do',
  },
  match_ranking_boost: {
    icon: 'trending-up',
    label: 'Ranking boost',
    desc: 'Your hangouts surface to more people',
  },
  travel_mode: {
    icon: 'airplane',
    label: 'Travel mode',
    desc: 'Discover meetups in cities you visit',
  },
  early_access_events: {
    icon: 'flash',
    label: 'Early access',
    desc: 'Get into popular meetups first',
  },
  read_receipts: {
    icon: 'checkmark-done',
    label: 'Read receipts',
    desc: 'See when your messages land',
  },
};

function symbol(currency: PlanPrice['currency']): string {
  return currency === 'TRY' ? '₺' : '€';
}
function money(currency: PlanPrice['currency'], amount: number): string {
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${symbol(currency)}${n}`;
}

/**
 * Contextual Tayfa+ paywall (P7). Framed as "more & better plans" — never a wall
 * in front of the core loop or safety. Everything essential (discover, join,
 * host, chat, verification, block/report, safety center) stays free; this only
 * sells delight + reach. Pricing comes from PRICING config (no hardcoded prices).
 */
export default function PaywallScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ feature?: string; placement?: string; region?: string }>();

  const region: PricingRegion = params.region === 'EU' ? 'EU' : 'TR';
  const plan = PRICING[region];
  const placement: Placement = PLACEMENTS.find((p) => p === params.placement) ?? 'P-3';
  const highlighted = PREMIUM_FEATURES.find((f) => f === params.feature) ?? null;

  const [cycle, setCycle] = useState<'annual' | 'monthly'>('annual');

  useEffect(() => {
    track('paywall_viewed', { placement, feature: highlighted ?? 'tayfa_plus' });
  }, [placement, highlighted]);

  function choose(): void {
    const productId = cycle === 'annual' ? plan.annualProductId : plan.monthlyProductId;
    // Provider seam: RevenueCat presents the native purchase sheet here, and the
    // entitlement that unlocks features is the SERVER truth (RevenueCat webhook →
    // BFF). We never flip a local premium flag from the client.
    Alert.alert('Tayfa+', `Opening secure checkout for ${productId}.`, [{ text: 'OK' }]);
  }

  const annualDiscountPct = Math.round(plan.annualDiscount * 100);

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Badge label="Tayfa+" tone="grape" icon="sparkles" />
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="close" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-40 gap-5" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text variant="display">
            {highlighted ? FEATURE_COPY[highlighted].label : 'More & better,\nwhen you want it'}
          </Text>
          <Text variant="callout" className="text-ink-muted">
            {highlighted
              ? FEATURE_COPY[highlighted].desc
              : 'Tayfa is fully free to meet people. Tayfa+ just adds more reach and a few delightful extras.'}
          </Text>
        </View>

        {/* Reassurance — safety/core never paywalled */}
        <Card className="flex-row items-center gap-3 border-verified-soft bg-verified-soft">
          <Ionicons name="lock-open" size={20} color={colors.verified} />
          <Text variant="footnote" className="flex-1 text-ink">
            Discovering, joining, hosting, chat, verification, and the entire Safety Center are
            always free. Tayfa+ never gates them.
          </Text>
        </Card>

        {/* Plan toggle */}
        <View className="flex-row gap-3">
          <PlanCard
            title="Annual"
            price={money(plan.currency, plan.annual)}
            sub={`${money(plan.currency, plan.annualPerMonth)}/mo · save ${annualDiscountPct}%`}
            active={cycle === 'annual'}
            badge={`Best value`}
            onPress={() => setCycle('annual')}
          />
          <PlanCard
            title="Monthly"
            price={money(plan.currency, plan.monthly)}
            sub="per month"
            active={cycle === 'monthly'}
            onPress={() => setCycle('monthly')}
          />
        </View>

        {/* Feature list */}
        <View className="gap-1">
          <Text variant="caption" className="text-ink-subtle">
            What you get
          </Text>
          {PREMIUM_FEATURES.map((f) => {
            const copy = FEATURE_COPY[f];
            const isHi = f === highlighted;
            return (
              <View
                key={f}
                className={cn(
                  'flex-row items-center gap-3 rounded-xl px-3 py-3',
                  isHi && 'bg-grape-soft',
                )}
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-grape-soft">
                  <Ionicons name={copy.icon} size={18} color={colors.grape} />
                </View>
                <View className="flex-1">
                  <Text variant="bodyStrong">{copy.label}</Text>
                  <Text variant="footnote" className="text-ink-muted">
                    {copy.desc}
                  </Text>
                </View>
                {isHi ? <Ionicons name="arrow-back" size={16} color={colors.grape} /> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 gap-2 border-t border-line bg-canvas px-5 pb-8 pt-4">
        <Button
          label={`Continue — ${cycle === 'annual' ? money(plan.currency, plan.annual) + '/yr' : money(plan.currency, plan.monthly) + '/mo'}`}
          variant="premium"
          onPress={choose}
        />
        <Text variant="footnote" className="text-center text-ink-subtle">
          Cancel anytime. Billed via the App Store / Google Play.
        </Text>
      </View>
    </Screen>
  );
}

function PlanCard({
  title,
  price,
  sub,
  active,
  badge,
  onPress,
}: {
  title: string;
  price: string;
  sub: string;
  active: boolean;
  badge?: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable onPress={onPress} className="flex-1 active:opacity-90">
      <View
        className={cn(
          'gap-1 rounded-2xl border p-4',
          active ? 'border-grape bg-grape-soft' : 'border-line bg-surface',
        )}
      >
        <View className="flex-row items-center justify-between">
          <Text variant="bodyStrong" className={active ? 'text-grape' : 'text-ink'}>
            {title}
          </Text>
          {badge ? <Badge label={badge} tone="grape" /> : null}
        </View>
        <Text variant="h1">{price}</Text>
        <Text variant="footnote" className="text-ink-muted">
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}
