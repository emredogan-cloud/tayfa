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

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

export function Text({ variant = 'body', className, ...rest }: TextProps): React.ReactElement {
  return <RNText className={cn('text-ink', VARIANT[variant], className)} {...rest} />;
}
