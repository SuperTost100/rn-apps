import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelRatio, Pressable, StyleSheet, View } from 'react-native';

import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import {
  APP_TIMEZONE,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import {
  Icon,
  SkeletonLine,
  SkeletonRegion,
  Text,
  TextButton,
  Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppPreferences, CoursesPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import { useGetCourses } from '../../../core/queries/courseHooks';
import { useMinuteClock } from '../../agenda/hooks/useMinuteClock';
import { processLectures } from '../../agenda/hooks/useProcessedLectures';
import { useGetAgendaWeek } from '../../agenda/queries/agendaHooks';
import {
  AgendaItem,
  BookingItem,
  ExamItem,
  LectureItem,
} from '../../agenda/types/AgendaItem';
import { AgendaWeek } from '../../agenda/types/AgendaWeek';
import {
  NamedItem,
  TodayRow,
  buildToday,
  countText,
  countdown,
  dayKey,
  endedText,
  firstOfNextDay,
  foldText,
  hhmm,
  itemsOfDay,
  rowLabel,
} from '../utils/todayList';

/** A lecture, booked exam or room booking with a time, as a row of the list */
interface TodayEntry extends NamedItem {
  source: LectureItem | ExamItem | BookingItem;
}

/**
 * Today's items for the list: lectures the student did not hide from the
 * agenda, booked exams with a time and room bookings. Deadlines have no
 * time and are listed under Exams and deadlines instead.
 */
const toEntries = (
  week: AgendaWeek | undefined,
  courses: CoursesPreferences,
  moduleNames: Map<number, string>,
): TodayEntry[] => {
  const items = week?.data.flatMap(d => d.items) ?? [];
  // processLectures reads each lecture's course preferences: lectures of a
  // course without saved preferences pass unchanged
  const known = items.filter(
    i =>
      i.type !== 'lecture' || !i.uniqueShortcode || courses[i.uniqueShortcode],
  );
  const unknown = items.filter(i => !known.includes(i));
  return [...processLectures(known, courses), ...unknown].flatMap(
    (item: AgendaItem): TodayEntry[] => {
      if (item.type === 'deadline') return [];
      if (item.type === 'exam' && item.isTimeToBeDefined) return [];
      const start = item.start.toMillis();
      // shortcut: an exam without an end time counts as two hours long; the
      // API gives every booked exam an end, revisit if one comes without
      const end = item.end.isValid ? item.end.toMillis() : start + 7200000;
      const room =
        item.type === 'lecture'
          ? item.place?.name
          : item.type === 'exam'
            ? item.places.map(p => p.name).join(', ') || undefined
            : undefined;
      return [
        {
          key: item.key,
          start,
          end,
          // A module's lecture is named after the module, as in Courses
          title:
            (item.type === 'lecture' && moduleNames.get(item.courseId)) ||
            item.title,
          room,
          source: item,
        },
      ];
    },
  );
};

/** The entries of a week, with the student's preferences and module names */
const useEntries = (week: AgendaWeek | undefined) => {
  const { courses } = usePreferencesContext<AppPreferences>();
  const { data: courseList } = useGetCourses();
  return useMemo(() => {
    const moduleNames = new Map<number, string>();
    courseList?.forEach(course =>
      course.modules?.forEach(module => {
        if (module.id) moduleNames.set(module.id, module.name);
      }),
    );
    return toEntries(week, courses, moduleNames);
  }, [week, courses, courseList]);
};

/** Line heights of the list at the current text size, for the thread */
const useLines = () => {
  const { scale } = useTextScale();
  const k = Math.min(scale * PixelRatio.getFontScale(), 2);
  return { title: 24 * k, cardTitle: 28 * k, secondary: 20 * k };
};

/**
 * Opens the agenda tab on a day, in the layout the student chose. The
 * agenda goes back to its first screen and shows the day, keeping the rest
 * of its state
 */
const useOpenAgenda = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  return (date: string) =>
    navigation.navigate('AgendaTab', {
      screen: 'Agenda',
      params: { date, requestedAt: Date.now() },
      pop: true,
    });
};

const formatDay = (ms: number, language: string) =>
  DateTime.fromMillis(ms, { zone: APP_TIMEZONE })
    .setLocale(language)
    .toFormat('ccc d LLL');

interface Props {
  /** The whole screen already says it could not load: stay quiet */
  quiet?: boolean;
}

/**
 * The Today list on the navy top of the Teaching screen: today's lectures,
 * booked exams and bookings as one list in time order. What ended folds
 * into one line, the item in progress says "Now", the next one is larger
 * with the time left before it. At large text the rest folds into a line.
 */
export const TodayList = ({ quiet = false }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { percent, isLarge } = useTextScale();
  const { language } = usePreferencesContext<AppPreferences>();
  const openAgenda = useOpenAgenda();
  const now = useMinuteClock();
  const today = dayKey(now, APP_TIMEZONE);
  const monday = useMemo(
    () => DateTime.fromISO(today, { zone: APP_TIMEZONE }).startOf('week'),
    [today],
  );
  const { week, sourceQueries } = useGetAgendaWeek(monday);
  const states = useQueryStates(sourceQueries, {
    isEmpty: () => false,
  });
  const entries = useEntries(week);
  const model = useMemo(
    () => buildToday(itemsOfDay(entries, now, APP_TIMEZONE), now, percent),
    [entries, now, percent],
  );

  const head = (
    <View style={[styles.head, isLarge && styles.headLarge]}>
      <Text
        variant="label"
        style={[
          styles.muted,
          styles.headTitle,
          isLarge && styles.headTitleLarge,
        ]}
        accessibilityRole="header"
      >
        {t('todayList.title', { date: formatDay(now, language) })}
      </Text>
      <TextButton
        onPress={() => openAgenda(today)}
        underlayColor={colors.headerSunken}
        style={isLarge && styles.leftButton}
      >
        <Text variant="label" style={styles.onHeader}>
          {t('todayList.openAgenda')}
        </Text>
      </TextButton>
    </View>
  );

  let body;
  if (states.status === 'loading') {
    body = <TodaySkeleton />;
  } else if (states.status === 'error') {
    body =
      quiet || states.isOffline ? (
        <View style={styles.quietSpace} />
      ) : (
        <View style={styles.message}>
          <Text variant="secondaryText" style={styles.muted}>
            {t('todayList.failed')}
          </Text>
          <TextButton
            onPress={states.retry}
            underlayColor={colors.headerSunken}
            style={styles.leftButton}
          >
            <Text variant="label" style={styles.onHeader}>
              {t('states.tryAgain')}
            </Text>
          </TextButton>
        </View>
      );
  } else if (model.kind === 'list') {
    body = (
      <View
        accessibilityRole="list"
        accessibilityLabel={t('todayList.listLabel')}
        style={styles.list}
      >
        {model.showEnded && (
          <FoldRow
            {...endedText(model.ended, t)}
            first
            last={false}
            onPress={() => openAgenda(today)}
          />
        )}
        {model.rows.map((row, i) => (
          <TodayRowView
            key={row.item.key}
            row={row as TodayRow<TodayEntry>}
            now={now}
            first={i === 0 && !model.showEnded}
            last={i === model.rows.length - 1 && !model.fold}
          />
        ))}
        {model.fold && (
          <FoldRow
            {...foldText(model.fold, t, APP_TIMEZONE)}
            first={false}
            last
            onPress={() => openAgenda(today)}
          />
        )}
      </View>
    );
  } else {
    const next = firstOfNextDay(entries, now, APP_TIMEZONE);
    body = (
      <View style={styles.message}>
        <Text variant="cardTitle" style={styles.onHeader}>
          {model.kind === 'none'
            ? t('todayList.noLectures')
            : t('todayList.noMore')}
        </Text>
        {next ? (
          <NextDay entry={next} />
        ) : (
          <NextWeekFirst monday={monday.plus({ week: 1 })} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {head}
      {body}
    </View>
  );
};

/** "Next: Fri 13 Nov, 08:30, ..." with a button that shows that day */
const NextDay = ({ entry }: { entry: TodayEntry | null }) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { language } = usePreferencesContext<AppPreferences>();
  const openAgenda = useOpenAgenda();
  if (!entry) {
    return (
      <Text variant="secondaryText" style={styles.muted}>
        {t('todayList.nothingSoon')}
      </Text>
    );
  }
  const day = formatDay(entry.start, language);
  return (
    <>
      <Text variant="secondaryText" style={styles.muted}>
        {t(entry.room ? 'todayList.nextDayRoom' : 'todayList.nextDay', {
          day,
          time: hhmm(entry.start, APP_TIMEZONE),
          title: entry.title,
          room: entry.room,
        })}
      </Text>
      <TextButton
        onPress={() => openAgenda(dayKey(entry.start, APP_TIMEZONE))}
        underlayColor={colors.headerSunken}
        style={styles.leftButton}
      >
        <View style={styles.buttonContent}>
          <Icon icon={faCalendar} color={colors.onHeader} size={20} />
          <Text variant="label" style={styles.onHeader}>
            {t('todayList.showDay', { day })}
          </Text>
        </View>
      </TextButton>
    </>
  );
};

/** Looks for the next teaching day in next week, when this one has none */
const NextWeekFirst = ({ monday }: { monday: DateTime }) => {
  const { week } = useGetAgendaWeek(monday);
  const entries = useEntries(week);
  if (!week) return null;
  return (
    <NextDay
      entry={firstOfNextDay(
        entries,
        monday.minus({ day: 1 }).toMillis(),
        APP_TIMEZONE,
      )}
    />
  );
};

/** The column with the dot and the thread that joins the rows */
const Rail = ({
  dotCenter,
  first,
  last,
  paddingTop,
  paddingBottom,
  kind,
}: {
  dotCenter: number;
  first: boolean;
  last: boolean;
  paddingTop: number;
  paddingBottom: number;
  kind: 'now' | 'next' | 'later' | 'fold';
}) => {
  const styles = useStylesheet(createStyles);
  return (
    <View style={styles.rail}>
      {!(first && last) && (
        <View
          style={[
            styles.thread,
            last
              ? { top: -paddingTop, height: paddingTop + dotCenter }
              : {
                  top: first ? dotCenter : -paddingTop,
                  // One pixel into the next row: rows end on fractional
                  // pixels at 150%, which left a seam in the thread
                  bottom: -paddingBottom - 1,
                },
          ]}
        />
      )}
      {kind === 'now' ? (
        <View style={[styles.nowRing, { top: dotCenter - 11 }]}>
          <View style={styles.nowDot} />
        </View>
      ) : (
        <View
          style={[styles.dot, styles[`${kind}Dot`], { top: dotCenter - 6 }]}
        />
      )}
    </View>
  );
};

/** One item: time, dot, name, state word, room and, on the main row, the count */
const TodayRowView = ({
  row,
  now,
  first,
  last,
}: {
  row: TodayRow<TodayEntry>;
  now: number;
  first: boolean;
  last: boolean;
}) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge } = useTextScale();
  const lines = useLines();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { item, state, isMain } = row;
  const source = item.source;
  const paddingTop = isMain ? 12 : 8;
  const paddingBottom = isMain ? 16 : 12;
  const dotCenter = isLarge
    ? lines.secondary / 2
    : (isMain ? lines.cardTitle : lines.title) / 2;
  const start = hhmm(item.start, APP_TIMEZONE);
  const end = hhmm(item.end, APP_TIMEZONE);
  const kindWord =
    source.type === 'exam'
      ? t('todayList.exam')
      : source.type === 'booking'
        ? t('todayList.booking')
        : undefined;
  const stateWord =
    state === 'now'
      ? t('todayList.now')
      : state === 'next'
        ? t('todayList.next')
        : undefined;
  // A short room code stays with its word: "Aula 5S", never "Aula" / "5S"
  const room = item.room?.replace(/ (?=\S{1,4}$)/, '\u00A0');
  const meta = [kindWord, room].filter(Boolean).join(' · ');
  const count = isMain ? countText(countdown(row, now), t) : null;

  const open = () => {
    if (source.type === 'lecture')
      navigation.navigate('Lecture', { item: source });
    else if (source.type === 'exam')
      navigation.navigate('Exam', { id: source.id });
    else navigation.navigate('Booking', { id: source.id });
  };

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      // One label for the row. The count is left out, so it is not read
      // again each minute
      accessibilityLabel={rowLabel(row, t, APP_TIMEZONE)}
      style={({ pressed }) => [
        styles.row,
        { paddingTop, paddingBottom },
        pressed && styles.pressed,
      ]}
    >
      {!isLarge && (
        <View style={styles.timeColumn}>
          <Text
            variant="secondaryText"
            weight="semibold"
            style={[
              styles.onHeader,
              styles.tabular,
              { lineHeight: isMain ? 28 : 24 },
            ]}
          >
            {start}
          </Text>
          <Text variant="secondaryText" style={[styles.muted, styles.tabular]}>
            {end}
          </Text>
        </View>
      )}
      <Rail
        dotCenter={dotCenter}
        first={first}
        last={last}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        kind={state === 'ended' ? 'fold' : state}
      />
      <View style={styles.body}>
        {isLarge && (
          <Text variant="secondaryText" style={styles.muted}>
            <Text
              variant="secondaryText"
              weight="semibold"
              style={styles.onHeader}
            >
              {start}
            </Text>
            {` - ${end}`}
          </Text>
        )}
        <Text
          variant={isMain ? 'cardTitle' : 'title'}
          weight={isMain ? 'bold' : 'semibold'}
          style={styles.onHeader}
          numberOfLines={isLarge ? 3 : 2}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        {/* One Text for the state word and the room: separate texts in a
            wrapping row lose their last word on Android */}
        <View style={[styles.meta, isLarge && styles.metaLarge]}>
          {stateWord || meta ? (
            <Text
              variant="secondaryText"
              style={[styles.muted, styles.metaText]}
            >
              {stateWord ? (
                <Text
                  variant="secondaryText"
                  weight="bold"
                  style={{
                    color:
                      state === 'now' ? colors.heroAccent : colors.onHeader,
                  }}
                >
                  {stateWord}
                </Text>
              ) : null}
              {stateWord && meta ? '  ·  ' : ''}
              {meta}
            </Text>
          ) : null}
          {count && (
            <View style={[styles.count, isLarge && styles.countLarge]}>
              {count
                .split(/(\d+)/)
                .filter(Boolean)
                .map((part, i) =>
                  /^\d+$/.test(part) ? (
                    <Text
                      key={i}
                      variant="display"
                      maxFontSize={44}
                      style={[styles.countNumber, styles.tabular]}
                    >
                      {part}
                    </Text>
                  ) : (
                    <Text key={i} variant="label" style={styles.countText}>
                      {part}
                    </Text>
                  ),
                )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

/** "Ended: ...", "Later: ..." and "Also today: ...": open the agenda */
const FoldRow = ({
  text,
  label,
  first,
  last,
  onPress,
}: {
  text: string;
  label: string;
  first: boolean;
  last: boolean;
  onPress: () => void;
}) => {
  const styles = useStylesheet(createStyles);
  const { isLarge } = useTextScale();
  const lines = useLines();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        { paddingTop: 8, paddingBottom: 12 },
        pressed && styles.pressed,
      ]}
    >
      {!isLarge && <View style={styles.timeColumn} />}
      <Rail
        dotCenter={lines.title / 2}
        first={first}
        last={last}
        paddingTop={8}
        paddingBottom={12}
        kind="fold"
      />
      <View style={styles.body}>
        <Text
          variant="title"
          style={styles.muted}
          numberOfLines={isLarge ? 2 : undefined}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
};

/** Three rows of blocks on the navy, while today's items load */
const TodaySkeleton = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { isLarge } = useTextScale();
  const lines = useLines();
  const widths = ['62%', '78%', '54%'] as const;
  return (
    <SkeletonRegion label={t('todayList.loading')} style={styles.list}>
      {widths.map((width, i) => (
        <View
          key={i}
          style={[styles.row, { paddingTop: 8, paddingBottom: 12 }]}
        >
          {!isLarge && (
            <View style={styles.timeColumn}>
              <SkeletonLine variant="secondaryText" width={40} onHeader />
            </View>
          )}
          <Rail
            dotCenter={lines.title / 2}
            first={i === 0}
            last={i === widths.length - 1}
            paddingTop={8}
            paddingBottom={12}
            kind={i === 0 ? 'now' : i === 1 ? 'next' : 'later'}
          />
          <View style={styles.body}>
            <SkeletonLine width={width} onHeader />
            <SkeletonLine variant="secondaryText" width="30%" onHeader />
          </View>
        </View>
      ))}
    </SkeletonRegion>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.header,
      paddingBottom: spacing[6],
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: spacing[3],
      minHeight: 48,
      paddingHorizontal: layout.gutter,
    },
    // At large text "Open agenda" goes under the date
    headLarge: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingTop: spacing[2],
    },
    // Wider than the text needs: given only its measured width, Android
    // wraps the last word to a line nobody sees
    headTitle: {
      flexGrow: 1,
      flexShrink: 1,
    },
    headTitleLarge: {
      alignSelf: 'stretch',
    },
    list: {
      paddingTop: spacing[1],
    },
    quietSpace: {
      height: spacing[4],
    },
    message: {
      paddingTop: spacing[1],
      paddingHorizontal: layout.gutter,
      gap: spacing[1],
      alignItems: 'flex-start',
    },
    leftButton: {
      marginLeft: -spacing[3],
      marginRight: 0,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: spacing[3],
      paddingHorizontal: layout.gutter,
    },
    pressed: {
      backgroundColor: colors.headerSunken,
    },
    timeColumn: {
      // 3.25 rem in the mockup: wide enough for "08:30" at every text size
      minWidth: 52,
    },
    tabular: {
      fontVariant: ['tabular-nums'],
    },
    rail: {
      width: 16,
      alignSelf: 'stretch',
    },
    thread: {
      position: 'absolute',
      left: 7,
      width: 2,
      backgroundColor: colors.thread,
    },
    dot: {
      position: 'absolute',
      left: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    nextDot: {
      backgroundColor: colors.onHeader,
    },
    laterDot: {
      backgroundColor: colors.header,
      borderWidth: 2,
      borderColor: colors.thread,
    },
    foldDot: {
      backgroundColor: colors.thread,
    },
    nowDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.heroAccent,
    },
    nowRing: {
      position: 'absolute',
      left: -3,
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.heroAccent,
      backgroundColor: colors.header,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: spacing[2],
    },
    metaLarge: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    // As the date above: room to spare, so the last word is drawn
    metaText: {
      flexGrow: 1,
      flexShrink: 1,
    },
    count: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginLeft: 'auto',
    },
    countLarge: {
      marginLeft: 0,
    },
    countNumber: {
      color: colors.heroAccent,
    },
    countText: {
      color: colors.heroAccent,
    },
    onHeader: {
      color: colors.onHeader,
    },
    muted: {
      color: colors.onHeaderMuted,
    },
  });
