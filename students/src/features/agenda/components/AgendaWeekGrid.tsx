import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { APP_TIMEZONE } from '@polito/lib/core';
import {
  SkeletonBox,
  SkeletonRegion,
  Text,
  Theme,
  courseTileColor,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { DateTime } from 'luxon';

import { AgendaItem } from '../types/AgendaItem';
import { AgendaEntry, shortTitle, typeLabelOf } from '../utils/agendaItems';
import { DayKey, GridBlock, gridHours, layoutDay } from '../utils/agendaLogic';
import { useItemLabel, useOpenItem } from './AgendaItemRow';

/** Height of one hour, as in the mockup (3.5rem) */
const HOUR = 56;
/** The column with the hours */
const GUTTER = 40;
/** Narrowest block that still holds a short course name */
const MIN_BLOCK_WIDTH = 56;
/** Blocks never get shorter than a touch target */
const MIN_BLOCK_HEIGHT = 48;

/** `color` mixed into `base`: the block's tint, as CSS color-mix does */
const mix = (color: string, base: string, amount: number) => {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    const full =
      h.length === 3
        ? h
            .split('')
            .map(c => c + c)
            .join('')
        : h.slice(0, 6);
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  };
  try {
    const a = parse(color);
    const b = parse(base);
    if ([...a, ...b].some(Number.isNaN)) return base;
    const out = a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount)));
    return `#${out.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return base;
  }
};

interface Props {
  days: DayKey[];
  today: DayKey;
  now: number;
  entriesByDay: Map<DayKey, AgendaEntry[]>;
  /** Draws grey blocks in the grid while the week loads */
  loading?: boolean;
  onOpenDay: (day: DayKey) => void;
}

/**
 * The week as a grid, edge to edge on the page: its own day header, a row
 * for deadlines, then the hours with one block per item. Overlapping items
 * sit side by side when the column holds two readable blocks, otherwise
 * they become one "N events" block that opens the day. Screen readers
 * reach the blocks day by day, in time order.
 */
export const AgendaWeekGrid = ({
  days,
  today,
  now,
  entriesByDay,
  loading = false,
  onOpenDay,
}: Props) => {
  const { t, i18n } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const openItem = useOpenItem();
  const itemLabel = useItemLabel();
  const [width, setWidth] = useState(0);

  // Saturday and Sunday appear when they have items
  const shownDays = days.filter(
    (day, i) => i < 5 || entriesByDay.get(day)?.length,
  );
  const all = shownDays.flatMap(day => entriesByDay.get(day) ?? []);
  const { from, to } = gridHours(all, APP_TIMEZONE);
  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  const columnWidth = width ? (width - GUTTER) / shownDays.length : 0;
  const sideBySide = columnWidth / 2 >= MIN_BLOCK_WIDTH;
  const hasAllDay = all.some(e => e.allDay);

  const blockColor = (item: AgendaItem) => {
    if ((item.type === 'lecture' || item.type === 'exam') && item.color)
      return courseTileColor(item.color);
    if (item.type === 'booking') return colors.successText;
    if (item.type === 'exam') return colors.warningText;
    return colors.secondaryText;
  };

  const format = (day: DayKey, f: string) =>
    DateTime.fromISO(day, { zone: APP_TIMEZONE })
      .setLocale(i18n.language)
      .toFormat(f);

  const renderBlock = (
    day: DayKey,
    block: GridBlock<AgendaEntry>,
    i: number,
  ) => {
    const top = (block.top / 60) * HOUR;
    const height = Math.max((block.length / 60) * HOUR - 2, MIN_BLOCK_HEIGHT);
    const position = {
      top,
      height,
      left: `${(block.column / block.columns) * 100}%`,
      width: `${100 / block.columns}%`,
    } as const;
    if (block.items.length === 1) {
      const entry = block.items[0];
      const { item } = entry;
      const color = blockColor(item);
      const place =
        item.type === 'lecture'
          ? item.place?.name
          : item.type === 'booking'
            ? item.place
            : item.type === 'exam'
              ? item.places[0]?.name
              : undefined;
      return (
        <View key={item.key} style={[styles.blockSlot, position]}>
          <Pressable
            onPress={() => openItem(item)}
            accessibilityRole="button"
            accessibilityLabel={itemLabel(entry, now, true)}
            style={[
              styles.block,
              {
                borderColor: color,
                backgroundColor: mix(color, colors.surface, 0.16),
              },
            ]}
          >
            <Text weight="bold" style={styles.blockTitle} numberOfLines={1}>
              {item.type === 'lecture' || item.type === 'exam'
                ? shortTitle(item.title)
                : typeLabelOf(item, t)}
            </Text>
            <Text style={styles.blockText} numberOfLines={1}>
              {item.start.toFormat('HH:mm')}
            </Text>
            {place && (
              <Text style={styles.blockText} numberOfLines={1}>
                {place.replace(/^Laboratorio /, 'Lab. ')}
              </Text>
            )}
          </Pressable>
        </View>
      );
    }
    const names = block.items
      .map(e =>
        t('agendaScreen.titleAt', {
          title: e.item.title,
          time: e.item.start.toFormat('HH:mm'),
        }),
      )
      .join(', ');
    return (
      <View key={`group-${i}`} style={[styles.blockSlot, position]}>
        <Pressable
          onPress={() => onOpenDay(day)}
          accessibilityRole="button"
          accessibilityLabel={t('agendaScreen.groupLabel', {
            count: block.items.length,
            date: format(day, 'cccc d LLLL'),
            names,
          })}
          style={[
            styles.block,
            {
              borderColor: colors.secondaryText,
              backgroundColor: mix(colors.secondaryText, colors.surface, 0.16),
            },
          ]}
        >
          <Text weight="bold" style={styles.blockTitle} numberOfLines={1}>
            {t('agendaScreen.groupCount', { count: block.items.length })}
          </Text>
          {block.items.map(e => (
            <Text key={e.item.key} style={styles.blockText} numberOfLines={1}>
              {`${e.item.start.toFormat('HH:mm')} ${shortTitle(e.item.title)}`}
            </Text>
          ))}
        </Pressable>
      </View>
    );
  };

  // The grey blocks while loading: a fixed pattern, so the grid has a shape
  const skeletonBlocks = (dayIndex: number) =>
    [
      [0.5, 1.5],
      [2, 1.5],
      [5.5, 1.5],
    ]
      .filter((_, j) => (dayIndex + j) % 3 !== 2)
      .map(([start, length], j) => (
        <View
          key={j}
          style={[
            styles.blockSlot,
            { top: start * HOUR, height: length * HOUR - 2, left: 0, right: 0 },
          ]}
        >
          <SkeletonBox height={length * HOUR - 2} radius={4} />
        </View>
      ));

  const nowTime = DateTime.fromMillis(now, { zone: APP_TIMEZONE });
  const nowTop = ((nowTime.hour - from) * 60 + nowTime.minute) * (HOUR / 60);
  const showNow = !loading && nowTop >= 0 && nowTop <= hours.length * HOUR;

  const grid = (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.head}>
        <View style={{ width: GUTTER }} />
        {shownDays.map(day => {
          const isToday = day === today;
          return (
            <Pressable
              key={day}
              onPress={() => onOpenDay(day)}
              accessibilityRole="button"
              accessibilityLabel={[
                format(day, 'cccc d LLLL'),
                isToday ? t('agendaScreen.todayState') : undefined,
                t('agendaScreen.openDayHint'),
              ]
                .filter(Boolean)
                .join(', ')}
              style={styles.headDay}
            >
              <Text
                variant="secondaryText"
                weight="semibold"
                style={[styles.muted, styles.small]}
              >
                {format(day, 'ccc')}
              </Text>
              <View style={[styles.headNumber, isToday && styles.todayNumber]}>
                <Text
                  variant="title"
                  weight="bold"
                  style={isToday ? styles.onToday : undefined}
                >
                  {format(day, 'd')}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {hasAllDay && !loading && (
        <View style={styles.allDay}>
          <Text
            variant="secondaryText"
            style={[
              styles.muted,
              styles.small,
              styles.allDayLabel,
              { width: GUTTER },
            ]}
          >
            {t('agendaScreen.allDay')}
          </Text>
          {shownDays.map(day => (
            <View key={day} style={styles.allDayColumn}>
              {(entriesByDay.get(day) ?? [])
                .filter(e => e.allDay)
                .map(entry => (
                  <Pressable
                    key={entry.item.key}
                    onPress={() => openItem(entry.item)}
                    accessibilityRole="button"
                    accessibilityLabel={itemLabel(entry, now, true)}
                    style={styles.allDayChip}
                  >
                    <Text
                      weight="bold"
                      style={styles.allDayText}
                      numberOfLines={2}
                    >
                      {entry.item.type === 'exam'
                        ? shortTitle(entry.item.title)
                        : typeLabelOf(entry.item, t)}
                    </Text>
                  </Pressable>
                ))}
            </View>
          ))}
        </View>
      )}
      <View style={styles.body}>
        <View
          style={{ width: GUTTER }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {hours.map(hour => (
            <View key={hour} style={styles.hour}>
              <Text
                variant="secondaryText"
                style={[styles.muted, styles.small, styles.number]}
              >
                {String(hour).padStart(2, '0')}
              </Text>
            </View>
          ))}
        </View>
        {shownDays.map((day, dayIndex) => {
          const blocks = layoutDay(
            (entriesByDay.get(day) ?? []).filter(e => !e.allDay),
            DateTime.fromISO(day, { zone: APP_TIMEZONE }).set({ hour: from }),
            sideBySide,
          );
          return (
            <View
              key={day}
              style={[
                styles.column,
                { height: hours.length * HOUR },
                day === today && styles.todayColumn,
              ]}
            >
              {hours.map((hour, i) => (
                <View
                  key={hour}
                  style={[styles.line, { top: i * HOUR }]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              ))}
              {loading
                ? skeletonBlocks(dayIndex)
                : blocks.map((block, i) => renderBlock(day, block, i))}
              {showNow && day === today && (
                <View
                  style={[styles.nowLine, { top: nowTop - 1 }]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <View style={styles.nowDot} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.grid}>
      {loading ? (
        <SkeletonRegion label={t('states.agenda.loading')}>
          {grid}
        </SkeletonRegion>
      ) : (
        grid
      )}
      {!loading && (
        <Text variant="secondaryText" style={styles.note}>
          {shownDays.length < 7
            ? t('agendaScreen.weekNoteWeekend')
            : t('agendaScreen.weekNote')}
        </Text>
      )}
    </View>
  );
};

const createStyles = ({ colors, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    grid: {
      marginTop: spacing[3],
    },
    head: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    headDay: {
      flex: 1,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headNumber: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    todayNumber: {
      backgroundColor: colors.title,
    },
    onToday: {
      color: colors.surface,
    },
    muted: {
      color: colors.secondaryText,
    },
    small: {
      fontSize: 12,
      lineHeight: 16,
    },
    number: {
      fontVariant: ['tabular-nums'],
    },
    allDay: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    allDayLabel: {
      padding: spacing[1],
    },
    allDayColumn: {
      flex: 1,
    },
    allDayChip: {
      minHeight: 48,
      margin: 2,
      padding: spacing[1],
      borderRadius: shapes.sm,
      backgroundColor: colors.neutralChipBg,
      justifyContent: 'center',
    },
    allDayText: {
      fontSize: 11,
      lineHeight: 14,
      color: colors.neutralChipText,
    },
    body: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    hour: {
      height: 56,
      paddingTop: 2,
      paddingHorizontal: spacing[1],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    column: {
      flex: 1,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    todayColumn: {
      backgroundColor: colors.weekToday,
    },
    line: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
    },
    blockSlot: {
      position: 'absolute',
      paddingHorizontal: 2,
    },
    block: {
      flex: 1,
      borderWidth: 1,
      borderRadius: shapes.sm,
      padding: spacing[1],
      gap: 2,
      overflow: 'hidden',
    },
    blockTitle: {
      fontSize: 11,
      lineHeight: 14,
      color: colors.title,
    },
    blockText: {
      fontSize: 11,
      lineHeight: 14,
      color: colors.prose,
      fontVariant: ['tabular-nums'],
    },
    nowLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: colors.nowMark,
    },
    nowDot: {
      position: 'absolute',
      left: -4,
      top: -3,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.nowMark,
    },
    note: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[3],
    },
  });
