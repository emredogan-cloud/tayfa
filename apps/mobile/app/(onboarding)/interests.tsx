import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { INTEREST_DOMAINS, type InterestDomain } from '@tayfa/shared/types';
import { CONTENT_LIMITS } from '@tayfa/shared/constants';
import { useInterestCatalog } from '@/api';
import { Button, colors, Screen, Text } from '@/design-system';
import { AuthHeader } from '@/components/AuthHeader';
import { illustrations } from '@/lib/illustrations';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';
import { useOnboarding, type DraftInterest } from '@/stores/onboarding';
import { DOMAIN_META } from '@/lib/interestMeta';

const MIN = CONTENT_LIMITS.minInterestsToComplete;
/** Items shown per domain before the "See all" affordance. */
const PREVIEW = 8;

function FilterPill({
  label,
  icon,
  color,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={cn(
        'h-10 flex-row items-center gap-1.5 rounded-full border px-3.5 active:opacity-80',
        active ? 'border-ember bg-ember' : 'border-line bg-surface',
      )}
    >
      <Ionicons
        name={active ? 'checkmark' : icon}
        size={15}
        color={active ? colors.inkInverse : (color ?? colors.inkMuted)}
      />
      <Text
        variant="subhead"
        className={cn('font-semibold', active ? 'text-ink-inverse' : 'text-ink-muted')}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InterestCard({
  label,
  domain,
  selected,
  onPress,
}: {
  label: string;
  domain: InterestDomain;
  selected: boolean;
  onPress: () => void;
}): React.ReactElement {
  const meta = DOMAIN_META[domain];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-2 rounded-2xl border px-3 py-2.5 active:opacity-80',
        selected ? 'border-ember bg-ember-soft' : 'border-line bg-surface',
      )}
    >
      <Ionicons name={meta.icon} size={16} color={meta.color} />
      <Text
        variant="subhead"
        className={cn('font-semibold', selected ? 'text-ember-dark' : 'text-ink')}
      >
        {label}
      </Text>
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-full border',
          selected ? 'border-ember bg-ember' : 'border-line-strong',
        )}
      >
        {selected ? <Ionicons name="checkmark" size={13} color={colors.inkInverse} /> : null}
      </View>
    </Pressable>
  );
}

/**
 * Onboarding — the taste-card picker (redesign `04-interests`). Searchable,
 * multi-domain, with an icon filter rail and bordered selectable cards.
 * Interests are the entire wedge: they drive feed ranking (pgvector cosine) and
 * the mutual-interest chips that make a stranger feel like a near-friend. Min 5
 * to continue (mirrors interestSelectionSchema).
 */
