import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { shadows } from './tokens';
import { Text } from './Text';

/**
 * Reassurance strip used across auth/safety surfaces in the redesign — a white
 * card with N evenly-spaced items, each an ember-soft icon badge + a short
 * (often two-line) label, divided by hairlines. Communicates "verified-only /
 * private / safer" without heavy copy.
 */
export interface TrustItem {
  icon: React.ReactNode;
  label: string;
}

export interface TrustRowProps {
  items: TrustItem[];
  className?: string;
}

export function TrustRow({ items, className }: TrustRowProps): React.ReactElement {
  return (
    <View
      style={shadows.card}
      className={cn('flex-row items-stretch rounded-2xl bg-surface px-1 py-3', className)}
    >
      {items.map((item, i) => (
        <View key={i} className="flex-1 flex-row items-center">
          <View className="flex-1 flex-row items-center gap-2 px-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-ember-soft">
              {item.icon}
            </View>
            <Text variant="footnote" className="flex-1 font-semibold text-ink">
              {item.label}
            </Text>
          </View>
          {i < items.length - 1 ? <View className="w-px self-stretch bg-line" /> : null}
        </View>
      ))}
    </View>
  );
}
