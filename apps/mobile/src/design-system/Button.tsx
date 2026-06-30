import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium';
export type ButtonSize = 'sm' | 'md' | 'lg';

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-ember active:bg-ember-dark',
  secondary: 'bg-surface border border-line-strong active:bg-surface-alt',
  ghost: 'bg-transparent active:bg-surface-alt',
  danger: 'bg-danger active:opacity-90',
  premium: 'bg-grape active:opacity-90',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-ink-inverse',
  secondary: 'text-ink',
  ghost: 'text-ember',
  danger: 'text-ink-inverse',
  premium: 'text-ink-inverse',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 rounded-md',
  md: 'h-12 px-5 rounded-lg',
  lg: 'h-14 px-6 rounded-xl',
};

const SPINNER_TINT: Record<ButtonVariant, string> = {
  primary: colors.inkInverse,
  secondary: colors.ink,
  ghost: colors.ember,
  danger: colors.inkInverse,
  premium: colors.inkInverse,
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  /** Trailing icon (e.g. the redesign's CTA arrow), pinned to the far end. */
  rightIcon?: React.ReactNode;
  className?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...rest
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled === true || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'relative flex-row items-center justify-center gap-2',
        SIZE[size],
        CONTAINER[variant],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={SPINNER_TINT[variant]} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text variant="bodyStrong" className={LABEL[variant]}>
            {label}
          </Text>
          {/* Trailing icon is pinned to the right edge so the label stays centered. */}
          {rightIcon ? (
            <View className="absolute inset-y-0 right-5 items-center justify-center">
              {rightIcon}
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
