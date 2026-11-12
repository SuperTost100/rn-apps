/**
 * The logic of the Today list on the Teaching screen, kept free of React so
 * it can be checked with plain node: which of today's items have ended, which
 * one is in progress, which one comes next, and what folds away at large
 * text. Times are epoch milliseconds; days are calendar days in `zone`.
 */
import { DateTime, type Zone } from 'luxon';

/** An IANA zone, by name or as luxon's Zone */
type ZoneLike = Zone | string;

export interface TimedItem {
  key: string;
  /** Epoch ms */
  start: number;
  /** Epoch ms */
  end: number;
}

export type TodayState = 'ended' | 'now' | 'next' | 'later';

export interface TodayRow<T extends TimedItem> {
  item: T;
  state: TodayState;
  /**
   * The row the list emphasises: the next one, or the one in progress when
   * nothing follows it today
   */
  isMain: boolean;
}

export interface TodayFold<T extends TimedItem> {
  /** "Later: ..." at 150%, "Also today: ..." at 200% */
  kind: 'later' | 'alsoToday';
  rows: TodayRow<T>[];
  /** When the last item of the day ends, epoch ms */
  until: number;
}

export type TodayModel<T extends TimedItem> =
  /** Nothing today */
  | { kind: 'none' }
  /** Everything today has ended */
  | { kind: 'allEnded'; ended: T[] }
  | {
      kind: 'list';
      ended: T[];
      /** The "Ended: ..." line: off at 200%, where only one row stays */
      showEnded: boolean;
      rows: TodayRow<T>[];
      fold: TodayFold<T> | null;
    };

/** The calendar day of an instant in `zone`, as yyyy-MM-dd */
export const dayKey = (ms: number, zone: ZoneLike) =>
  DateTime.fromMillis(ms, { zone }).toISODate()!;

/** Monday 00:00 of the week of `now`, in `zone` */
export const weekStart = (now: number, zone: ZoneLike) =>
  DateTime.fromMillis(now, { zone }).startOf('week');

const byTime = (a: TimedItem, b: TimedItem) =>
  a.start - b.start || a.end - b.end;

/** The items that start on the day of `now` in `zone`, in time order */
export const itemsOfDay = <T extends TimedItem>(
  items: readonly T[],
  now: number,
  zone: ZoneLike,
) => {
  const today = dayKey(now, zone);
  return items.filter(i => dayKey(i.start, zone) === today).sort(byTime);
};

/**
 * The first item on a later day than `now`'s, for "No more lectures today"
 * and days without lectures
 */
export const firstOfNextDay = <T extends TimedItem>(
  items: readonly T[],
  now: number,
  zone: ZoneLike,
): T | null => {
  const today = dayKey(now, zone);
  return (
    [...items].sort(byTime).find(i => dayKey(i.start, zone) > today) ?? null
  );
};

/** "now" is start <= now < end */
export const stateAt = (item: TimedItem, now: number): TodayState =>
  item.end <= now ? 'ended' : item.start <= now ? 'now' : 'later';

/**
 * Sorts today's items into ended, in progress, next and later, and folds
 * what does not fit the text size: at 150% only the items in progress and
 * the next one stay, at 200% only the main one
 */