export default function InterestsScreen(): React.ReactElement {
  const router = useRouter();
  const catalog = useInterestCatalog();
  const selected = useOnboarding((s) => s.interests);
  const toggle = useOnboarding((s) => s.toggleInterest);

  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<InterestDomain | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<InterestDomain>>(new Set());

  const selectedIds = useMemo(() => new Set(selected.map((i) => i.interestId)), [selected]);

  const grouped = useMemo(() => {
    const items = catalog.data ?? [];
    const q = query.trim().toLowerCase();
    const filtered = items.filter((it) => {
      if (domain && it.domain !== domain) return false;
      if (q && !it.label.toLowerCase().includes(q)) return false;
      return true;
    });
    const map = new Map<InterestDomain, typeof filtered>();
    for (const it of filtered) {
      const bucket = map.get(it.domain) ?? [];
      bucket.push(it);
      map.set(it.domain, bucket);
    }
    return map;
  }, [catalog.data, query, domain]);

  function onToggle(item: {
    id: string;
    domain: InterestDomain;
    label: string;
    slug: string;
  }): void {
    const draft: DraftInterest = {
      interestId: item.id,
      label: item.label,
      domain: item.domain,
      slug: item.slug,
      weight: 1,
    };
    const wasSelected = selectedIds.has(item.id);
    toggle(draft);
    if (!wasSelected) {
      track('interest_added', { interest_id: item.id, domain: item.domain, source: 'onboarding' });
    }
  }

  function toggleExpanded(d: InterestDomain): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  const count = selected.length;
  const canContinue = count >= MIN;
  const searching = query.trim().length > 0;

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-44"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader
          pill={{ icon: 'people-outline', label: 'Better matches' }}
          progress={{ steps: 4, current: 1 }}
        />

        {/* Headline + hero */}
        <View className="mt-5 flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text
              style={{ fontSize: 34, lineHeight: 40 }}
              className="font-extrabold tracking-tight text-ink"
            >
              Pick your{'\n'}
              <Text
                style={{ fontSize: 34, lineHeight: 40 }}
                className="font-extrabold tracking-tight text-ember"
              >
                vibe
              </Text>
            </Text>
            <Text variant="callout" className="mt-2 text-ink-muted">
              Choose at least {MIN}. The more you tap, the better your meetups match.
            </Text>
          </View>
          <Image
            source={illustrations.onboardingInterests}
            style={{ width: 132, height: 132 }}
            contentFit="contain"
            transition={200}
            accessibilityLabel=""
          />
        </View>

        {/* Search */}
        <View className="mt-5 h-14 flex-row items-center rounded-2xl border border-line bg-surface px-4">
          <Ionicons name="search" size={18} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search interests…"
            placeholderTextColor={colors.inkSubtle}
            selectionColor={colors.ember}
            autoCapitalize="none"
            autoCorrect={false}
            className="ml-3 flex-1 text-[16px] text-ink"
          />
          {query ? (
            <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.inkSubtle} />
            </Pressable>
          ) : null}
        </View>

        {/* Domain filter rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 mt-4 grow-0"
          contentContainerClassName="gap-2 px-5"
        >
          <FilterPill
            label="All"
            icon="apps"
            active={domain === null}
            onPress={() => setDomain(null)}
          />
          {INTEREST_DOMAINS.map((d) => (
            <FilterPill
              key={d}
              label={DOMAIN_META[d].label}
              icon={DOMAIN_META[d].icon}
              color={DOMAIN_META[d].color}
              active={domain === d}
              onPress={() => setDomain((cur) => (cur === d ? null : d))}
            />
          ))}
        </ScrollView>

        {/* Results */}
        <View className="mt-6 gap-6">
          {catalog.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={colors.ember} />
            </View>
          ) : catalog.isError ? (
            <View className="items-center gap-3 py-16">
              <Text variant="bodyStrong">Couldn&apos;t load interests</Text>
              <Button
                label="Retry"
                variant="secondary"
                fullWidth={false}
                onPress={() => void catalog.refetch()}
              />
            </View>
          ) : grouped.size === 0 ? (
            <View className="items-center gap-2 py-16">
              <Ionicons name="search-outline" size={28} color={colors.inkSubtle} />
              <Text variant="body" className="text-ink-muted">
                No interests match &ldquo;{query}&rdquo;.
              </Text>
            </View>
          ) : (
            INTEREST_DOMAINS.filter((d) => grouped.has(d)).map((d) => {
              const meta = DOMAIN_META[d];
              const items = grouped.get(d) ?? [];
              const forceAll = domain === d || searching;
              const isExpanded = forceAll || expanded.has(d);
              const shown = isExpanded ? items : items.slice(0, PREVIEW);
              const showToggle = !forceAll && items.length > PREVIEW;
              return (
                <View key={d} className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="h-7 w-7 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${meta.color}22` }}
                      >
                        <Ionicons name={meta.icon} size={15} color={meta.color} />
                      </View>
                      <Text variant="bodyStrong" className="text-ink">
                        {meta.label}
                      </Text>
                    </View>
                    {showToggle ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => toggleExpanded(d)}
                        hitSlop={8}
                      >
                        <Text variant="subhead" className="font-semibold text-ember">
                          {expanded.has(d) ? 'See less' : `See all (${items.length})`}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {shown.map((it) => (
                      <InterestCard
                        key={it.id}
                        label={it.label}
                        domain={it.domain}
                        selected={selectedIds.has(it.id)}
                        onPress={() =>
                          onToggle({
                            id: it.id,
                            domain: it.domain,
                            label: it.label,
                            slug: it.slug,
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Sticky status + CTA */}
      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-canvas px-5 pb-8 pt-3">
        <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-ember-soft px-4 py-2.5">
          <View className="flex-row items-center gap-2">
            <Ionicons name="heart" size={16} color={colors.ember} />
            <Text variant="subhead" className="font-bold text-ink">
              {count} selected
            </Text>
          </View>
          <Text variant="footnote" className="text-ink-muted">
            {canContinue ? 'Looking good!' : `Select at least ${MIN}`}
          </Text>
        </View>
        <Button
          label={canContinue ? `Continue with ${count}` : `Pick ${MIN - count} more`}
          disabled={!canContinue}
          onPress={() => router.push('/(onboarding)/consent')}
          rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.inkInverse} />}
        />
      </View>
    </Screen>
  );
}
