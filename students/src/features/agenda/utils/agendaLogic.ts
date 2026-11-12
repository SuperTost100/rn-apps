/**
 * Pure agenda logic: week bounds, day grouping, "now", the day strip's dots
 * and the week grid's overlap layout. Every day is a day in Rome, whatever
 * the phone's own time zone. Kept free of React and of the app's other
 * modules so it can be checked with node alone.
 */
import { DateTime, Zone } from 'luxon';

/** A day as `yyyy-MM-dd` in the agenda's time zone */
export type DayKey = string;

/** The day of a moment, in the given zone */
export const dayKeyOf = (ms: number, zone: Zone | string): DayKey =>
  DateTime.fromMillis(ms, { zone }).toISODate()!;

/** Midnight at the start of a day key, in the given zone */
const startOfDay = (day: DayKey, zone: Zone | string) =>
  DateTime.fromISO(day, { zone }).startOf('day');

/**
 * The week that holds a day: its Monday at midnight and the next Monday at
 * midnight, in the given zone. Across a DST change the week is 167 or 169
 * hours long, so it is computed in calendar days, never as 7 * 24 h.
 */
export const weekOf = (day: DayKey, zone: Zone | string) => {
  const monday = startOfDay(day, zone).startOf('week');
  return { monday, until: monday.plus({ weeks: 1 }) };
};

/** The seven day keys of the week that starts on `monday` */
export const daysOfWeek = (monday: DateTime): DayKey[] =>
  Array.from({ length: 7 }, (_, i) => monday.plus({ days: i }).toISODate()!);

/** Moves a day key by whole days, calendar-wise */
export const addDays = (day: DayKey, days: number, zone: Zone | string) =>
  startOfDay(day, zone).plus({ days }).toISODate()!;

export interface Timed {
  /** Start (ms) */
  start: number;
  /** End (ms). Equal to start for items without a duration */
  end: number;
  /** An item for the whole day (a deadline): no time of its own */
  allDay?: boolean;
}

/** In progress: started and not ended yet. All-day items never are */
export const isNow = (item: Timed, now: number) =>
  !item.allDay && item.start <= now && now < item.end;

/** Over: ended before now. An all-day item ends when its day does */
export const isPast = (item: Timed, now: number, zone: Zone | string) =>
  item.allDay
    ? dayKeyOf(item.start, zone) < dayKeyOf(now, zone)
    : item.end <= now;

/**
 * Items grouped by their day in the zone, all-day items first, then by start.
 * Returns a map from day key to items, in day order.
 */
export const groupByDay = <T extends Timed>(
  items: readonly T[],
  zone: Zone | string,
): Map<DayKey, T[]> => {
  const byDay = new Map<DayKey, T[]>();
  [...items]
    .sort(
      (a, b) =>
        a.start - b.start ||
        Number(!!b.allDay) - Number(!!a.allDay) ||
        a.end - b.end,
    )
    .forEach(item => {
      const key = dayKeyOf(item.start, zone);
      const list = byDay.get(key) ?? [];
      list.push(item);
      byDay.set(key, list);
    });
  // All-day items lead their day, whatever their timestamp inside it
  byDay.forEach(list =>
    list.sort((a, b) => Number(!!b.allDay) - Number(!!a.allDay)),
  );
  return new Map([...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
};

/** How many items each day of the week has: the day strip's dots */
export const countsByDay = <T extends Timed>(
  days: readonly DayKey[],
  items: readonly T[],
  zone: Zone | string,
): Record<DayKey, number> => {
  const grouped = groupByDay(items, zone);
  return Object.fromEntries(
    days.map(day => [day, grouped.get(day)?.length ?? 0]),
  );
};

/** A timed block of the week grid, placed in its day column */
export interface GridBlock<T> {
  /** One item, or the items of a group too crowded to draw apart */
  items: T[];
  /** Minutes from the grid's first hour to the top of the block */
  top: number;
  /** Length in minutes */
  length: number;
  /** Column inside the day: 0 or 1 when two items sit side by side */
  column: number;
  /** 1, or 2 for two items side by side */
  columns: number;
}

/**
 * Lays out one day of the week grid. Items that overlap form a group. A
 * group of two sits side by side when `allowSideBySide` (the day column is
 * wide enough for two readable blocks); a larger group, or two in a narrow
 * column, becomes one "N events" block over the whole group.
 */
export const layoutDay = <T extends Timed>(
  items: readonly T[],
  gridStart: DateTime,
  allowSideBySide: boolean,
): GridBlock<T>[] => {
  const timed = items
    .filter(i => !i.allDay)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const groups: { start: number; end: number; items: T[] }[] = [];
  for (const item of timed) {
    const last = groups[groups.length - 1];
    if (last && item.start < last.end) {
      last.items.push(item);
      last.end = Math.max(last.end, item.end);
    } else {
      groups.push({ start: item.start, end: item.end, items: [item] });
    }
  }
  const origin = gridStart.toMillis();
  const minutes = (ms: number) => (ms - origin) / 60000;
  return groups.flatMap(group => {
    if (group.items.length === 2 && allowSideBySide) {
      return group.items.map((item, column) => ({
        items: [item],
        top: minutes(item.start),
        length: (item.end - item.start) / 60000,
        column,
        columns: 2,
      }));
    }
    return [
      {
        items: group.items,
        top: minutes(group.start),
        length: (group.end - group.start) / 60000,
        column: 0,
        columns: 1,
      },
    ];
  });
};

/** The hours the grid shows: 8 to 19, stretched to fit earlier or later items */
export const gridHours = <T extends Timed>(
  items: readonly T[],
  zone: Zone | string,
  first = 8,
  last = 19,
) => {
  let from = first;
  let to = last;
  for (const item of items) {
    if (item.allDay) continue;
    const start = DateTime.fromMillis(item.start, { zone });
    const end = DateTime.fromMillis(item.end, { zone });
    from = Math.min(from, start.hour);
    // An item that ends past midnight still ends in its own day's grid
    const endHour = end.hasSame(start, 'day')
      ? end.hour + (end.minute > 0 ? 1 : 0)
      : 24;
    to = Math.max(to, endHour);
  }
  return { from, to };
};
