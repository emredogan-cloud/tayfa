import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CreateEvent } from '@tayfa/shared/schemas';
import type { EventVisibility } from '@tayfa/shared/types';
import { GROUP_DEFAULTS } from '@tayfa/shared/constants';
import { checkActionAllowed } from '@tayfa/shared/domain';
import { useCreateEvent } from '@/api';
import { Badge, Button, Card, colors, Screen, Text, TextField, Toggle } from '@/design-system';
import { useNearbyCenter } from '@/lib/useLocation';
import { useSession } from '@/stores/session';

interface Template {
  readonly id: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly label: string;
  readonly category: string;
  readonly titleSeed: string;
  readonly capacityMax: number;
}

const TEMPLATES: readonly Template[] = [
  {
    id: 'tpl_coffee',
    icon: 'cafe',
    label: 'Coffee & chat',
    category: 'coffee',
    titleSeed: 'Third-wave coffee & good talk',
    capacityMax: 4,
  },
  {
    id: 'tpl_football',
    icon: 'football',
    label: 'Kickabout',
    category: 'sport',
    titleSeed: 'Sunday football kickabout',
    capacityMax: 10,
  },
  {
    id: 'tpl_boardgame',
    icon: 'dice',
    label: 'Board games',
    category: 'games',
    titleSeed: 'Board game night',
    capacityMax: 6,
  },
  {
    id: 'tpl_gallery',
    icon: 'color-palette',
    label: 'Gallery walk',
    category: 'art',
    titleSeed: 'Gallery hop in the neighborhood',
    capacityMax: 5,
  },
  {
    id: 'tpl_live',
    icon: 'musical-notes',
    label: 'Live music',
    category: 'music',
    titleSeed: 'Catch a live set together',
    capacityMax: 6,
  },
  {
    id: 'tpl_hike',
    icon: 'trail-sign',
    label: 'Hike',
    category: 'outdoors',
    titleSeed: 'Morning hike & breakfast',
    capacityMax: 8,
  },
];

interface WhenOption {
  readonly key: string;
  readonly label: string;
  readonly compute: () => { startsAt: string; endsAt: string };
}

