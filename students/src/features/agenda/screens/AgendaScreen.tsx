import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';

import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  useFeedbackContext,
  usePreferencesContext,
  useQueryStates,
  useQuietQueryErrors,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  StateBlock,
  Theme,
  useSavedAtText,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { useScrollToTop } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { AppPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import {
  AgendaHeaderControls,
  AgendaView,
} from '../components/AgendaHeaderControls';
import { AgendaDateRow, DayStrip } from '../components/AgendaHero';
import {
  AgendaDayCard,
  AgendaDaySkeleton,
  AgendaEmptyDay,
  AgendaWeekList,
} from '../components/AgendaLists';
import { AgendaStackParamList } from '../components/AgendaNavigator';
import {
  AgendaFilterChips,
  AgendaStatusRow,
} from '../components/AgendaToolbar';
import { AgendaWeekGrid } from '../components/AgendaWeekGrid';
import { useMinuteClock } from '../hooks/useMinuteClock';
import { processLectures } from '../hooks/useProcessedLectures';
import { refreshAgendaQueries, useGetAgendaWeek } from '../queries/agendaHooks';
import { AgendaItemType } from '../types/AgendaItem';
import { AgendaWeek } from '../types/AgendaWeek';
import {
  AgendaEntry,
  shownTypes,
  toEntry,
  toggleType,
} from '../utils/agendaItems';
import {
  DayKey,
  addDays,
  countsByDay,
  dayKeyOf,
  daysOfWeek,
  groupByDay,
  weekOf,
} from '../utils/agendaLogic';

type Props = NativeStackScreenProps<AgendaStackParamList, 'Agenda'>;

/** The entries of a week the student shows: hidden lectures and filters applied */
const useEntries = (week: AgendaWeek | undefined) => {
  const { courses, agendaScreen } = usePreferencesContext<AppPreferences>();
  return useMemo(() => {
    if (!week) return undefined;
    const items = week.data.flatMap(day => day.items);
    // processLectures reads each lecture's course preferences: lectures of
    // a course without saved preferences pass unchanged
    const known = items.filter(
      i =>
        i.type !== 'lecture' ||
        !i.uniqueShortcode ||
        courses[i.uniqueShortcode],
    );
    const unknown = items.filter(i => !known.includes(i));
    const all = [...processLectures(known, courses), ...unknown].map(toEntry);
    const shown = shownTypes(agendaScreen.filters);
    return { all, shown: all.filter(e => shown[e.item.type]) };
  }, [week, courses, agendaScreen.filters]);
};

export const AgendaScreen = ({ navigation, route }: Props) => {
  const { t, i18n } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge } = useTextScale();
  const client = useQueryClient();
  const { setFeedback } = useFeedbackContext();
  const { agendaScreen, updatePreference, language } =
    usePreferencesContext<AppPreferences>();

  // Today in Rome, computed on every render from a clock that ticks each
  // minute, so the today mark moves at midnight
  const now = useMinuteClock();
  const today = dayKeyOf(now, APP_TIMEZONE);

  const [date, setDate] = useState<DayKey>(route.params?.date ?? today);
  const [view, setView] = useState<AgendaView>(
    agendaScreen.layout === 'weekly' ? 'week' : 'day',
  );

  // "Open agenda" elsewhere sets the day; each request applies again, even
  // for the day already in the params
  const { date: paramDate, requestedAt } = route.params ?? {};
  useEffect(() => {
    if (paramDate) setDate(paramDate);
  }, [paramDate, requestedAt]);

  const changeView = useCallback(
    (next: AgendaView) => {
      setView(next);
      updatePreference('agendaScreen', {
        ...agendaScreen,
        layout: next === 'week' ? 'weekly' : 'daily',
      });
    },
    [agendaScreen, updatePreference],
  );

  const toggleFilter = (type: AgendaItemType) => {
    const filters = toggleType(agendaScreen.filters, type);
    if (!filters) {
      setFeedback({ text: t('agendaScreen.lastFilter') });
      return;
    }
    updatePreference('agendaScreen', { ...agendaScreen, filters });
  };
  const showAllTypes = () =>
    updatePreference('agendaScreen', {
      ...agendaScreen,
      filters: { lecture: false, exam: false, booking: false, deadline: false },
    });

  const { monday } = useMemo(() => weekOf(date, APP_TIMEZONE), [date]);
  const nextMonday = useMemo(() => monday.plus({ weeks: 1 }), [monday]);
  const days = useMemo(() => daysOfWeek(monday), [monday]);

  const { week, sourceQueries } = useGetAgendaWeek(monday);
  // The next week is loaded too: it is saved for offline use, and an empty
  // day can point to the next one with events
  const { week: nextWeek, sourceQueries: nextSources } =
    useGetAgendaWeek(nextMonday);
  useQuietQueryErrors(nextSources);
  const states = useQueryStates(sourceQueries, { isEmpty: () => false });

  const entries = useEntries(week);
  const nextEntries = useEntries(nextWeek);
  const byDay = useMemo(
    () => groupByDay<AgendaEntry>(entries?.shown ?? [], APP_TIMEZONE),
    [entries],
  );
  const counts = useMemo(
    () => countsByDay(days, entries?.shown ?? [], APP_TIMEZONE),
    [days, entries],
  );

  // Refresh: the button and pull to refresh fetch the sources again
  const [isRefreshing, setIsRefreshing] = useState(false);
  // The pull spinner shows only for a pull; the button has its own progress
  const [isPulled, setIsPulled] = useState(false);
  const { time: savedTime } = useSavedAtText(states.updatedAt);
  const refresh = useCallback(() => {
    if (isRefreshing) return;
    if (states.isOffline) {
      setFeedback({
        text: savedTime
          ? t('agendaScreen.refreshNeedsConnection', { time: savedTime })
          : t('agendaScreen.refreshNeedsConnectionNoTime'),
      });
      return;
    }
    setIsRefreshing(true);
    refreshAgendaQueries(client).finally(() => {
      setIsRefreshing(false);
      setIsPulled(false);
    });
  }, [client, isRefreshing, savedTime, setFeedback, states.isOffline, t]);
  const wasRefreshing = useRef(false);
  useEffect(() => {
    if (wasRefreshing.current && !isRefreshing && savedTime)
      AccessibilityInfo.announceForAccessibility(
        t('agendaScreen.updatedAnnouncement', { time: savedTime }),
      );
    wasRefreshing.current = isRefreshing;
  }, [isRefreshing, savedTime, t]);

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AgendaHeaderControls
          view={view}
          onChangeView={changeView}
          onPickDate={() => setIsPickerOpen(true)}
          onOpenPreferences={() => navigation.navigate('AgendaPreferences')}
        />
      ),
    });
  }, [navigation, view, changeView]);

  // Tapping the active tab again scrolls back to the top
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const isOnToday =
    view === 'day'
      ? date === today
      : weekOf(today, APP_TIMEZONE).monday.equals(monday);
  const step = (direction: -1 | 1) =>
    setDate(d =>
      addDays(d, direction * (view === 'day' ? 1 : 7), APP_TIMEZONE),
    );
  const goToday = () => setDate(today);

  const dayDate = DateTime.fromISO(date, { zone: APP_TIMEZONE }).setLocale(
    language,
  );
  const statusTitle =
    view === 'day'
      ? date === today
        ? t('agendaScreen.todayDate', { date: dayDate.toFormat('ccc d LLL') })
        : dayDate.toFormat('ccc d LLL')
      : t('agendaScreen.weekOf', {
          date: monday.setLocale(i18n.language).toFormat('d LLL'),
        });

  const isLoading = states.status === 'loading';
  let body;
  if (states.status === 'error') {
    body = (
      <StateBlock
        card
        style={styles.block}
        variant={states.isOffline ? 'empty' : 'error'}
        title={
          states.isOffline
            ? t('agendaScreen.offlineTitle')
            : t('states.agenda.failedTitle')
        }
        text={
          states.isOffline
            ? t('agendaScreen.offlineText')
            : t('states.agenda.failedText')
        }
        action={
          states.isOffline
            ? undefined
            : {
                label: t('states.tryAgain'),
                icon: faArrowsRotate,
                primary: true,
                onPress: states.retry,
              }
        }
      />
    );
  } else if (view === 'week' && !isLarge) {
    body = (
      <AgendaWeekGrid
        days={days}
        today={today}
        now={now}
        entriesByDay={byDay}
        loading={isLoading}
        onOpenDay={day => {
          setDate(day);
          changeView('day');
        }}
      />
    );
  } else if (isLoading) {
    body = <AgendaDaySkeleton label={t('states.agenda.loading')} />;
  } else if (view === 'week') {
    body = (
      <AgendaWeekList
        days={days}
        today={today}
        entriesByDay={byDay}
        now={now}
      />
    );
  } else {
    const shown = byDay.get(date) ?? [];
    if (shown.length) {
      body = <AgendaDayCard entries={shown} now={now} />;
    } else {
      const allOfDay = (entries?.all ?? []).filter(
        e => dayKeyOf(e.start, APP_TIMEZONE) === date,
      );
      const later = [...(entries?.shown ?? []), ...(nextEntries?.shown ?? [])]
        .filter(e => dayKeyOf(e.start, APP_TIMEZONE) > date)
        .sort((a, b) => a.start - b.start);
      body = (
        <AgendaEmptyDay
          day={date}
          hidden={allOfDay.length}
          next={later[0]}
          onShowAll={showAllTypes}
          onGoTo={setDate}
        />
      );
    }
  }

  return (
    <>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isPulled && isRefreshing}
            onRefresh={() => {
              setIsPulled(true);
              refresh();
            }}
            tintColor={colors.onHeader}
            colors={[colors.primary]}
          />
        }
      >
        {/* The navy goes on above the date row when the page is pulled down */}
        <View style={styles.overscroll} />
        <View style={styles.hero}>
          <AgendaDateRow
            view={view}
            date={date}
            monday={monday}
            isOnToday={isOnToday}
            onStep={step}
            onToday={goToday}
          />
          {view === 'day' ? (
            <DayStrip
              days={days}
              selected={date}
              today={today}
              counts={counts}
              loading={!entries}
              onSelect={setDate}
              onSwipe={direction =>
                setDate(d => addDays(d, direction * 7, APP_TIMEZONE))
              }
            />
          ) : (
            <View style={styles.heroEnd} />
          )}
        </View>
        <AgendaFilterChips
          shown={shownTypes(agendaScreen.filters)}
          onToggle={toggleFilter}
        />
        <AgendaStatusRow
          title={statusTitle}
          // The time of the data shown, once the week is there
          time={entries ? savedTime : undefined}
          isRefreshing={isRefreshing}
          isOffline={states.isOffline}
          onRefresh={refresh}
        />
        {body}
        <View style={styles.end} />
        <BottomBarSpacer />
      </ScrollView>
      <DatePicker
        modal
        locale={language}
        date={DateTime.fromISO(date, { zone: APP_TIMEZONE })
          .set({ hour: 12 })
          .toJSDate()}
        mode="date"
        open={isPickerOpen}
        onConfirm={picked => {
          setIsPickerOpen(false);
          setDate(dayKeyOf(picked.valueOf(), APP_TIMEZONE));
        }}
        onCancel={() => setIsPickerOpen(false)}
        title={t('agendaScreen.selectDate')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
      />
    </>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    overscroll: {
      position: 'absolute',
      top: -1000,
      left: 0,
      right: 0,
      height: 1000,
      backgroundColor: colors.header,
    },
    hero: {
      backgroundColor: colors.header,
    },
    heroEnd: {
      height: spacing[2],
    },
    block: {
      marginHorizontal: layout.gutter,
      marginTop: spacing[3],
    },
    end: {
      height: spacing[6],
    },
  });
