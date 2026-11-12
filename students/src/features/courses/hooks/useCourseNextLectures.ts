import { useMemo } from 'react';

import { usePreferencesContext } from '@polito/lib/core';

import { romeMonday } from '../../../core/queries/weekQueries';
import { AppPreferences } from '../../../core/types/preferences';
import { useMinuteClock } from '../../agenda/hooks/useMinuteClock';
import {
  useGetLectureWeeks,
  useGetNextLecture,
} from '../../agenda/queries/lectureHooks';
import { LectureItem } from '../../agenda/types/AgendaItem';
import { formatNextLecture } from '../../agenda/utils/formatters';

export interface CourseLectureEntry {
  item: LectureItem;
  /** The kind the timetable gives: "Lezione", "Esercitazione", ... */
  kind?: string;
}

/** The weeks searched for the next lectures: this one and the next two */
const WEEKS_AHEAD = 3;

/**
 * The course's next lectures, from the agenda's lecture weeks (so the
 * agenda and the course agree), or the API's next lecture when the course
 * is hidden from the agenda. Lectures in progress count as next.
 */
export const useCourseNextLectures = (courseId: number, count: number) => {
  const { courses: coursesPreferences } =
    usePreferencesContext<AppPreferences>();
  const now = useMinuteClock();
  const mondays = useMemo(
    () =>
      Array.from({ length: WEEKS_AHEAD }, (_, i) =>
        romeMonday().plus({ weeks: i }),
      ),
    [],
  );
  const weeks = useGetLectureWeeks(coursesPreferences, mondays);
  const { nextLecture, isLoadingNextLecture } = useGetNextLecture(courseId);

  const entries = useMemo((): CourseLectureEntry[] => {
    const fromWeeks = weeks.data
      .flatMap(week => week ?? [])
      .filter(l => l.courseId === courseId && l.endsAt.getTime() > now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, count)
      .map(l => ({
        item: formatNextLecture(l, coursesPreferences),
        kind: l.type,
      }));
    if (fromWeeks.length) return fromWeeks;
    return nextLecture && nextLecture.end.toMillis() > now
      ? [{ item: nextLecture }]
      : [];
  }, [weeks.data, courseId, now, count, coursesPreferences, nextLecture]);

  return {
    entries,
    isLoading: weeks.isLoading || isLoadingNextLecture,
    queries: weeks.queries,
  };
};
