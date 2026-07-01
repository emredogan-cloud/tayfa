import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { ReportInput } from '@tayfa/shared/schemas';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';
import { Sheet, CenterModal } from './Overlay';

type ReportReason = ReportInput['reason'];

/** One tappable action row used by both the safety sheet and the report picker. */
function ActionRow({
  icon,
  iconSoft,
  iconColor,
  title,
  desc,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconSoft: string;
  iconColor: string;
  title: string;
  desc: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-surface-alt"
    >
      <View className={cn('h-12 w-12 items-center justify-center rounded-full', iconSoft)}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="footnote" className="mt-0.5 text-ink-muted">
          {desc}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.ember} />
    </Pressable>
  );
}

export interface SafetyActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onBlock: () => void;
  onReportEvent: () => void;
  onReportUser: () => void;
  /** Shown as a low-key row when the viewer is a member of the meetup. */
  onLeave?: () => void;
}

/**
 * Safety action sheet (redesign `16-block-flow`). The single entry point behind
 * the "…" overflow on a meetup: block, report the meetup, or report the host.
 * Safety is never paywalled — this sheet is identical for free and Tayfa+.
 */
export function SafetyActionsSheet({
  visible,
  onClose,
  onBlock,
  onReportEvent,
  onReportUser,
  onLeave,
}: SafetyActionsSheetProps): React.ReactElement {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="mb-4 flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-danger-soft">
          <Ionicons name="shield" size={22} color={colors.danger} />
        </View>
        <View className="flex-1">
          <Text variant="h1">Safety</Text>
          <Text variant="footnote" className="text-ink-muted">
            Your safety comes first.
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityLabel="Close"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="close" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View className="gap-3">
        <ActionRow
          icon="ban"
          iconSoft="bg-danger-soft"
          iconColor={colors.danger}
          title="Block host"
          desc="You won't see this host's meetups or messages."
          onPress={onBlock}
        />
        <ActionRow
          icon="alert-circle"
          iconSoft="bg-ember-soft"
          iconColor={colors.ember}
          title="Report meetup"
          desc="Report this meetup if something doesn't feel right."
          onPress={onReportEvent}
        />
        <ActionRow
          icon="flag"
          iconSoft="bg-grape-soft"
          iconColor={colors.grape}
          title="Report host"
          desc="Report this host if they've violated our guidelines."
          onPress={onReportUser}
        />
      </View>

      {onLeave ? (
        <Pressable
          onPress={onLeave}
          accessibilityRole="button"
          className="mt-3 items-center rounded-2xl py-3 active:opacity-70"
        >
          <Text variant="bodyStrong" className="text-danger">
            Leave meetup
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        className="mt-3 items-center rounded-2xl border border-line bg-surface-alt py-3.5 active:opacity-80"
      >
        <Text variant="bodyStrong" className="text-ink-muted">
          Cancel
        </Text>
      </Pressable>
    </Sheet>
  );
}

interface ReasonSpec {
  key: ReportReason;
  icon: keyof typeof Ionicons.glyphMap;
  iconSoft: string;
  iconColor: string;
  title: string;
  desc: string;
}

const REPORT_REASONS: readonly ReasonSpec[] = [
  {
    key: 'imminent_harm',
    icon: 'shield',
    iconSoft: 'bg-danger-soft',
    iconColor: colors.danger,
    title: 'Safety Threat',
    desc: 'Someone is in danger or feels unsafe',
  },
  {
    key: 'scam',
    icon: 'card',
    iconSoft: 'bg-amber-soft',
    iconColor: colors.amber,
    title: 'Scam or Money Request',
    desc: 'Asking for money or promoting scams',
  },
  {
    key: 'harassment',
    icon: 'person',
    iconSoft: 'bg-grape-soft',
    iconColor: colors.grape,
    title: 'Harassment',
    desc: 'Bullying, hate, or inappropriate behavior',
  },
];

export interface ReportReasonDialogProps {
  visible: boolean;
  onClose: () => void;
  /** e.g. "this meetup" / "this host" — completes the "Report …" heading. */
  targetLabel: string;
  onPick: (reason: ReportReason) => void;
}

/**
 * Report reason picker (redesign `15-report-flow`). A centered dialog with the
 * three most common report categories; the choice maps to a `reportReasonSchema`
 * key so the BFF and moderation pipeline stay authoritative.
 */
export function ReportReasonDialog({
  visible,
  onClose,
  targetLabel,
  onPick,
}: ReportReasonDialogProps): React.ReactElement {
  return (
    <CenterModal visible={visible} onClose={onClose}>
      <View className="items-center gap-1.5">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
          <Ionicons name="shield" size={26} color={colors.danger} />
        </View>
        <Text variant="h1" className="text-center">
          Report {targetLabel}
        </Text>
        <Text variant="callout" className="text-center text-ink-muted">
          Why are you reporting it?
        </Text>
      </View>

      <View className="mt-4 gap-2.5">
        {REPORT_REASONS.map((r) => (
          <ActionRow
            key={r.key}
            icon={r.icon}
            iconSoft={r.iconSoft}
            iconColor={r.iconColor}
            title={r.title}
            desc={r.desc}
            onPress={() => onPick(r.key)}
          />
        ))}
      </View>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        className="mt-3 items-center rounded-2xl border border-line bg-surface-alt py-3.5 active:opacity-80"
      >
        <Text variant="bodyStrong" className="text-ink-muted">
          Cancel
        </Text>
      </Pressable>
    </CenterModal>
  );
}
