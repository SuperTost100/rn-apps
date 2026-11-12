import { useMemo } from 'react';

import { APP_TIMEZONE, usePreferencesContext } from '@polito/lib/core';
import { Booking, Deadline, ExamStatusEnum } from '@polito/student-api-client';
import { QueryClient } from '@tanstack/react-query';

import { CoursesPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import {
  BOOKINGS_QUERY_KEY,
  useGetBookings,
} from '../../../core/queries/bookingHooks';
import { EXAMS_QUERY_KEY, useGetExams } from '../../../core/queries/examHooks';
import {
  DEADLINES_QUERY_PREFIX,
  useGetDeadlineWeek,
} from '../../../core/queries/studentHooks';
import { romeMonday } from '../../../core/queries/weekQueries';
import { Exam } from '../../../core/types/api';
import { AppPreferences } from '../../../core/types/preferences';
import { AgendaDay } from '../types/AgendaDay';
import {
  AgendaItem,
  BookingItem,
  DeadlineItem,
  ExamItem,
  LectureItem,
} from '../types/AgendaItem';
import { AgendaWeek } from '../types/AgendaWeek';
import { Lecture } from '../types/Lecture';
import { LECTURES_QUERY_PREFIX, useGetLectureWeek } from './lectureHooks';

/**
 * Fetches again the sources the agenda is built from. Only the weeks on
 * screen go to the network; the others are marked stale and fetched when
 * they are shown.
 */
export const refreshAgendaQueries = (client: QueryClient) =>
  Promise.all(
    [
      EXAMS_QUERY_KEY,
      BOOKINGS_QUERY_KEY,
      [LECTURES_QUERY_PREFIX],
      [DEADLINES_QUERY_PREFIX],
    ].map(queryKey => client.invalidateQueries({ queryKey })),
  );

const toItems = (
  coursesPreferences: CoursesPreferences,
  exams: Exam[],
  bookings: Booking[],
  lectures: Lecture[],
  deadlines: Deadline[],
): AgendaItem[] => {
  const zone = { zone: APP_TIMEZONE };
  const hhmm = (date: Date) =>
    DateTime.fromJSDate(date, zone).toFormat('HH:mm');
  const day = (date: Date) => DateTime.fromJSDate(date, zone).toISODate()!;
  const items: AgendaItem[] = [];

  exams
    .filter(exam => exam.status === ExamStatusEnum.Booked && exam.examStartsAt)
    .forEach(exam => {
      const preferences = coursesPreferences[exam.uniqueShortcode];
      const item: ExamItem = {
        id: exam.id,
        key: 'exam' + exam.id,
        type: 'exam',
        color: preferences?.color,
        icon: preferences?.icon,
        date: day(exam.examStartsAt!),
        start: DateTime.fromJSDate(exam.examStartsAt!, zone),
        end: DateTime.fromJSDate(exam.examEndsAt!, zone),
        startTimestamp: exam.examStartsAt!.valueOf(),
        fromTime: hhmm(exam.examStartsAt!),
        isTimeToBeDefined: exam.isTimeToBeDefined,
        title: exam.courseName,
        places: exam?.places ?? [],
        teacherId: exam.teacherId,
      };
      items.push(item);
    });

  bookings
    .filter(booking => booking.startsAt && booking.endsAt)
    .forEach(booking => {
      const item: BookingItem = {
        id: booking.id,
        key: 'booking' + booking.id,
        type: 'booking',
        date: day(booking.startsAt),
        startTimestamp: booking.startsAt.valueOf(),
        fromTime: hhmm(booking.startsAt),
        toTime: hhmm(booking.endsAt),
        start: DateTime.fromJSDate(booking.startsAt, zone),
        end: DateTime.fromJSDate(booking.endsAt, zone),
        title: booking.topic.title,
        place: booking.location?.name,
      };
      items.push(item);
    });

  lectures.forEach(lecture => {
    const preferences = lecture.uniqueShortcode
      ? coursesPreferences[lecture.uniqueShortcode]
      : undefined;
    const item: LectureItem = {
      id: lecture.id,
      key: 'lecture' + lecture.id,
      type: 'lecture',
      start: DateTime.fromJSDate(lecture.startsAt, zone),
      end: DateTime.fromJSDate(lecture.endsAt, zone),
      date: day(lecture.startsAt),
      startTimestamp: lecture.startsAt.valueOf(),
      fromTime: hhmm(lecture.startsAt),
      toTime: hhmm(lecture.endsAt),
      title: lecture.courseName,
      courseId: lecture.courseId,
      color: preferences?.color,
      icon: preferences?.icon,
      place: lecture.place,
      teacherId: lecture.teacherId,
      virtualClassrooms: lecture.virtualClassrooms,
      description: lecture.description,
      uniqueShortcode: lecture.uniqueShortcode,
    };
    items.push(item);
  });

  deadlines.forEach(deadline => {
    // A deadline is a whole day: the day of its date in Rome
    const start = DateTime.fromJSDate(deadline.date, zone).startOf('day');
    const item: DeadlineItem = {
      id: deadline.id!,
      key: 'deadline-' + deadline.id,
      start,
      end: start.plus({ days: 1 }),
      startTimestamp: start.toMillis(),
      date: start.toISODate()!,
      title: deadline.name,
      type: 'deadline',
      deadlineType: deadline.type,
      url: deadline.url,
    };
    items.push(item);
  });

  return items;
};

/**
 * One week of the agenda, from its Monday in Rome: every lecture, booked
 * exam, booking and deadline of the week, grouped by day in Rome and in
 * time order. It holds no notion of today, which the screens compute when
 * they render, so the today mark is right after midnight.
 */
const buildAgendaWeek = (
  monday: DateTime,
  coursesPreferences: CoursesPreferences,
  exams: Exam[],
  bookings: Booking[],
  lectures: Lecture[],
  deadlines: Deadline[],
): AgendaWeek => {
  const since = romeMonday(monday);
  const until = since.plus({ weeks: 1 });
  const inWeek = (date?: Date) =>
    !!date && date >= since.toJSDate() && date < until.toJSDate();
  const items = toItems(
    coursesPreferences,
    exams.filter(e => inWeek(e.examStartsAt ?? undefined)),
    bookings.filter(b => inWeek(b.startsAt)),
    lectures,
    deadlines,
  );
  const days = new Map<string, AgendaDay>();
  items.forEach(item => {
    const day = days.get(item.date) ?? {
      key: item.date,
      date: DateTime.fromISO(item.date, { zone: APP_TIMEZONE }),
      items: [],
    };
    day.items.push(item);
    days.set(item.date, day);
  });
  return {
    key: since.toISODate()!,
    monday: since,
    data: [...days.values()]
      .sort((a, b) => (a.key < b.key ? -1 : 1))
      .map(day => ({
        ...day,
        // Deadlines (the whole day) first, then by start
        items: day.items.sort(
          (a, b) =>
            Number(b.type === 'deadline') - Number(a.type === 'deadline') ||
            a.startTimestamp - b.startTimestamp,
        ),
      })),
  };
};

/**
 * One week of the agenda, built from the API queries it needs: exams,
 * bookings, and the week's lectures and deadlines. The week is rebuilt
 * whenever one of them changes, and it exists once all four have data,
 * from the network or saved on the phone.
 */
export const useGetAgendaWeek = (monday: DateTime = romeMonday()) => {
  const { courses } = usePreferencesContext<AppPreferences>();
  const examsQuery = useGetExams();
  const bookingsQuery = useGetBookings();
  const lecturesQuery = useGetLectureWeek(courses, monday);
  const deadlinesQuery = useGetDeadlineWeek(monday);

  const week = useMemo(
    () =>
      examsQuery.data &&
      bookingsQuery.data &&
      lecturesQuery.data &&
      deadlinesQuery.data
        ? buildAgendaWeek(
            monday,
            courses,
            examsQuery.data,
            bookingsQuery.data,
            lecturesQuery.data,
            deadlinesQuery.data,
          )
        : undefined,
    [
      monday,
      courses,
      examsQuery.data,
      bookingsQuery.data,
      lecturesQuery.data,
      deadlinesQuery.data,
    ],
  );

  return {
    week,
    /** The API queries the week is built from, for loading and failed states */
    sourceQueries: [examsQuery, bookingsQuery, lecturesQuery, deadlinesQuery],
  };
};
