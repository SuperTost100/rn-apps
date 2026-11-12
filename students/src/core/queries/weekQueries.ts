import { APP_TIMEZONE } from '@polito/lib/core';

import { DateTime } from 'luxon';

/**
 * Lectures and deadlines of a week are fresh for 15 minutes, in the day and
 * the week layout alike. After that a screen that shows the week fetches it
 * again; weeks nobody looks at stay as they are.
 */
export const WEEK_STALE_TIME = 15 * 60 * 1000;

/** Monday at midnight in Rome of the week that holds `date` (default: now) */
export const romeMonday = (date?: DateTime) =>
  (date ?? DateTime.now()).setZone(APP_TIMEZONE).startOf('week');

/**
 * The query key of one week of a source: the `yyyy-MM-dd` of its Monday in
 * Rome. Every caller gets the same entry for the same week, whatever zone
 * or time of day its DateTime carries.
 */
export const weekQueryKey = (prefix: string, monday: DateTime) => [
  prefix,
  romeMonday(monday).toISODate()!,
];
