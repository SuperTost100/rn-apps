/**
 * The inbox as plain data: notification records, messages and tickets merged
 * into one list, newest first. No React and no app imports, so the logic runs
 * in node against fixtures.
 */
import type {
  Message,
  Notification,
  TicketOverview,
} from '@polito/student-api-client';

import { DateTime } from 'luxon';

export type InboxKind =
  | 'announcement'
  | 'files'
  | 'lecture'
  | 'message'
  | 'ticket'
  | 'news'
  | 'other';

export type InboxCategory = 'courses' | 'university' | 'tickets';

export type InboxFilter = 'all' | InboxCategory;

export const INBOX_FILTERS: InboxFilter[] = [
  'all',
  'courses',
  'university',
  'tickets',
];

/** Fixed sender names, translated by the screen */
export type InboxSenderLabel =
  | 'studentOffice'
  | 'university'
  | 'news'
  | 'course'
  | 'teacher'
  | 'emergency'
  | 'event'
  | 'secretariat'
  | 'exams'
  | 'personal';

export type InboxTarget =
  | {
      type: 'course';
      courseId: number;
      tab?: 'notices' | 'files' | 'lectures';
    }
  | { type: 'ticket'; ticketId: number }
  | { type: 'message'; messageId: number }
  | { type: 'news'; newsId: number }
  | { type: 'none' };

export interface InboxItem {
  key: string;
  kind: InboxKind;
  category: InboxCategory;
  title: string;
  /** A real name: the course's or the teacher's */
  senderName?: string;
  /** Used when there is no name */
  senderLabel?: InboxSenderLabel;
  /** For course items: the course id in the scope, to find its colour and icon */
  courseId?: number;
  /** The course's key in the course preferences (colour, icon) */
  courseShortcode?: string;
  /** For messages: their type, which names the row's kind */
  messageType?: Message['type'];
  sentAt: number;
  unread: boolean;
  urgent: boolean;
  target: InboxTarget;
  /** What marks the item read on the server */
  read: {
    notificationIds: number[];
    unreadNotificationIds: number[];
    messageId?: number;
    ticketId?: number;
    ticketUnread?: boolean;
  };
}

export interface InboxCourseRef {
  name: string;
  /** The key of the course's colour and icon in the preferences */
  uniqueShortcode?: string;
}

export interface InboxTeacherRef {
  id: number;
  name: string;
}

export interface InboxSources {
  notifications?: Notification[];
  messages?: Message[];
  tickets?: TicketOverview[];
  /** Course, module and edition ids to the course they belong to */
  courses?: Map<number, InboxCourseRef>;
  /** Teachers whose names the app already has (from the courses list) */
  teachers?: InboxTeacherRef[];
  /** Turns HTML into plain text. Default: strips tags */
  toText?: (html: string) => string;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** A plain text version of a short HTML string */
export const stripHtml = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|li|div|h\d)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] === '#') {
        const n =
          code[1].toLowerCase() === 'x'
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : entity;
      }
      return ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, ' ')
    .trim();

const COURSE_SECTIONS: Record<
  string,
  { kind: InboxKind; tab: 'notices' | 'files' | 'lectures' }
> = {
  notices: { kind: 'announcement', tab: 'notices' },
  avvisidoc: { kind: 'announcement', tab: 'notices' },
  files: { kind: 'files', tab: 'files' },
  matdid: { kind: 'files', tab: 'files' },
  lectures: { kind: 'lecture', tab: 'lectures' },
  videolectures: { kind: 'lecture', tab: 'lectures' },
  videolezioni: { kind: 'lecture', tab: 'lectures' },
  virtualclassroom: { kind: 'lecture', tab: 'lectures' },
};

const toId = (segment: string | undefined) => {
  if (segment === undefined || !/^\d+$/.test(segment)) return undefined;
  return Number(segment);
};

export type ParsedScope =
  | {
      type: 'course';
      courseId: number;
      kind: InboxKind;
      tab?: 'notices' | 'files' | 'lectures';
    }
  | { type: 'ticket'; ticketId?: number }
  | { type: 'news'; newsId?: number }
  | { type: 'message'; messageId?: number }
  | { type: 'unknown' };

/**
 * What a notification's scope points to. The real depth of scopes is not
 * documented, so this accepts `['teaching', 'courses', id, 'notices', noticeId]`
 * as well as `['courses', id, 'notices']`, and anything it cannot read is
 * `unknown` instead of an error.
 */
export const parseScope = (scope: unknown): ParsedScope => {
  if (!Array.isArray(scope)) return { type: 'unknown' };
  const parts = scope.map(s => String(s ?? '').trim()).filter(Boolean);
  const at = (name: string) => parts.indexOf(name);

  const courses = at('courses');
  if (courses >= 0) {
    const courseId = toId(parts[courses + 1]);
    if (courseId !== undefined) {
      const section = COURSE_SECTIONS[parts[courses + 2]?.toLowerCase()];
      return section
        ? { type: 'course', courseId, kind: section.kind, tab: section.tab }
        : { type: 'course', courseId, kind: 'other' };
    }
  }
  const tickets = at('tickets');
  if (tickets >= 0)
    return { type: 'ticket', ticketId: toId(parts[tickets + 1]) };
  const news = at('news');
  if (news >= 0) return { type: 'news', newsId: toId(parts[news + 1]) };
  const messages = at('messages');
  if (messages >= 0) {
    return { type: 'message', messageId: toId(parts[messages + 1]) };
  }
  return { type: 'unknown' };
};

