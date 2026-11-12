import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PanResponder,
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { APP_TIMEZONE } from '@polito/lib/core';
import {
  IconButton,
  Text,
  Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';

import { DateTime } from 'luxon';

import { DayKey } from '../utils/agendaLogic';
import { AgendaView } from './AgendaHeaderControls';

interface DateRowProps {
  view: AgendaView;
  date: DayKey;
  monday: DateTime;
  isOnToday: boolean;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
}

/**
 * The navy row under the header: previous, the date or the week, next and
 * Today. Today is always there and only inactive when today is shown, so
 * nothing in the row moves.
 */
export const AgendaDateRow = ({
  view,
  date,
  monday,
  isOnToday,
  onStep,
  onToday,
}: DateRowProps) => {
  const { t, i18n } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors, fontSizes } = useTheme();
  const { isLarge } = useTextScale();
  const day = DateTime.fromISO(date, { zone: APP_TIMEZONE }).setLocale(
    i18n.language,
  );
  const sunday = monday.plus({ days: 6 }).setLocale(i18n.language);
  const label =
    view === 'day'
      ? day.toFormat(isLarge ? 'ccc d LLL' : 'ccc, d LLL yyyy')
      : monday.hasSame(sunday, 'month')
        ? `${monday.toFormat('d')} – ${sunday.toFormat(isLarge ? 'd LLL' : 'd LLL yyyy')}`
        : `${monday.setLocale(i18n.language).toFormat('d LLL')} – ${sunday.toFormat(isLarge ? 'd LLL' : 'd LLL yyyy')}`;
  const spoken =
    view === 'day'
      ? day.toFormat('cccc d LLLL yyyy')
      : t('agendaScreen.weekSpoken', {
          from: monday.setLocale(i18n.language).toFormat('d LLLL'),
          to: sunday.toFormat('d LLLL yyyy'),
        });
  const unit = view === 'day' ? 'Day' : 'Week';
  return (
    <View style={styles.dateRow}>
      <IconButton
        icon={faChevronLeft}
        color={colors.onHeader}
        size={fontSizes.lg}
        accessibilityLabel={t(`agendaScreen.previous${unit}`)}
        onPress={() => onStep(-1)}
        style={styles.firstButton}
      />
      <Text
        variant="title"
        weight="semibold"
        style={styles.date}
        numberOfLines={2}
        accessibilityLabel={spoken}
        accessibilityLiveRegion="polite"
      >
        {label}
      </Text>
      <IconButton
        icon={faChevronRight}
        color={colors.onHeader}
        size={fontSizes.lg}
        accessibilityLabel={t(`agendaScreen.next${unit}`)}
        onPress={() => onStep(1)}
      />
      <Pressable
        onPress={onToday}
        disabled={isOnToday}
        accessibilityRole="button"
        accessibilityState={{ disabled: isOnToday }}
        accessibilityLabel={
          isOnToday
            ? t('agendaScreen.showingToday')
            : t('agendaScreen.goToToday')
        }
        style={styles.today}
      >
        <Text
          variant="label"
          style={{
            color: isOnToday ? colors.onHeaderMuted : colors.onHeader,
            opacity: isOnToday ? 0.6 : 1,
          }}
        >
          {t('agendaScreen.today')}
        </Text>
      </Pressable>
    </View>
  );
};

interface StripProps {
  days: DayKey[];
  selected: DayKey;
  today: DayKey;
  /** Events of each day, with the filters applied */
  counts: Record<DayKey, number>;
  /** Hides the dots while the week loads */
  loading?: boolean;
  onSelect: (day: DayKey) => void;
  /** A swipe to the previous (-1) or next (1) week */
  onSwipe: (direction: -1 | 1) => void;
}

/**
 * Monday to Sunday under the date: today ringed, the selected day filled,
 * a dot under days with events. At 150% and above the weekday is the
 * locale's narrow form, and the strip scrolls when the days do not fit.
 */
