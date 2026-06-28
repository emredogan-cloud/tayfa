import { ScrollView, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';

export type ScreenEdge = 'top' | 'bottom' | 'left' | 'right';

/**
 * The base screen frame: warm canvas background + safe-area insets applied as
 * padding (we use insets directly rather than SafeAreaView so NativeWind owns
 * all styling). Pass `scroll` for content screens; keep it off for screens that
 * own their own list (FlatList) so we don't nest scroll views.
 */
export interface ScreenProps extends ViewProps {
  scroll?: boolean;
  /** Horizontal page padding (most screens want it; full-bleed lists don't). */
  padded?: boolean;
  edges?: ScreenEdge[];
  className?: string;
  contentClassName?: string;
}

export function Screen({
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  className,
  contentClassName,
  children,
  style,
  ...rest
}: ScreenProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const inset = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };
  const inner = cn(padded && 'px-5', contentClassName);

  return (
    <View style={[inset, style]} className={cn('flex-1 bg-canvas', className)} {...rest}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn('pb-10', inner)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1', inner)}>{children}</View>
      )}
    </View>
  );
}