/** The course id a notification belongs to, if its scope names one */
export const notificationCourseId = (n: Pick<Notification, 'scope'>) => {
  const parsed = parseScope(n.scope);
  return parsed.type === 'course' ? parsed.courseId : undefined;
};

const MESSAGE_CATEGORY: Record<string, InboxCategory> = {
  teacher: 'courses',
  personal: 'tickets',
};

const MESSAGE_SENDER: Record<string, InboxSenderLabel> = {
  teacher: 'teacher',
  secretariat: 'secretariat',
  exams: 'exams',
  personal: 'personal',
  emergency: 'emergency',
  event: 'event',
};

const time = (d: Date | string | undefined | null) => {
  const ms = d instanceof Date ? d.getTime() : d ? Date.parse(d) : NaN;
  return Number.isFinite(ms) ? ms : 0;
};

/**
 * Merges the sources into one list, newest first:
 * - every notification record (read or not), by what its scope points to;
 * - every message except MFA ones, urgent when the type is `emergency`;
 * - one row per ticket with unread replies, merged with the ticket's
 *   notifications so one reply is never listed twice;
 * - a notification about a message that is in the list joins that message.
 */
export const buildInboxItems = ({
  notifications = [],
  messages = [],
  tickets = [],
  courses = new Map(),
  teachers = [],
  toText = stripHtml,
}: InboxSources): InboxItem[] => {
  const items: InboxItem[] = [];
  const ticketsById = new Map(tickets.map(t => [t.id, t]));
  const ticketItems = new Map<number, InboxItem>();
  const messageItems = new Map<number, InboxItem>();
  const text = (s: string | null | undefined) => (s ? toText(s).trim() : '');

  for (const m of messages) {
    if (!m || m.type === 'mfa') continue;
    const urgent = m.type === 'emergency';
    const teacher =
      m.type === 'teacher' && m.senderId
        ? teachers.find(p => p.id === m.senderId)
        : undefined;
    const item: InboxItem = {
      key: `m${m.id}`,
      kind: 'message',
      category: MESSAGE_CATEGORY[m.type] ?? 'university',
      title: text(m.title) || text(m.message),
      senderName: teacher?.name,
      senderLabel: MESSAGE_SENDER[m.type] ?? 'university',
      messageType: m.type,
      sentAt: time(m.sentAt),
      unread: !m.isRead,
      urgent,
      target: { type: 'message', messageId: m.id },
      read: { notificationIds: [], unreadNotificationIds: [], messageId: m.id },
    };
    messageItems.set(m.id, item);
    items.push(item);
  }

  const ticketItem = (t: TicketOverview): InboxItem => ({
    key: `t${t.id}`,
    kind: 'ticket',
    category: 'tickets',
    title: text(t.subject),
    senderLabel: 'studentOffice',
    sentAt: time(t.updatedAt),
    unread: t.unreadCount > 0,
    urgent: false,
    target: { type: 'ticket', ticketId: t.id },
    read: {
      notificationIds: [],
      unreadNotificationIds: [],
      ticketId: t.id,
      ticketUnread: t.unreadCount > 0,
    },
  });

  const attach = (item: InboxItem, n: Notification) => {
    item.read.notificationIds.push(n.id);
    if (!n.isRead) {
      item.read.unreadNotificationIds.push(n.id);
      item.unread = true;
    }
    item.sentAt = Math.max(item.sentAt, time(n.sentAt));
  };

  for (const n of notifications) {
    if (!n || typeof n.id !== 'number') continue;
    const parsed = parseScope(n.scope);
    const title = text(n.message) || text(n.title);
    const base = {
      title,
      sentAt: time(n.sentAt),
      unread: !n.isRead,
      urgent: false,
      read: {
        notificationIds: [n.id],
        unreadNotificationIds: n.isRead ? [] : [n.id],
      },
    };

    if (parsed.type === 'ticket' && parsed.ticketId !== undefined) {
      const existing = ticketItems.get(parsed.ticketId);
      if (existing) {
        attach(existing, n);
        continue;
      }
      const ticket = ticketsById.get(parsed.ticketId);
      const item: InboxItem = ticket
        ? ticketItem(ticket)
        : {
            ...base,
            key: `t${parsed.ticketId}`,
            kind: 'ticket',
            category: 'tickets',
            senderLabel: 'studentOffice',
            target: { type: 'ticket', ticketId: parsed.ticketId },
            read: {
              notificationIds: [],
              unreadNotificationIds: [],
              ticketId: parsed.ticketId,
            },
          };
      attach(item, n);
      ticketItems.set(parsed.ticketId, item);
      items.push(item);
      continue;
    }

    if (parsed.type === 'message' && parsed.messageId !== undefined) {
      const message = messageItems.get(parsed.messageId);
      if (message) {
        attach(message, n);
        // The message's own read flag decides: the notification only
        // says that it arrived
        message.unread = !messages.find(m => m.id === parsed.messageId)?.isRead;
        continue;
      }
    }

    if (parsed.type === 'course') {
      const course = courses.get(parsed.courseId);
      items.push({
        ...base,
        key: `n${n.id}`,
        kind: parsed.kind,
        category: 'courses',
        senderName: course?.name,
        senderLabel: 'course',
        courseId: parsed.courseId,
        courseShortcode: course?.uniqueShortcode,
        target: {
          type: 'course',
          courseId: parsed.courseId,
          ...(parsed.tab ? { tab: parsed.tab } : {}),
        },
      });
      continue;
    }

    if (parsed.type === 'news') {
      items.push({
        ...base,
        key: `n${n.id}`,
        kind: 'news',
        category: 'university',
        senderLabel: 'news',
        target:
          parsed.newsId !== undefined
            ? { type: 'news', newsId: parsed.newsId }
            : { type: 'none' },
      });
      continue;
    }

    // A message that is no longer in the list, a ticket without an id, or a
    // scope this version does not know: a plain notification
    items.push({
      ...base,
      key: `n${n.id}`,
      kind: parsed.type === 'message' ? 'message' : 'other',
      category: parsed.type === 'ticket' ? 'tickets' : 'university',
      senderLabel: parsed.type === 'ticket' ? 'studentOffice' : 'university',
      target: { type: 'none' },
    });
  }

  // Tickets with unread replies that no notification announced
  for (const t of tickets) {
    if (t.unreadCount > 0 && !ticketItems.has(t.id)) {
      const item = ticketItem(t);
      ticketItems.set(t.id, item);
      items.push(item);
    }
  }

  return items.sort(
    (a, b) => b.sentAt - a.sentAt || a.key.localeCompare(b.key),
  );
};

