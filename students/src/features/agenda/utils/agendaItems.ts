import { TFunction } from 'i18next';

import { AgendaItem, AgendaItemType } from '../types/AgendaItem';
import { AgendaTypesFilterState } from '../types/AgendaTypesFilterState';
import { Timed } from './agendaLogic';

/** An agenda item with the times the pure logic reads */
export interface AgendaEntry extends Timed {
  item: AgendaItem;
}

/** The filter chips, in order */
export const FILTER_TYPES: AgendaItemType[] = [
  'lecture',
  'exam',
  'booking',
  'deadline',
];

/**
 * The types the agenda shows. The saved filters hold the types the student
 * picked, and none picked means all of them, as before the chips.
 */
export const shownTypes = (
  filters: AgendaTypesFilterState,
): AgendaTypesFilterState =>
  FILTER_TYPES.every(type => !filters[type])
    ? { lecture: true, exam: true, booking: true, deadline: true }
    : filters;

/**
 * The filters after a chip is pressed. All shown is saved as none picked,
 * so the saved value reads as before. The last chip shown stays on: an
 * agenda that hides everything would look empty, not filtered.
 */
export const toggleType = (
  filters: AgendaTypesFilterState,
  type: AgendaItemType,
): AgendaTypesFilterState | undefined => {
  const shown = shownTypes(filters);
  const next = { ...shown, [type]: !shown[type] };
  if (FILTER_TYPES.every(t => !next[t])) return undefined;
  if (FILTER_TYPES.every(t => next[t]))
    return { lecture: false, exam: false, booking: false, deadline: false };
  return next;
};

/** Items without a time: deadlines, and exams whose time is not set yet */
export const isAllDay = (item: AgendaItem) =>
  item.type === 'deadline' || (item.type === 'exam' && item.isTimeToBeDefined);

export const toEntry = (item: AgendaItem): AgendaEntry => {
  const start = item.start.toMillis();
  const end = item.end.isValid ? item.end.toMillis() : start;
  return { start, end: Math.max(end, start), allDay: isAllDay(item), item };
};

/** The place of an item, as its row's subtitle */
export const placeOf = (item: AgendaItem) => {
  switch (item.type) {
    case 'lecture':
      return item.place?.name;
    case 'exam':
      return item.places.map(p => p.name).join(', ') || undefined;
    case 'booking':
      return item.place;
    case 'deadline':
      return item.deadlineType;
  }
};

/** The word of the type, for items that are not lectures */
export const typeLabelOf = (item: AgendaItem, t: TFunction) =>
  item.type === 'lecture' ? undefined : t(`agendaScreen.types.${item.type}`);

/** A short name for a grid block: the first word and a numeral after it */
export const shortTitle = (title: string) => {
  const words = title.split(/[\s:,-]+/).filter(Boolean);
  if (words.length <= 1) return title;
  const numeral = words.find(
    (w, i) => i > 0 && /^(I{1,3}|IV|V|VI{0,3}|\d+)$/.test(w),
  );
  return numeral ? `${words[0]} ${numeral}` : words[0];
};
