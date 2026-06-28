import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'className' | 'style'> {
  label?: string;
  hint?: string;
  error?: string | null;
  /** Right-aligned character counter when a maxLength is given. */
  showCounter?: boolean;
  className?: string;
}

export function TextField({
  label,
  hint,
  error,
  showCounter = false,
  maxLength,
  value,
  onFocus,
  onBlur,
  className,
  ...rest
}: TextFieldProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const count = typeof value === 'string' ? value.length : 0;

  return (
    <View className={cn('gap-1.5', className)}>
      {label ? (
        <Text variant="label" className="text-ink-muted">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          'rounded-lg border bg-surface px-4',
          hasError ? 'border-danger' : focused ? 'border-ember' : 'border-line-strong',
        )}
      >
        <TextInput
          value={value}
          maxLength={maxLength}
          placeholderTextColor={colors.inkSubtle}
          selectionColor={colors.ember}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className="min-h-[48px] py-3 text-[16px] leading-[22px] text-ink"
          {...rest}
        />
      </View>
      <View className="flex-row items-center justify-between">
        <Text variant="footnote" className={hasError ? 'text-danger' : 'text-ink-subtle'}>
          {error ?? hint ?? ' '}
        </Text>
        {showCounter && maxLength ? (
          <Text variant="footnote" className="text-ink-subtle">
            {count}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