export const DayStrip = ({
  days,
  selected,
  today,
  counts,
  loading = false,
  onSelect,
  onSwipe,
}: StripProps) => {
  const { t, i18n } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors, layout } = useTheme();
  const { isLarge, scale } = useTextScale();
  const { width } = useWindowDimensions();
  const k = Math.min(scale * PixelRatio.getFontScale(), 2);
  const circle = Math.round(Math.max(40, 24 * k + 12));
  const available = width - 2 * (layout.gutter - 8);
  const cell = Math.max(available / 7, circle + 8);
  const scrolls = cell * 7 > available + 1;

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: Math.max(0, days.indexOf(selected) * cell - cell * 2),
      animated: true,
    });
  }, [days, selected, cell]);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 24 && Math.abs(g.dx) > 2 * Math.abs(g.dy),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > 48) onSwipeRef.current(g.dx < 0 ? 1 : -1);
        },
      }),
    [],
  );

  const cells = days.map(day => {
    const date = DateTime.fromISO(day, { zone: APP_TIMEZONE }).setLocale(
      i18n.language,
    );
    const isSelected = day === selected;
    const isToday = day === today;
    const count = counts[day] ?? 0;
    const label = [
      date.toFormat('cccc d LLLL'),
      loading ? undefined : t('agendaScreen.eventCount', { count }),
      isToday ? t('agendaScreen.todayState') : undefined,
    ]
      .filter(Boolean)
      .join(', ');
    return (
      <Pressable
        key={day}
        onPress={() => onSelect(day)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={label}
        style={[styles.day, { width: cell }]}
      >
        <Text
          variant="secondaryText"
          numberOfLines={1}
          style={[styles.weekday, { color: colors.onHeaderMuted }]}
        >
          {date.toFormat(isLarge ? 'ccccc' : 'ccc')}
        </Text>
        <View
          // Remounted when its state changes: updating the fill and the
          // number's colour in place sometimes left the old colour on
          // Android, a white number on the white fill
          key={`${isSelected}-${isToday}`}
          style={[
            styles.number,
            { width: circle, height: circle },
            isToday && !isSelected && styles.todayNumber,
            isSelected && styles.selectedNumber,
          ]}
        >
          <Text
            variant="title"
            weight="semibold"
            numberOfLines={1}
            style={{ color: isSelected ? colors.header : colors.onHeader }}
          >
            {date.toFormat('d')}
          </Text>
        </View>
        <View
          style={[
            styles.dot,
            isToday && styles.todayDot,
            (loading || !count) && styles.noDot,
          ]}
        />
      </Pressable>
    );
  });

  return (
    <View
      {...pan.panHandlers}
      accessibilityRole="none"
      accessibilityLabel={t('agendaScreen.weekOf', {
        date: DateTime.fromISO(days[0], { zone: APP_TIMEZONE })
          .setLocale(i18n.language)
          .toFormat('d LLLL'),
      })}
    >
      {scrolls ? (
        <ScrollView
          ref={scrollRef}
          onLayout={() =>
            scrollRef.current?.scrollTo({
              x: Math.max(0, days.indexOf(selected) * cell - cell * 2),
              animated: false,
            })
          }
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {cells}
        </ScrollView>
      ) : (
        <View style={styles.strip}>{cells}</View>
      )}
    </View>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingHorizontal: layout.gutter,
    },
    firstButton: {
      marginLeft: -spacing[3],
    },
    date: {
      flex: 1,
      minWidth: 0,
      textAlign: 'center',
      color: colors.onHeader,
    },
    today: {
      minHeight: 48,
      minWidth: 48,
      paddingHorizontal: spacing[3],
      marginRight: -spacing[3],
      alignItems: 'center',
      justifyContent: 'center',
    },
    strip: {
      flexDirection: 'row',
      paddingHorizontal: layout.gutter - 8,
      paddingTop: spacing[1],
      paddingBottom: spacing[3],
    },
    day: {
      alignItems: 'center',
      gap: spacing[1],
      paddingVertical: spacing[1],
      minHeight: 72,
    },
    number: {
      alignItems: 'center',
      justifyContent: 'center',
      // A fixed radius: one computed per render was dropped on Android
      // when the selected fill changed, which drew a square
      borderRadius: 999,
      overflow: 'hidden',
    },
    weekday: {
      fontSize: 12,
      lineHeight: 16,
    },
    todayNumber: {
      borderWidth: 2,
      borderColor: colors.onHeaderMuted,
    },
    selectedNumber: {
      backgroundColor: colors.onHeader,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.onHeaderMuted,
    },
    todayDot: {
      backgroundColor: colors.heroAccent,
    },
    noDot: {
      opacity: 0,
    },
  });
