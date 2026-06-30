import {
  PixelRatio,
  StyleSheet,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';
import { cn } from '@/lib/cn';

/**
 * Typographic scale. One <Text> everywhere keeps the type system cohesive and
 * the screens declarative — pick a role, not a font size.
 *
 * ACCESSIBILITY: font size + line height live in a computed style, not fixed
 * Tailwind classes, so the line box scales WITH the (capped) OS font scale. RN
 * scales an explicit `fontSize` by the OS setting but never an explicit
 * `lineHeight`; left fixed, large accessibility scales make headings overlap their
 * own next line (RC audit D2). Here each variant keeps a constant lineHeight:size
 * ratio at every scale, and big display/heading type is capped so layouts never
 * break, while body copy is allowed to grow generously.
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

interface VariantSpec {
  readonly size: number;
  readonly line: number;
  /** Per-variant font-scaling ceiling (headings tight, body generous). */
  readonly maxScale: number;
  /** Weight / tracking / transform only — never font size or line height. */
  readonly cls: string;
}

const VARIANT: Record<TextVariant, VariantSpec> = {
  display: { size: 34, line: 40, maxScale: 1.2, cls: 'font-extrabold tracking-tight' },
  title: { size: 27, line: 33, maxScale: 1.2, cls: 'font-bold tracking-tight' },
  h1: { size: 22, line: 28, maxScale: 1.25, cls: 'font-bold' },
  h2: { size: 18, line: 24, maxScale: 1.3, cls: 'font-bold' },
  body: { size: 15, line: 22, maxScale: 1.6, cls: 'font-normal' },
  bodyStrong: { size: 15, line: 22, maxScale: 1.6, cls: 'font-semibold' },
  callout: { size: 16, line: 22, maxScale: 1.5, cls: 'font-medium' },
  subhead: { size: 14, line: 20, maxScale: 1.5, cls: 'font-medium' },
  footnote: { size: 13, line: 18, maxScale: 1.5, cls: 'font-normal' },
  caption: { size: 11, line: 14, maxScale: 1.4, cls: 'font-semibold uppercase tracking-[1.2px]' },
  label: { size: 13, line: 16, maxScale: 1.4, cls: 'font-semibold' },
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

export function Text({
  variant = 'body',
  className,
  style,
  ...rest
}: TextProps): React.ReactElement {
  const v = VARIANT[variant];
  // Apply the OS font scale (capped per variant) to BOTH size and line height so the
  // ratio is fixed at every scale — deterministic, independent of RN's internal
  // line-height handling. `allowFontScaling={false}` stops RN double-scaling.
  const scale = Math.min(PixelRatio.getFontScale(), v.maxScale);
  const computed: TextStyle = {
    fontSize: Math.round(v.size * scale),
    lineHeight: Math.round(v.line * scale),
  };
  return (
    <RNText
      allowFontScaling={false}
      style={StyleSheet.flatten([computed, style])}
      className={cn('text-ink', v.cls, className)}
      {...rest}
    />
  );
}