export const matchesFilter = (item: InboxItem, filter: InboxFilter) =>
  filter === 'all' || item.category === filter;

export const unreadCounts = (items: InboxItem[]) => {
  const counts: Record<InboxFilter, number> = {
    all: 0,
    courses: 0,
    university: 0,
    tickets: 0,
  };
  for (const item of items) {
    if (!item.unread) continue;
    counts.all += 1;
    counts[item.category] += 1;
  }
  return counts;
};

/** Unread items of the given courses (a course, its modules or editions) */
export const unreadForCourses = (items: InboxItem[], courseIds: number[]) =>
  items.filter(
    i => i.unread && i.courseId !== undefined && courseIds.includes(i.courseId),
  ).length;

export type InboxGroupId =
  | 'pinned'
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'older';

export interface InboxGroup {
  id: InboxGroupId;
  items: InboxItem[];
}

/**
 * Pinned unread urgent messages first, then Today, Yesterday, Earlier this
 * week (from Monday) and Older, by the calendar in the given time zone
 */
export const groupInboxItems = (
  items: InboxItem[],
  now: number,
  zone = 'Europe/Rome',
): InboxGroup[] => {
  const today = DateTime.fromMillis(now, { zone }).startOf('day');
  const yesterday = today.minus({ days: 1 });
  const monday = today.startOf('week');
  const groups: Record<InboxGroupId, InboxItem[]> = {
    pinned: [],
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };
  for (const item of items) {
    if (item.urgent && item.unread) {
      groups.pinned.push(item);
      continue;
    }
    const day = DateTime.fromMillis(item.sentAt, { zone }).startOf('day');
    if (day >= today) groups.today.push(item);
    else if (day >= yesterday) groups.yesterday.push(item);
    else if (day >= monday) groups.thisWeek.push(item);
    else groups.older.push(item);
  }
  return (Object.keys(groups) as InboxGroupId[])
    .filter(id => groups[id].length)
    .map(id => ({ id, items: groups[id] }));
};

/** The id of every course, module and past edition, to the course it is */
export const buildCourseLookup = (
  courses: {
    id: number | null;
    name: string;
    uniqueShortcode?: string;
    shortcode?: string;
    previousEditions?: { id: number | string }[] | null;
    modules?:
      | {
          id: number | null;
          name: string;
          previousEditions?: { id: number | string }[] | null;
        }[]
      | null;
  }[],
) => {
  const lookup = new Map<number, InboxCourseRef>();
  const add = (id: number | string | null | undefined, ref: InboxCourseRef) => {
    const n = Number(id);
    if (id !== null && id !== undefined && Number.isFinite(n) && !lookup.has(n))
      lookup.set(n, ref);
  };
  for (const c of courses) {
    const ref = { name: c.name, uniqueShortcode: c.uniqueShortcode };
    add(c.id, ref);
    c.previousEditions?.forEach(e => add(e.id, ref));
    c.modules?.forEach((m, index) => {
      const moduleRef = {
        name: m.name,
        uniqueShortcode: c.uniqueShortcode
          ? `${c.uniqueShortcode}${index + 1}`
          : undefined,
      };
      add(m.id, moduleRef);
      m.previousEditions?.forEach(e => add(e.id, moduleRef));
    });
  }
  return lookup;
};
