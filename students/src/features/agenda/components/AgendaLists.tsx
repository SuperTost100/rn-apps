import { useTranslation } from 'react-i18next';
import { PixelRatio, StyleSheet, View } from 'react-native';

import { APP_TIMEZONE } from '@polito/lib/core';
import {
  Card,
  IndentedDivider,
  List,
  SkeletonBox,
  SkeletonLine,
  SkeletonRegion,
  StateBlock,
  Text,
  Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';

import { DateTime } from 'luxon';

import { AgendaEntry } from '../utils/agendaItems';
import { DayKey } from '../utils/agendaLogic';
import { AgendaItemRow } from './AgendaItemRow';

/** One day's items in one card, as compact rows */
export const AgendaDayCard = ({
  entries,
  now,
}: {
  entries: AgendaEntry[];
  now: number;
}) => {
  const styles = useStylesheet(createStyles);
  return (
    <Card style={styles.card}>
      <List indented={false}>
        {entries.map(entry => (
          <AgendaItemRow key={entry.item.key} entry={entry} now={now} />
        ))}
      </List>
    </Card>
  );
};

interface EmptyDayProps {
  day: DayKey;
  /** Items of the day the filters hide */
  hidden: number;
  /** The next day with items, and its first item */
  next?: AgendaEntry;
  onShowAll: () => void;
  onGoTo: (day: DayKey) => void;
}

/** A day without items: what is hidden, or the next day that has some */
export const AgendaEmptyDay = ({
  day,
  hidden,
  next,
  onShowAll,
  onGoTo,
}: EmptyDayProps) => {
  const { t, i18n } = useTranslation();
  const styles = useStylesheet(createStyles);
  const format = (d: DateTime, f: string) =>
    d.setZone(APP_TIMEZONE).setLocale(i18n.language).toFormat(f);
  const date = format(
    DateTime.fromISO(day, { zone: APP_TIMEZONE }),
    'cccc d LLLL',
  );
  if (hidden > 0) {
    return (
      <StateBlock
        card
        style={styles.card}
        title={t('agendaScreen.filteredTitle')}
        text={t('agendaScreen.filteredText', { date, count: hidden })}
        action={{ label: t('agendaScreen.showAll'), onPress: onShowAll }}
      />
    );
  }
  const nextDay = next ? format(next.item.start, 'ccc d LLL') : undefined;
  return (
    <StateBlock
      card
      style={styles.card}
      title={t('agendaScreen.emptyDayTitle', { date })}
      text={
        next
          ? next.allDay
            ? t('agendaScreen.nextAllDay', {
                day: nextDay,
                title: next.item.title,
              })
            : t('agendaScreen.nextAt', {
                day: nextDay,
                time: next.item.start.toFormat('HH:mm'),
                title: next.item.title,
              })
          : t('agendaScreen.nothingSoon')
      }
      action={
        next
          ? {
              label: t('agendaScreen.goTo', { day: nextDay }),
              onPress: () => onGoTo(next.item.date),
            }
          : undefined
      }
    />
  );
};

/**
 * The week as a list grouped by day, for large text, where a seven-column
 * grid cannot hold readable words
 */
export const AgendaWeekList = ({
  days,
  today,
  entriesByDay,
  now,
}: {
  days: DayKey[];
  today: DayKey;
  entriesByDay: Map<DayKey, AgendaEntry[]>;
  now: number;
}) => {
  const { t, i18n } = useTranslation();
  const styles = useStylesheet(createStyles);
  const withItems = days.filter(day => entriesByDay.get(day)?.length);
  return (
    <View>
      <Text variant="secondaryText" style={styles.note}>
        {t('agendaScreen.weekAsList')}
      </Text>
      {withItems.map(day => {
        const date = DateTime.fromISO(day, { zone: APP_TIMEZONE })
          .setLocale(i18n.language)
          .toFormat('ccc d LLL');
        return (
          <View key={day}>
            <Text
              variant="title"
              weight="semibold"
              accessibilityRole="header"
              style={styles.groupLabel}
            >
              {day === today ? t('agendaScreen.todayDate', { date }) : date}
            </Text>
            <AgendaDayCard entries={entriesByDay.get(day)!} now={now} />
          </View>
        );
      })}
    </View>
  );
};

/** Placeholder rows shaped like the day's card: time, tile, two lines */
export const AgendaDaySkeleton = ({ label }: { label: string }) => {
  const styles = useStylesheet(createStyles);
  const { controls, layout, shapes } = useTheme();
  const { isLarge, scale } = useTextScale();
  const k = Math.min(scale * PixelRatio.getFontScale(), 2);
  const widths = ['72%', '56%', '84%'] as const;
  return (
    <SkeletonRegion label={label}>
      <Card style={styles.card}>
        {widths.map((width, i) => (
          <View key={i}>
            {i > 0 && <IndentedDivider indent={layout.cardPadding} />}
            <View style={styles.skeletonRow}>
              {!isLarge && (
                <View style={[styles.skeletonTime, { width: 52 * k }]}>
                  <SkeletonLine variant="secondaryText" width="80%" />
                  <SkeletonLine variant="secondaryText" width="64%" />
                </View>
              )}
              <View style={styles.skeletonLead}>
                <SkeletonBox
                  width={controls.courseTileSize}
                  height={controls.courseTileSize}
                  radius={shapes.md}
                />
              </View>
              <View style={styles.skeletonText}>
                {isLarge && (
                  <SkeletonLine variant="secondaryText" width="40%" />
                )}
                <SkeletonLine width={width} />
                <SkeletonLine variant="secondaryText" width="30%" />
              </View>
            </View>
          </View>
        ))}
      </Card>
    </SkeletonRegion>
  );
};

const createStyles = ({ controls, layout, spacing }: Theme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.gutter,
      marginTop: spacing[3],
    },
    note: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[3],
    },
    groupLabel: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[5],
    },
    skeletonRow: {
      minHeight: controls.rowMinHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.cardPadding,
      paddingVertical: layout.rowPaddingVertical,
    },
    skeletonTime: {
      marginRight: spacing[3],
    },
    skeletonLead: {
      width: controls.leadingSize,
      alignItems: 'center',
      marginRight: layout.leadingGap,
    },
    skeletonText: {
      flex: 1,
    },
  });
