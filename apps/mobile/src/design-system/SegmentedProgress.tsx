import { View } from 'react-native';
import { cn } from '@/lib/cn';

/**
 * Onboarding step indicator — the redesign's 3-segment bar at the top of each
 * auth/onboarding screen. The active (and completed) segments fill ember; the
 * upcoming ones stay sunken. Purely presentational.
 */
export interface SegmentedProgressProps {
  /** Total number of steps. */
  steps: number;
  /** 1-based index of the current step (segments < current render as done). */
  current: number;
  className?: string;
}

export function SegmentedProgress({
  steps,
  current,
  className,
}: SegmentedProgressProps): React.ReactElement {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: steps, now: current }}
      className={cn('flex-row items-center gap-1.5', className)}
    >
      {Array.from({ length: steps }).map((_, i) => (
        <View
          key={i}
          className={cn(
            'h-1.5 rounded-full',
            i < current ? 'w-7 bg-ember' : 'w-5 bg-surface-sunken',
          )}
        />
      ))}
    </View>
  );
}
