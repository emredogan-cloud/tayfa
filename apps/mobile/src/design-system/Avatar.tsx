import { Image } from 'expo-image';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './Text';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const DIMENSION: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 44, lg: 64, xl: 88 };
const TEXT: Record<AvatarSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-[12px]',
  md: 'text-[16px]',
  lg: 'text-[22px]',
  xl: 'text-[30px]',
};

// Deterministic warm tint per user so fallbacks feel intentional, not random.
const TINTS = [
  'bg-ember-soft',
  'bg-amber-soft',
  'bg-grape-soft',
  'bg-verified-soft',
  'bg-women-soft',
];
const TINT_TEXT = ['text-ember-dark', 'text-amber', 'text-grape', 'text-verified', 'text-women'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function tintIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % TINTS.length;
}

export interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: AvatarSize;
  /** Soft ring (e.g. verified members in a stack). */
  ring?: boolean;
  className?: string;
}

export function Avatar({
  name,
  uri,
  size = 'md',
  ring = false,
  className,
}: AvatarProps): React.ReactElement {
  const dim = DIMENSION[size];
  const idx = tintIndex(name);
  return (
    <View
      style={{ width: dim, height: dim, borderRadius: dim / 2 }}
      className={cn(
        'items-center justify-center overflow-hidden',
        TINTS[idx],
        ring && 'border-2 border-surface',
        className,
      )}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim }}
          contentFit="cover"
          transition={150}
          accessibilityLabel={name}
        />
      ) : (
        <Text className={cn('font-bold', TEXT[size], TINT_TEXT[idx])}>{initials(name)}</Text>
      )}
    </View>
  );
}

/** Overlapping avatar stack — "who's going" social proof. */
export interface AvatarStackProps {
  people: ReadonlyArray<{ name: string; uri?: string | null }>;
  max?: number;
  size?: AvatarSize;
}

export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
}: AvatarStackProps): React.ReactElement {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  const dim = DIMENSION[size];
  return (
    <View className="flex-row items-center">
      {shown.map((p, i) => (
        <View key={`${p.name}-${i}`} style={{ marginLeft: i === 0 ? 0 : -dim / 3 }}>
          <Avatar name={p.name} uri={p.uri ?? null} size={size} ring />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={{ width: dim, height: dim, borderRadius: dim / 2, marginLeft: -dim / 3 }}
          className="items-center justify-center border-2 border-surface bg-surface-sunken"
        >
          <Text className="text-[11px] font-bold text-ink-muted">+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}
