import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { resolveActiveCity } from '@tayfa/shared/domain';
import { Badge, Button, Card, colors, PremiumUpsell, Screen, Text } from '@/design-system';
import { CITIES, HOME_CITY_ID, type TravelCity } from '@/lib/cities';
import { useTravel } from '@/stores/travel';
import { useSession } from '@/stores/session';

/**
 * Travel Mode (P9; premium). Browse meetups in another city before you go, so you
 * arrive with plans instead of a cold start. Selection is gated by the shared
 * `resolveActiveCity` rule — free members always resolve to home and get an
 * upgrade nudge; Tayfa+ members scope the feed to the chosen city's centroid.
 */
export default function TravelModeScreen(): React.ReactElement {
  const router = useRouter();
  const entitlement = useSession((s) => s.entitlement);
  const city = useTravel((s) => s.city);
  const setCity = useTravel((s) => s.setCity);
  const isPlus = entitlement === 'tayfa_plus';

  function pick(target: TravelCity): void {
    if (target.id === HOME_CITY_ID) {
      setCity(null);
      return;
    }
    const result = resolveActiveCity({
      homeCityId: HOME_CITY_ID,
      requestedCityId: target.id,
      entitlement,
    });
    if (result.requiresUpgrade) {
      router.push('/paywall?feature=travel_mode&placement=P-4');
      return;
    }
    if (result.traveling) setCity(target);
  }

  const activeId = city?.id ?? HOME_CITY_ID;

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
        <Badge label="Tayfa+" tone="grape" icon="airplane" />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-40 gap-5" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text variant="display">
            See a city{' '}
            <Text variant="display" className="text-ember">
              before
            </Text>{' '}
            you go
          </Text>
          <Text variant="callout" className="text-ink-muted">
            Browse real meetups and crews in another city, so you land with plans — not a cold
            start.
          </Text>
        </View>

        {!isPlus ? (
          <PremiumUpsell
            title="Travel Mode is a Tayfa+ perk"
            body="Unlock any city's feed before you travel, plus more reach at home."
            onPress={() => router.push('/paywall?feature=travel_mode&placement=P-4')}
          />
        ) : city ? (
          <Card className="flex-row items-center gap-3 border-grape-soft bg-grape-soft">
            <Text style={{ fontSize: 26 }}>{city.flag}</Text>
            <View className="flex-1">
              <Text variant="bodyStrong" className="text-grape">
                Traveling in {city.name}
              </Text>
              <Text variant="footnote" className="text-ink-muted">
                Your feed is showing {city.name} meetups.
              </Text>
            </View>
            <Pressable
              onPress={() => setCity(null)}
              className="rounded-full border border-grape px-3 py-2 active:opacity-80"
            >
              <Text variant="subhead" className="font-bold text-grape">
                Return home
              </Text>
            </Pressable>
          </Card>
        ) : null}

        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            Where to?
          </Text>
          <Card padded={false}>
            {CITIES.map((c, i) => {
              const active = c.id === activeId;
              const locked = !isPlus && !c.home;
              return (
                <View key={c.id}>
                  {i > 0 ? <View className="h-px bg-line" /> : null}
                  <Pressable
                    onPress={() => pick(c)}
                    accessibilityRole="button"
                    className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-alt"
                  >
                    <Text style={{ fontSize: 24 }}>{c.flag}</Text>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text variant="bodyStrong">{c.name}</Text>
                        {c.home ? <Badge label="Home" tone="ember" icon="home" /> : null}
                      </View>
                      <Text variant="footnote" className="text-ink-muted">
                        {c.country}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.grape} />
                    ) : locked ? (
                      <Ionicons name="lock-closed" size={18} color={colors.inkSubtle} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </Card>
          <Text variant="footnote" className="text-ink-subtle">
            Cities open as they reach enough verified hosts and meetups to be worth your time.
          </Text>
        </View>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-canvas px-5 pb-8 pt-4">
        <Button
          label={city ? `Show ${city.name} meetups` : 'Back to discover'}
          onPress={() => router.back()}
          rightIcon={<Ionicons name="arrow-forward" size={18} color={colors.inkInverse} />}
        />
      </View>
    </Screen>
  );
}
