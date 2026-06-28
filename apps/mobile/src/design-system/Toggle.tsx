import { Switch, View } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';

/**
 * Labelled switch row used for granular consent + safety toggles. Each row is an
 * independent control — consent is never bundled (KVKK açık rıza).
 */
export interface ToggleProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Optional leading accent (e.g. a small colored icon dot). */
  accent?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  title,
  description,
  value,
  onValueChange,
  accent,
  disabled = false,
  className,
}: ToggleProps): React.ReactElement {
  return (
    <View className={cn('flex-row items-center gap-3 py-3', className)}>
      {accent ? <View>{accent}</View> : null}
      <View className="flex-1 pr-2">
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="footnote" className="mt-0.5 text-ink-muted">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.surfaceSunken, true: colors.ember }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.surfaceSunken}
      />
    </View>
  );
}