export const buildToday = <T extends TimedItem>(
  todayItems: readonly T[],
  now: number,
  textPercent: number,
): TodayModel<T> => {
  if (!todayItems.length) return { kind: 'none' };
  const sorted = [...todayItems].sort(byTime);
  const ended = sorted.filter(i => stateAt(i, now) === 'ended');
  const open = sorted.filter(i => stateAt(i, now) !== 'ended');
  if (!open.length) return { kind: 'allEnded', ended };

  let nextTaken = false;
  const rows: TodayRow<T>[] = open.map(item => {
    let state = stateAt(item, now);
    if (state === 'later' && !nextTaken) {
      state = 'next';
      nextTaken = true;
    }
    return { item, state, isMain: false };
  });
  const main =
    rows.find(r => r.state === 'next') ?? rows.find(r => r.state === 'now')!;
  main.isMain = true;

  const until = Math.max(...open.map(i => i.end));
  let shown = rows;
  let fold: TodayFold<T> | null = null;
  if (textPercent >= 200) {
    shown = [main];
    const rest = rows.filter(r => r !== main);
    fold = rest.length ? { kind: 'alsoToday', rows: rest, until } : null;
  } else if (textPercent >= 150) {
    shown = rows.filter(r => r.state === 'now' || r.state === 'next');
    const rest = rows.filter(r => !shown.includes(r));
    fold = rest.length ? { kind: 'later', rows: rest, until } : null;
  }

  return {
    kind: 'list',
    ended,
    showEnded: ended.length > 0 && textPercent < 200,
    rows: shown,
    fold,
  };
};

export interface Countdown {
  /** "in 25 min" before the start, "50 min left" while in progress */
  mode: 'in' | 'left';
  hours: number;
  minutes: number;
}

/**
 * The count on the main row, in whole minutes rounded up, so it never reads
 * "in 0 min" while the item has not started
 */
export const countdown = (row: TodayRow<TimedItem>, now: number): Countdown => {
  const left = row.state === 'now';
  const total = Math.max(
    1,
    Math.ceil(((left ? row.item.end : row.item.start) - now) / 60000),
  );
  return {
    mode: left ? 'left' : 'in',
    hours: Math.floor(total / 60),
    minutes: total % 60,
  };
};

/** Milliseconds until the next minute starts, so the ticks land on :00 */
export const msToNextMinute = (now: number) => 60000 - (now % 60000);

/** The translation function, as i18next's `t` */
export type Translate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/** A time of day in `zone`, as HH:mm */
export const hhmm = (ms: number, zone: ZoneLike) =>
  DateTime.fromMillis(ms, { zone }).toFormat('HH:mm');

/** "in 25 min", "in 2 h 10 min", "50 min left" */
export const countText = (
  { mode, hours, minutes }: Countdown,
  t: Translate,
) => {
  const size = !hours ? 'Minutes' : !minutes ? 'Hours' : 'HoursMinutes';
  return t(`todayList.${mode}${size}`, { hours, minutes });
};

export interface NamedItem extends TimedItem {
  title: string;
  /** The room or place, when there is one */
  room?: string;
}

/** What a screen reader says for a row: one label, without the count */
export const rowLabel = (
  { item, state }: TodayRow<NamedItem>,
  t: Translate,
  zone: ZoneLike,
) =>
  [
    t(`todayList.${state}`),
    item.title,
    item.room,
    state === 'now'
      ? t('todayList.until', { time: hhmm(item.end, zone) })
      : t('todayList.fromTo', {
          start: hhmm(item.start, zone),
          end: hhmm(item.end, zone),
        }),
  ]
    .filter(Boolean)
    .join(', ');

/** The visible text and the label of a folded line */
export const foldText = (
  fold: TodayFold<NamedItem>,
  t: Translate,
  zone: ZoneLike,
) => {
  const names = fold.rows
    .map(r =>
      r.state === 'now'
        ? t('todayList.nowSuffix', { name: r.item.title })
        : r.item.title,
    )
    .join(', ');
  const time = hhmm(fold.until, zone);
  // "later" is also a row state: the line has keys of its own
  const key = fold.kind === 'later' ? 'laterFold' : 'alsoToday';
  return {
    text: t(`todayList.${key}`, { names, time }),
    label: t(`todayList.${key}Label`, { names, time }),
  };
};

/** The "Ended: ..." line */
export const endedText = (ended: readonly NamedItem[], t: Translate) => {
  const names = ended.map(i => i.title).join(', ');
  return {
    text: t('todayList.ended', { names }),
    label: t('todayList.endedLabel', { names }),
  };
};
