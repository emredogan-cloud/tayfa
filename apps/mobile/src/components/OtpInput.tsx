import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/design-system';
import { cn } from '@/lib/cn';

/**
 * Six-box one-time-code input (redesign `02-auth-otp`). A single hidden
 * <TextInput> owns the value (so OS SMS autofill works); the boxes are a purely
 * visual projection of it. Tapping anywhere focuses the field.
 */
export interface OtpInputProps {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  onComplete,
  autoFocus = false,
}: OtpInputProps): React.ReactElement {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.split('');

  function handleChange(text: string): void {
    const next = text.replace(/\D/g, '').slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  }

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => inputRef.current?.focus()}
      className="relative"
    >
      <View className="flex-row justify-between">
        {Array.from({ length }).map((_, i) => {
          const char = digits[i];
          const isActive = focused && i === value.length;
          return (
            <View
              key={i}
              className={cn(
                'h-16 w-[15%] items-center justify-center rounded-2xl border bg-surface',
                isActive ? 'border-ember' : char ? 'border-line-strong' : 'border-line',
              )}
            >
              {char ? (
                <Text style={{ fontSize: 24, lineHeight: 28 }} className="font-bold text-ink">
                  {char}
                </Text>
              ) : isActive ? (
                <View className="h-6 w-0.5 rounded-full bg-ember" />
              ) : (
                <View className="h-1.5 w-1.5 rounded-full bg-line-strong" />
              )}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
        className="absolute h-full w-full opacity-0"
      />
    </Pressable>
  );
}
