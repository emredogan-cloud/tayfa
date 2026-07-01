import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { colors, shadows } from './tokens';
import { Text } from './Text';
import { Button } from './Button';

/**
 * Overlay primitives — the app's modal vocabulary. `Sheet` is a bottom sheet with
 * a grab handle (safety actions, filters); `CenterModal` is a centered card
 * (confirmations, reason pickers). `ConfirmDialog` and `LocationPrimingDialog`
 * compose `CenterModal` into the two flows we reuse most.
 */

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ visible, onClose, children }: SheetProps): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" accessibilityLabel="Close" onPress={onClose} />
      <View
        style={shadows.floating}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-canvas px-5 pb-10 pt-3"
      >
        <View className="mb-3 items-center">
          <View className="h-1.5 w-12 rounded-full bg-surface-sunken" />
        </View>
        {children}
      </View>
    </Modal>
  );
}

export interface CenterModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function CenterModal({ visible, onClose, children }: CenterModalProps): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center px-6">
        <Pressable
          className="absolute inset-0 bg-black/50"
          accessibilityLabel="Close"
          onPress={onClose}
        />
        <View style={shadows.floating} className="rounded-3xl bg-surface p-6">
          {children}
        </View>
      </View>
    </Modal>
  );
}

type DialogTone = 'danger' | 'grape' | 'ember' | 'verified';

const DIALOG_HALO: Record<DialogTone, { soft: string; fg: string }> = {
  danger: { soft: 'bg-danger-soft', fg: colors.danger },
  grape: { soft: 'bg-grape-soft', fg: colors.grape },
  ember: { soft: 'bg-ember-soft', fg: colors.ember },
  verified: { soft: 'bg-verified-soft', fg: colors.verified },
};

export interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: DialogTone;
  title: string;
  message: string;
  confirmLabel: string;
  /** Pass `null` to hide the secondary button (e.g. a success acknowledgement). */
  cancelLabel?: string | null;
  loading?: boolean;
  error?: string | null;
  /** Optional extra content (e.g. a confirmation text field) above the buttons. */
  children?: React.ReactNode;
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  icon = 'alert-circle',
  tone = 'danger',
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  loading = false,
  error,
  children,
  confirmDisabled = false,
}: ConfirmDialogProps): React.ReactElement {
  const halo = DIALOG_HALO[tone];
  return (
    <CenterModal visible={visible} onClose={onClose}>
      <View className="items-center gap-2">
        <View className={cn('h-14 w-14 items-center justify-center rounded-full', halo.soft)}>
          <Ionicons name={icon} size={28} color={halo.fg} />
        </View>
        <Text variant="h1" className="text-center">
          {title}
        </Text>
        <Text variant="callout" className="text-center text-ink-muted">
          {message}
        </Text>
      </View>

      {children ? <View className="mt-4">{children}</View> : null}

      {error ? (
        <Text variant="footnote" className="mt-3 text-center text-danger">
          {error}
        </Text>
      ) : null}

      <View className="mt-5 gap-2">
        <Button
          label={confirmLabel}
          variant={tone === 'grape' ? 'premium' : tone === 'danger' ? 'danger' : 'primary'}
          loading={loading}
          disabled={confirmDisabled}
          onPress={onConfirm}
        />
        {cancelLabel ? <Button label={cancelLabel} variant="ghost" onPress={onClose} /> : null}
      </View>
    </CenterModal>
  );
}

export interface LocationPrimingDialogProps {
  visible: boolean;
  onClose: () => void;
  onAllow: () => void;
}

/**
 * Pre-permission priming (redesign `21b`). Shown BEFORE the OS location prompt so
 * people know exactly why we ask and — critically — that only their neighborhood
 * is ever shared. Declining is a first-class choice ("Not now"), never a wall.
 */
export function LocationPrimingDialog({
  visible,
  onClose,
  onAllow,
}: LocationPrimingDialogProps): React.ReactElement {
  return (
    <CenterModal visible={visible} onClose={onClose}>
      <View className="items-center gap-2">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-ember-soft">
          <Ionicons name="location" size={28} color={colors.ember} />
        </View>
        <Text variant="h1" className="text-center">
          Share your location?
        </Text>
        <Text variant="callout" className="text-center text-ink-muted">
          We use it to show meetups near you and to pin where you&apos;re hosting.
        </Text>
      </View>

      <View className="mt-4 gap-2.5 rounded-2xl bg-verified-soft p-4">
        {[
          'Others only ever see the neighborhood — never your exact spot.',
          'Your precise pin stays on your device and with the server, never other users.',
          'You can turn it off anytime in Settings.',
        ].map((line) => (
          <View key={line} className="flex-row items-start gap-2">
            <Ionicons name="shield-checkmark" size={15} color={colors.verified} />
            <Text variant="footnote" className="flex-1 text-ink">
              {line}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-5 gap-2">
        <Button
          label="Allow location"
          onPress={onAllow}
          rightIcon={<Ionicons name="arrow-forward" size={18} color={colors.inkInverse} />}
        />
        <Button label="Not now" variant="ghost" onPress={onClose} />
      </View>
    </CenterModal>
  );
}
