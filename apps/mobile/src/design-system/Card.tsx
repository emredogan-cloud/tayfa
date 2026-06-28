import { Pressable, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';
import { shadows } from './tokens';

export interface CardProps extends ViewProps {
  /** Make the whole card a press target (feed cards, list rows). */
  onPress?: () => void;
  elevated?: boolean;
  padded?: boolean;
  className?: string;
}

export function Card({
  onPress,
  elevated = true,
  padded = true,
  className,
  children,
  ...rest
}: CardProps): React.ReactElement {
  const classes = cn('bg-surface rounded-2xl border border-line', padded && 'p-4', className);
  const style = elevated ? shadows.card : undefined;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={style}
        className={cn(classes, 'active:opacity-95')}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={style} className={classes} {...rest}>
      {children}
    </View>
  );
}
