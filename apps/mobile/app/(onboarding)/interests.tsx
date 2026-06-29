import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { INTEREST_DOMAINS, type InterestDomain } from '@tayfa/shared/types';
import { CONTENT_LIMITS } from '@tayfa/shared/constants';
import { useInterestCatalog } from '@/api';
import { Button, Chip, colors, Screen, Text, TextField } from '@/design-system';
import { track } from '@/lib/analytics';
import { useOnboarding, type DraftInterest } from '@/stores/onboarding';

const DOMAIN_LABEL: Record<InterestDomain, string> = {
  music_genre: 'Music',
  artist: 'Artists',
  tv_show: 'TV',
  film: 'Film',
  sport: 'Sport',
  hobby: 'Hobbies',
  cuisine: 'Food',
  cause: 'Causes',
  game: 'Games',
};

const MIN = CONTENT_LIMITS.minInterestsToComplete;

/**
 * Onboarding — the taste-card picker. Searchable, multi-domain, tappable cards.
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

  const count = selected.length;
  const canContinue = count >= MIN;

  return (
    <Screen padded={false}>
      <View className="px-5 pt-6">
        <Text variant="display">Pick your{'\n'}vibe</Text>
        <Text variant="callout" className="mt-2 text-ink-muted">
          Choose at least {MIN}. The more you tap, the better your meetups match.
        </Text>
        <View className="mt-4">
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Search interests…"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="grow-0"
        contentContainerClassName="gap-2 px-5 pb-3"
      >
        <Chip label="All" selected={domain === null} onPress={() => setDomain(null)} />
        {INTEREST_DOMAINS.map((d) => (
          <Chip
            key={d}
            label={DOMAIN_LABEL[d]}
            selected={domain === d}
            onPress={() => setDomain((cur) => (cur === d ? null : d))}
          />
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-40 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {catalog.isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={colors.ember} />
          </View>
        ) : catalog.isError ? (
          <View className="items-center gap-3 py-16">
            <Text variant="bodyStrong">Couldn't load interests</Text>
            <Button
              label="Retry"
              variant="secondary"
              fullWidth={false}
              onPress={() => void catalog.refetch()}
            />
          </View>
        ) : grouped.size === 0 ? (
          <View className="items-center py-16">
            <Text variant="body" className="text-ink-muted">
              No interests match "{query}".
            </Text>
          </View>
        ) : (
          INTEREST_DOMAINS.filter((d) => grouped.has(d)).map((d) => (
            <View key={d} className="gap-3">
              <Text variant="caption" className="text-ink-subtle">
                {DOMAIN_LABEL[d]}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(grouped.get(d) ?? []).map((it) => (
                  <Chip
                    key={it.id}
                    label={it.label}
                    selected={selectedIds.has(it.id)}
                    onPress={() =>
                      onToggle({ id: it.id, domain: it.domain, label: it.label, slug: it.slug })
                    }
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-canvas px-5 pb-8 pt-4">
        <Button
          label={canContinue ? `Continue with ${count}` : `Pick ${MIN - count} more`}
          disabled={!canContinue}
          onPress={() => router.push('/(onboarding)/consent')}
        />
      </View>
    </Screen>
  );
}
