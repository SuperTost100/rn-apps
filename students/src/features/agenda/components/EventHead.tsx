import { StyleSheet, View } from 'react-native';

import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';
import { Icon, Text, Theme, useStylesheet, useTheme } from '@polito/lib/ui';

interface Props {
  /** The kind of event: Lecture, Booking, Deadline */
  caption: string;
  /** "Wed, 11 Nov 2026" */
  date: string;
  /** "10:00 - 11:30", if the event has a time */
  time?: string;
  /** A second line under the caption, such as the recording's title */
  subtitle?: string;
}

/**
 * The top of an agenda detail screen, on the surface under the header:
 * the kind of event, then its date and time with their icons
 */
export const EventHead = ({ caption, date, time, subtitle }: Props) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  return (
    <View
      style={styles.head}
      accessible
      accessibilityLabel={[caption, subtitle, date, time]
        .filter(Boolean)
        .join(', ')}
    >
      <Text variant="caption" weight="semibold" style={styles.caption}>
        {caption.toUpperCase()}
      </Text>
      {subtitle && <Text variant="secondaryText">{subtitle}</Text>}
      <View style={styles.when}>
        <View style={styles.part}>
          <Icon icon={faCalendar} size={20} color={colors.secondaryText} />
          <Text variant="title" weight="semibold" style={styles.slack}>
            {date}
          </Text>
        </View>
        {time && (
          <View style={styles.part}>
            <Icon icon={faClock} size={20} color={colors.secondaryText} />
            <Text
              variant="title"
              weight="semibold"
              style={[styles.number, styles.slack]}
            >
              {time}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    head: {
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      paddingBottom: spacing[5],
      gap: spacing[2],
    },
    caption: {
      color: colors.secondaryText,
      letterSpacing: 0.6,
    },
    when: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: spacing[6],
      rowGap: spacing[2],
    },
    part: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    number: {
      fontVariant: ['tabular-nums'],
    },
    // shortcut: Android measured "Thu 12 Nov" a fraction narrower than it
    // draws, and the last word went to a hidden second line. A pixel of
    // slack avoids it; drop it if a React Native update fixes the rounding
    slack: {
      paddingRight: 1,
    },
  });