function at(date: Date, hour: number): Date {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}
function plusHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}
function nextWeekday(target: number, hour: number): Date {
  const d = new Date();
  const delta = (target - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return at(d, hour);
}

const WHEN_OPTIONS: readonly WhenOption[] = [
  {
    key: 'tonight',
    label: 'Tonight 19:00',
    compute: () => {
      let start = at(new Date(), 19);
      if (start.getTime() < Date.now()) start = at(new Date(Date.now() + 86_400_000), 19);
      const startsAt = start.toISOString();
      return { startsAt, endsAt: plusHours(startsAt, 2) };
    },
  },
  {
    key: 'tomorrow',
    label: 'Tomorrow 19:00',
    compute: () => {
      const startsAt = at(new Date(Date.now() + 86_400_000), 19).toISOString();
      return { startsAt, endsAt: plusHours(startsAt, 2) };
    },
  },
  {
    key: 'saturday',
    label: 'Saturday 15:00',
    compute: () => {
      const startsAt = nextWeekday(6, 15).toISOString();
      return { startsAt, endsAt: plusHours(startsAt, 3) };
    },
  },
];

const VISIBILITY: ReadonlyArray<{ value: EventVisibility; label: string; hint: string }> = [
  { value: 'public', label: 'Public', hint: 'Anyone nearby can join instantly' },
  { value: 'interest_match', label: 'Match', hint: 'You approve people who share your taste' },
  { value: 'invite', label: 'Invite', hint: 'Only people you invite can join' },
];

/**
 * Host wizard (P3). Template gallery → details → location → time → group size →
 * visibility + safety filters. Capacity min is locked at GROUP_DEFAULTS.minCapacity
 * (no 1:1 — that's a dating pattern we refuse). Hosting requires Verified+ (free):
 * we surface that gate honestly rather than letting the publish fail server-side.
 */
export default function CreateScreen(): React.ReactElement {
  const router = useRouter();
  const { center, usingFallback } = useNearbyCenter();
  const verificationLevel = useSession((s) => s.verificationLevel);
  const create = useCreateEvent();

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [whenKey, setWhenKey] = useState<string>(WHEN_OPTIONS[0]?.key ?? 'tonight');
  const [capacityMax, setCapacityMax] = useState<number>(GROUP_DEFAULTS.defaultMaxCapacity);
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId) ?? null, [templateId]);
  const hostGate = checkActionAllowed('host_event', verificationLevel);
  const canHost = hostGate.allowed;
  const titleValid = title.trim().length >= 6;

  function applyTemplate(t: Template): void {
    setTemplateId(t.id);
    if (!title.trim()) setTitle(t.titleSeed);
    setCapacityMax(t.capacityMax);
  }

  function onPublish(): void {
    setError(null);
    if (!canHost) return;
    const when =
      WHEN_OPTIONS.find((w) => w.key === whenKey)?.compute() ?? WHEN_OPTIONS[0]?.compute();
    if (!when) return;

    const payload: CreateEvent = {
      title: title.trim(),
      category: template?.category ?? 'social',
      location: center,
      startsAt: when.startsAt,
      endsAt: when.endsAt,
      capacityMin: GROUP_DEFAULTS.minCapacity,
      capacityMax,
      visibility,
      interestIds: [],
      womenOnly,
      verifiedOnly,
      ...(venueName.trim() ? { venueName: venueName.trim() } : {}),
      ...(template ? { fromTemplateId: template.id } : {}),
    };

    create.mutate(payload, {
      onSuccess: (created) => router.replace(`/event/${created.id}`),
      onError: (e) => setError(e instanceof Error ? e.message : 'Could not publish. Try again.'),
    });
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerClassName="px-5 pt-6 pb-40 gap-6"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text variant="display">Host a{'\n'}hangout</Text>
          <Text variant="callout" className="mt-2 text-ink-muted">
            Small groups, shared interests, real life. Start from a template or freestyle.
          </Text>
        </View>

        {!canHost ? (
          <Card className="gap-3 border-verified-soft bg-verified-soft">
            <View className="flex-row items-center gap-2">
              <Ionicons name="shield-checkmark" size={20} color={colors.verified} />
              <Text variant="bodyStrong" className="text-verified">
                Verify to host — it's free
              </Text>
            </View>
            <Text variant="footnote" className="text-ink-muted">
              Hosting needs ID + liveness (Verified+). It's free and takes a minute; it's what makes
              Tayfa meetups safe enough to show up to.
            </Text>
            <Button
              label="Start free verification"
              variant="secondary"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </Card>
        ) : null}

        {/* Templates */}
        <View className="gap-3">
          <Text variant="caption" className="text-ink-subtle">
            Template gallery
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {TEMPLATES.map((t) => {
              const active = templateId === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => applyTemplate(t)}
                  className="w-[31%] active:opacity-80"
                >
                  <View
                    className={`aspect-square items-center justify-center gap-2 rounded-xl border ${
                      active ? 'border-ember bg-ember-soft' : 'border-line bg-surface'
                    }`}
                  >
                    <Ionicons
                      name={t.icon}
                      size={26}
                      color={active ? colors.ember : colors.inkMuted}
                    />
                    <Text
                      variant="footnote"
                      className={active ? 'text-ember-dark' : 'text-ink-muted'}
                    >
                      {t.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Details */}
        <TextField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="What are you doing?"
          maxLength={80}
          showCounter
        />

        {/* Location (map picker placeholder) */}
        <View className="gap-2">
          <Text variant="label" className="text-ink-muted">
            Where
          </Text>
          <Card className="gap-3">
            <View className="h-28 items-center justify-center rounded-lg bg-surface-sunken">
              <Ionicons name="map" size={28} color={colors.inkSubtle} />
              <Text variant="footnote" className="mt-1 text-ink-subtle">
                {usingFallback
                  ? 'Using city center — drag to set exact spot'
                  : 'Pinned to your location'}
              </Text>
            </View>
            <Text variant="footnote" className="text-ink-muted">
              Your exact pin stays private. Guests see only the neighborhood until they're approved
              and it's nearly time to meet.
            </Text>
            <TextField
              label="Venue name (optional)"
              value={venueName}
              onChangeText={setVenueName}
              placeholder="e.g. Moda Sahil, Walter's Coffee"
              maxLength={120}
            />
          </Card>
        </View>

        {/* When */}
        <View className="gap-2">
          <Text variant="label" className="text-ink-muted">
            When
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {WHEN_OPTIONS.map((w) => {
              const active = whenKey === w.key;
              return (
                <Pressable
                  key={w.key}
                  onPress={() => setWhenKey(w.key)}
                  className={`rounded-full border px-4 py-2 active:opacity-80 ${
                    active ? 'border-ember bg-ember' : 'border-line bg-surface-alt'
                  }`}
                >
                  <Text
                    variant="subhead"
                    className={active ? 'text-ink-inverse' : 'text-ink-muted'}
                  >
                    {w.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Group size */}
        <View className="gap-2">
          <Text variant="label" className="text-ink-muted">
            Group size
          </Text>
          <Card className="flex-row items-center justify-between">
            <View>
              <Text variant="bodyStrong">Up to {capacityMax} people</Text>
              <Text variant="footnote" className="text-ink-muted">
                Minimum {GROUP_DEFAULTS.minCapacity} — Tayfa is never 1:1
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Stepper
                icon="remove"
                disabled={capacityMax <= GROUP_DEFAULTS.minCapacity}
                onPress={() => setCapacityMax((c) => Math.max(GROUP_DEFAULTS.minCapacity, c - 1))}
              />
              <Text variant="h2">{capacityMax}</Text>
              <Stepper
                icon="add"
                disabled={capacityMax >= GROUP_DEFAULTS.hardMaxCapacity}
                onPress={() =>
                  setCapacityMax((c) => Math.min(GROUP_DEFAULTS.hardMaxCapacity, c + 1))
                }
              />
            </View>
          </Card>
        </View>

        {/* Visibility */}
        <View className="gap-2">
          <Text variant="label" className="text-ink-muted">
            Who can join
          </Text>
          <View className="flex-row gap-2">
            {VISIBILITY.map((v) => {
              const active = visibility === v.value;
              return (
                <Pressable
                  key={v.value}
                  onPress={() => setVisibility(v.value)}
                  className={`flex-1 rounded-xl border p-3 active:opacity-80 ${
                    active ? 'border-ember bg-ember-soft' : 'border-line bg-surface'
                  }`}
                >
                  <Text variant="bodyStrong" className={active ? 'text-ember-dark' : 'text-ink'}>
                    {v.label}
                  </Text>
                  <Text variant="footnote" className="mt-0.5 text-ink-muted">
                    {v.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Safety filters (FREE) */}
        <Card padded={false} className="px-4">
          <Toggle
            title="Women only"
            description="Only women can see and join. A free safety option."
            value={womenOnly}
            onValueChange={setWomenOnly}
          />
          <View className="h-px bg-line" />
          <Toggle
            title="Verified+ only"
            description="Require ID + liveness verified guests."
            value={verifiedOnly}
            onValueChange={setVerifiedOnly}
          />
        </Card>

        {womenOnly || verifiedOnly ? (
          <Badge label="Free safety filters — never paywalled" tone="success" icon="lock-open" />
        ) : null}

        {error ? (
          <Text variant="footnote" className="text-danger">
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-canvas px-5 pb-8 pt-4">
        <Button
          label={canHost ? 'Publish hangout' : 'Verify to publish'}
          loading={create.isPending}
          disabled={!canHost || !titleValid}
          onPress={onPublish}
        />
      </View>
    </Screen>
  );
}

function Stepper({
  icon,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-10 w-10 items-center justify-center rounded-full border border-line-strong active:opacity-70 ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      <Ionicons name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
}
