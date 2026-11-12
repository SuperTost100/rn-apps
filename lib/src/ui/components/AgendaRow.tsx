import { ReactElement } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTextScale } from '../hooks/useTextScale';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { MAX_COMBINED_TEXT_SCALE } from '../utils/text-scale';
import { Badge } from './Badge';
import { ListItem } from './ListItem';
import { StatusChip, StatusChipTone } from './StatusChip';
import { Text } from './Text';

export interface AgendaRowProps {
  /** "08:30". Without it the row is for the whole day */
  startTime?: string;
  /** "10:00" */
  endTime?: string;
  /** Shown in the time column of an item for the whole day ("All day") */
  allDayLabel?: string;
  /** The course tile, or a neutral tile for bookings and deadlines */
  leadingItem: ReactElement;
  title: string;
  /** The room, or where the item takes place */
  subtitle?: string;
  /** The type of an item that is not a lecture: Exam, Booking, Deadline */
  typeLabel?: string;
  typeTone?: StatusChipTone;
  /** In progress: the start time in the accent colour and a "Now" chip */
  isNow?: boolean;
  /** The chip's word, translated */
  nowLabel?: string;
  /** Ended: the time and the title in the secondary colour */
  isPast?: boolean;
  onPress?: () => void;
  /** The whole row for screen readers: type, title, time, place, state */
  accessibilityLabel: string;
}

/** Width of the time column at 100%: "08:30" with room to spare */
const TIME_COLUMN = 52;

/**
 * One item of the agenda as a list row: the time column (start over end),
 * the tile, the title on up to two lines and the room. A type label or a
 * "Now" chip sits at the end, centred, so neither makes the row taller. At
 * 150% and above the time moves above the title, on one line with "Now",
 * and the type label moves under the room, as the shared row does.
 */
export const AgendaRow = ({
  startTime,
  endTime,
  allDayLabel,
  leadingItem,
  title,
  subtitle,
  typeLabel,
  typeTone = 'neutral',
  isNow = false,
  nowLabel,
  isPast = false,
  onPress,
  accessibilityLabel,
}: AgendaRowProps) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge, scale } = useTextScale();
  const k = Math.min(
    scale * PixelRatio.getFontScale(),
    MAX_COMBINED_TEXT_SCALE,
  );

  const startColor = isNow
    ? colors.nowText
    : isPast
      ? colors.secondaryText
      : colors.title;
  const nowChip = isNow ? (
    <Badge
      text={nowLabel ?? ''}
      backgroundColor={colors.nowBg}
      foregroundColor={colors.nowText}
    />
  ) : undefined;
  const typeChip = typeLabel ? (
    <StatusChip label={typeLabel} tone={typeTone} />
  ) : undefined;
  // In progress and not a lecture: the chip says "Now" and the type joins
  // the room, so the end of the row holds one chip
  const sub =
    isNow && typeLabel
      ? [typeLabel, subtitle].filter(Boolean).join(' · ')
      : subtitle;
  const chip = isNow ? (isLarge ? undefined : nowChip) : typeChip;

  if (isLarge) {
    const time = startTime
      ? [startTime, endTime].filter(Boolean).join(' – ')
      : allDayLabel;
    return (
      <ListItem
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        leadingItem={leadingItem}
        title={
          <View>
            <View style={styles.largeTime}>
              <Text
                variant="secondaryText"
                weight="semibold"
                style={[styles.number, { color: startColor }]}
              >
                {time}
              </Text>
              {nowChip}
            </View>
            <Text
              variant="title"
              numberOfLines={3}
              style={isPast && { color: colors.secondaryText }}
            >
              {title}
            </Text>
          </View>
        }
        subtitle={sub}
        chip={chip}
      />
    );
  }

  return (
    <ListItem
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      leadingItem={leadingItem}
      title={title}
      titleStyle={isPast && { color: colors.secondaryText }}
      subtitle={sub}
      subtitleProps={{ numberOfLines: 1 }}
      chip={chip}
    >
      <View style={[styles.timeColumn, { width: TIME_COLUMN * k }]}>
        {startTime ? (
          <>
            <Text
              variant="secondaryText"
              weight="semibold"
              style={[styles.number, { color: startColor }]}
            >
              {startTime}
            </Text>
            {endTime && (
              <Text variant="secondaryText" style={styles.number}>
                {endTime}
              </Text>
            )}
          </>
        ) : (
          <Text
            variant="secondaryText"
            weight="semibold"
            style={{ color: isPast ? colors.secondaryText : colors.title }}
          >
            {allDayLabel}
          </Text>
        )}
      </View>
    </ListItem>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    timeColumn: {
      // The air between the time and the tile
      marginRight: spacing[3],
      justifyContent: 'center',
    },
    number: {
      fontVariant: ['tabular-nums'],
    },
    largeTime: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
  });
