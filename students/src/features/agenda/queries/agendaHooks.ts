import { useEffect, useMemo } from 'react';

import {
  APP_TIMEZONE,
  PreferencesContextProps,
  dateFormatter,
  usePreferencesContext,
} from '@polito/lib/core';
import { Booking, Deadline, ExamStatusEnum } from '@polito/student-api-client';
import {
  QueryClient,
  hashKey,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { AppPreferences, CoursesPreferences } from '~/core/types/preferences';

import { DateTime, Interval } from 'luxon';

import {
  BOOKINGS_QUERY_KEY,
  useGetBookings,
} from '../../../core/queries/bookingHooks';
import { EXAMS_QUERY_KEY, useGetExams } from '../../../core/queries/examHooks';
import {
  DEADLINES_QUERY_PREFIX,
  useGetDeadlineWeek,
  useGetDeadlineWeeks,
} from '../../../core/queries/studentHooks';
import { Exam } from '../../../core/types/api';
import { AgendaDay } from '../types/AgendaDay';
import {
  ALL_AGENDA_TYPES,
  AgendaItem,
  BookingItem,
  DeadlineItem,
  ExamItem,
  LectureItem,
} from '../types/AgendaItem';
import { AgendaTypesFilterState } from '../types/AgendaTypesFilterState';
import { AgendaWeek } from '../types/AgendaWeek';
import { Lecture } from '../types/Lecture';
import {
  LECTURES_QUERY_PREFIX,
  useGetLectureWeek,
  useGetLectureWeeks,
} from './lectureHooks';

export const AGENDA_QUERY_PREFIX = 'agenda';

// Refetches the queries the agenda is built from, then rebuilds the agenda
export const refreshAgendaQueries = (client: QueryClient) =>
  Promise.all(
    [
      EXAMS_QUERY_KEY,
      BOOKINGS_QUERY_KEY,
      [LECTURES_QUERY_PREFIX],
      [DEADLINES_QUERY_PREFIX],
    ].map(queryKey => client.invalidateQueries({ queryKey })),
  ).then(_ => client.invalidateQueries({ queryKey: [AGENDA_QUERY_PREFIX] }));

const groupItemsByDay = (
  coursesPreferences: CoursesPreferences,
  exams: Exam[],
  bookings: Booking[],
  lectures: Lecture[],
  deadlines: Deadline[],
  includesToday: boolean,
): AgendaDay[] => {
  const agendaItems: AgendaItem[] = [];

  const timeOptions = {
    zone: APP_TIMEZONE,
  };
  const formatHHmm = dateFormatter('HH:mm');
  // Group items by their day in the app time zone, the one their times are shown in
  const formatDay = dateFormatter('yyyy-MM-dd');
  agendaItems.push(
    ...exams
      .filter(exam => exam.status === ExamStatusEnum.Booked)
      .map(exam => {
        const coursePreferences = coursesPreferences[exam.uniqueShortcode];

        const item: ExamItem = {
          id: exam.id,
          key: 'exam' + exam.id,
          type: 'exam',
          color: coursePreferences?.color,
          icon: coursePreferences?.icon,
          date: formatDay(exam.examStartsAt!),
          start: DateTime.fromJSDate(exam.examStartsAt!, timeOptions),
          end: DateTime.fromJSDate(exam.examEndsAt!, timeOptions),
          startTimestamp: exam.examStartsAt!.valueOf(),
          fromTime: formatHHmm(exam.examStartsAt!),
          isTimeToBeDefined: exam.isTimeToBeDefined,
          title: exam.courseName,
          places: exam?.places ?? [],
          teacherId: exam.teacherId,
        };
        return item;
      }),
  );

  agendaItems.push(
    ...bookings.map(booking => {
      const item: BookingItem = {
        id: booking.id,
        key: 'booking' + booking.id,
        type: 'booking',
        date: formatDay(booking.startsAt!),
        startTimestamp: booking.startsAt!.valueOf(),
        fromTime: formatHHmm(booking.startsAt!),
        toTime: formatHHmm(booking.endsAt!),
        start: DateTime.fromJSDate(booking.startsAt!, timeOptions),
        end: DateTime.fromJSDate(booking.endsAt!, timeOptions),
        title: booking.topic.title,
      };
      return item;
    }),
  );

  agendaItems.push(
    ...lectures.map(lecture => {
      const coursePreferences = lecture.uniqueShortcode
        ? coursesPreferences[lecture.uniqueShortcode]
        : undefined;
      const item: LectureItem = {
        id: lecture.id,
        key: 'lecture' + lecture.id,
        type: 'lecture',
        start: DateTime.fromJSDate(lecture.startsAt, timeOptions),
        end: DateTime.fromJSDate(lecture.endsAt, timeOptions),
        date: formatDay(lecture.startsAt),
        startTimestamp: lecture.startsAt.valueOf(),
        fromTime: formatHHmm(lecture.startsAt),
        toTime: formatHHmm(lecture.endsAt),
        title: lecture.courseName,
        courseId: lecture.courseId,
        color: coursePreferences?.color,
        icon: coursePreferences?.icon,
        place: lecture.place,
        teacherId: lecture.teacherId,
        virtualClassrooms: lecture.virtualClassrooms,
        description: lecture.description,
        uniqueShortcode: lecture.uniqueShortcode,
      };
      return item;
    }),
  );

  agendaItems.push(
    ...deadlines.map(deadline => {
      const startDateTime = DateTime.fromJSDate(
        deadline.date,
        timeOptions,
      ).startOf('day');
      const endDateTime = startDateTime.plus({ hour: 1 });

      const item: DeadlineItem = {
        id: deadline.id!,
        key: 'deadline-' + deadline.id,
        start: startDateTime,
        end: endDateTime,
        startTimestamp: deadline.date.valueOf(),
        date: startDateTime.toFormat('yyyy-MM-dd'),
        title: deadline.name,
        type: 'deadline',
        url: deadline.url,
      };
      return item;
    }),
  );

  const daysMap = new Map<string, AgendaDay>();

  const today = DateTime.now().setZone(APP_TIMEZONE).startOf('day');
  const todayString = today.toFormat('y-MM-dd');

  const agendaDays = agendaItems.reduce<Map<string, AgendaDay>>(
    (days, item) => {
      let day = days.get(item.date);
      if (!day) {
        day = {
          key: item.date,
          date: DateTime.fromSQL(item.date, timeOptions),
          isToday: item.date === todayString,
          items: [],
        };
      }

      day.items.push(item);
      days.set(item.date, day);

      return days;
    },
    daysMap,
  );

  if (includesToday && !daysMap.has(todayString)) {
    daysMap.set(todayString, {
      key: todayString,
      date: today,
      isToday: true,
      items: [],
    });
  }

  return [...agendaDays].sort().map(([_, day]) => {
    day.items.sort((a, b) => a.startTimestamp - b.startTimestamp);
    return day;
  });
};

const thisMonday = DateTime.now().setZone(APP_TIMEZONE).startOf('week');

interface AgendaWeekQueryFnParams {
  preferences: PreferencesContextProps<AppPreferences>;
  startDate: DateTime;
  examsData: Exam[];
  bookingsData: Booking[];
  lecturesData: Lecture[];
  deadlinesData: Deadline[];
  sources: string;
}

export const getAgendaWeekQueryKey = (
  filters: AgendaTypesFilterState,
  startDate: DateTime,
) => [AGENDA_QUERY_PREFIX, filters, startDate];

// Agenda weeks are built from other queries without a network call. This maps
// each cached week to the dataUpdatedAt of the source data it was built from.
const agendaWeekSources = new Map<string, string>();

const getAgendaWeekQueryFn = async ({
  preferences,
  startDate,
  examsData,
  bookingsData,
  lecturesData,
  deadlinesData,
  sources,
}: AgendaWeekQueryFnParams): Promise<AgendaWeek> => {
  agendaWeekSources.set(
    hashKey(getAgendaWeekQueryKey(preferences.agendaScreen.filters, startDate)),
    sources,
  );
  let queryFilters: AgendaTypesFilterState;

  // if all filters are set to false, set all query filters to true
  if (ALL_AGENDA_TYPES.every(type => !preferences.agendaScreen.filters[type])) {
    queryFilters = {
      exam: true,
      booking: true,
      lecture: true,
      deadline: true,
    };
  } else {
    queryFilters = { ...preferences.agendaScreen.filters };
  }

  const until = startDate.plus({ week: 1 });

  const jsSince = startDate.toJSDate();
  const jsUntil = until.toJSDate();

  let bookings: Booking[] = [],
    deadlines: Deadline[] = [],
    exams: Exam[] = [],
    lectures: Lecture[] = [];
  if (queryFilters.booking) {
    bookings = bookingsData.filter(
      b => b.startsAt && b.startsAt > jsSince && b.startsAt < jsUntil,
    );
  }

  if (queryFilters.deadline) {
    deadlines = deadlinesData;
  }

  if (queryFilters.exam) {
    exams = examsData.filter(
      e =>
        e.examStartsAt && e.examStartsAt > jsSince && e.examStartsAt < jsUntil,
    );
  }

  if (queryFilters.lecture) {
    lectures = lecturesData;
  }

  const days = groupItemsByDay(
    preferences.courses,
    exams,
    bookings,
    lectures,
    deadlines,
    startDate === thisMonday,
  );

  return {
    key: startDate.toSQLDate()!,
    dateRange: Interval.fromDateTimes(startDate, until),
    data: days,
  };
};

// Rebuilds the weeks whose source data changed. Call it after the agenda
// queries, so their latest queryFn has reached the cache when this effect runs.
const useRebuildChangedAgendaWeeks = (
  filters: AgendaTypesFilterState,
  weeks: { startDate: DateTime; sources: string; hasData: boolean }[],
) => {
  const client = useQueryClient();

  useEffect(() => {
    weeks.forEach(({ startDate, sources, hasData }) => {
      const queryKey = getAgendaWeekQueryKey(filters, startDate);
      if (hasData && agendaWeekSources.get(hashKey(queryKey)) !== sources) {
        client.invalidateQueries({ queryKey, exact: true });
      }
    });
  });
};

export const useGetAgendaWeek = (startDate: DateTime = thisMonday) => {
  const preferences = usePreferencesContext<AppPreferences>();

  const examsQuery = useGetExams();
  const bookingsQuery = useGetBookings();
  const lecturesQuery = useGetLectureWeek(preferences.courses, startDate);
  const deadlinesQuery = useGetDeadlineWeek(startDate);
  const sources = [examsQuery, bookingsQuery, lecturesQuery, deadlinesQuery]
    .map(q => q.dataUpdatedAt)
    .join();

  const agendaWeekQuery = useQuery<AgendaWeek>({
    queryKey: getAgendaWeekQueryKey(
      preferences.agendaScreen.filters,
      startDate,
    ),
    queryFn: async () =>
      getAgendaWeekQueryFn({
        preferences,
        startDate,
        examsData: examsQuery.data!,
        bookingsData: bookingsQuery.data!,
        lecturesData: lecturesQuery.data!,
        deadlinesData: deadlinesQuery.data!,
        sources,
      }),
    enabled:
      !!lecturesQuery.data &&
      !!examsQuery.data &&
      !!bookingsQuery.data &&
      !!deadlinesQuery.data,
    networkMode: 'always',
    staleTime: 300000, // TODO define
  });

  useRebuildChangedAgendaWeeks(preferences.agendaScreen.filters, [
    { startDate, sources, hasData: agendaWeekQuery.data !== undefined },
  ]);

  return agendaWeekQuery;
};

export const useGetAgendaWeeks = (mondays: DateTime[]) => {
  const preferences = usePreferencesContext<AppPreferences>();

  const examsQuery = useGetExams();
  const bookingsQuery = useGetBookings();
  const lecturesQueries = useGetLectureWeeks(preferences.courses, mondays);
  const deadlinesQueries = useGetDeadlineWeeks(mondays);
  const sources = mondays.map((_, index) =>
    [
      examsQuery.dataUpdatedAt,
      bookingsQuery.dataUpdatedAt,
      lecturesQueries.dataUpdatedAt[index],
      deadlinesQueries.dataUpdatedAt[index],
    ].join(),
  );

  const queries = useQueries({
    queries: mondays.map((monday, index) => ({
      queryKey: getAgendaWeekQueryKey(preferences.agendaScreen.filters, monday),
      queryFn: () =>
        getAgendaWeekQueryFn({
          preferences,
          startDate: monday,
          examsData: examsQuery.data!,
          bookingsData: bookingsQuery.data!,
          lecturesData: lecturesQueries.data[index],
          deadlinesData: deadlinesQueries.data[index],
          sources: sources[index],
        }),
      enabled:
        !!examsQuery.data &&
        !!bookingsQuery.data &&
        !!lecturesQueries.data[index] &&
        !!deadlinesQueries.data[index],
      staleTime: Infinity,
    })),
  });

  useRebuildChangedAgendaWeeks(
    preferences.agendaScreen.filters,
    mondays.map((startDate, index) => ({
      startDate,
      sources: sources[index],
      hasData: queries[index].data !== undefined,
    })),
  );

  const isLoading = useMemo(() => {
    if (!mondays?.length) return true;
    return queries.some(q => q.isLoading);
  }, [mondays, queries]);

  return {
    isLoading,
    data: queries.filter(q => q.data).map(q => q.data as AgendaWeek),
    /** One query per week, built from the sources below */
    weekQueries: queries,
    /** The API queries the weeks are built from, for loading and failed states */
    sourceQueries: [
      examsQuery,
      bookingsQuery,
      ...lecturesQueries.queries,
      ...deadlinesQueries.queries,
    ],
  };
};
