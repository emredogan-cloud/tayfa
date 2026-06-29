import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/cn';

/**
 * Typographic scale. One <Text> everywhere keeps the type system cohesive and
 * the screens declarative — pick a role, not a font size.
 */
export type TextVariant =
  | 'display'
  | 'title'
  | 'h1'
  | 'h2'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption'
  | 'label';

const VARIANT: Record<TextVariant, string> = {
  display: 'text-[34px] leading-[40px] font-extrabold tracking-tight',
  title: 'text-[27px] leading-[33px] font-bold tracking-tight',
  h1: 'text-[22px] leading-[28px] font-bold',
  h2: 'text-[18px] leading-[24px] font-bold',
  body: 'text-[15px] leading-[22px] font-normal',
  bodyStrong: 'text-[15px] leading-[22px] font-semibold',
  callout: 'text-[16px] leading-[22px] font-medium',
  subhead: 'text-[14px] leading-[20px] font-medium',
  footnote: 'text-[13px] leading-[18px] font-normal',
  caption: 'text-[11px] leading-[14px] font-semibold uppercase tracking-[1.2px]',
  label: 'text-[13px] leading-[16px] font-semibold',
};

/**
 * Per-variant font-scaling ceiling. Variants use fixed line-heights, so unbounded
 * OS font-scaling makes large headings overlap their own next line and clips
 * fixed-width chrome. We still honour accessibility scaling — generously for body
 * copy — but cap big display/heading type so layouts never break (a11y audit).
 */
const VARIANT_MAX_SCALE: Record<TextVariant, number> = {
  display: 1.2,
  title: 1.2,
  h1: 1.25,
  h2: 1.3,
  body: 1.6,
  bodyStrong: 1.6,
  callout: 1.5,
  subhead: 1.5,
  footnote: 1.5,
  caption: 1.4,
  label: 1.4,
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

export function Text({ variant = 'body', className, ...rest }: TextProps): React.ReactElement {
  return (
    <RNText
      maxFontSizeMultiplier={VARIANT_MAX_SCALE[variant]}
      className={cn('text-ink', VARIANT[variant], className)}
      {...rest}
    />
  );
}
