import { useCallback, useMemo } from 'react';

import { getHtmlTextContent } from '@polito/lib/core';
import { useQueryClient } from '@tanstack/react-query';

import {
  InboxItem,
  buildCourseLookup,
  buildInboxItems,
  unreadCounts,
} from '../../features/inbox/inboxItems';
import { useGetCourses } from '../queries/courseHooks';
import {
  MESSAGES_QUERY_KEY,
  NOTIFICATIONS_QUERY_KEY,
  useGetMessages,
  useGetNotifications,
} from '../queries/studentHooks';
import { useGetTickets } from '../queries/ticketHooks';
import { useMarkAsRead } from './useMarkAsRead';

/** Read calls "Mark all as read" keeps in flight at once */
const MARK_ALL_CONCURRENCY = 3;

/**
 * The inbox: push notification records, messages and tickets with unread
 * replies in one list, newest first, with the unread counts the bell and the
 * Teaching tab show. The merge itself is in `inboxItems.ts`.
 */
export const useInbox = () => {
  const notificationsQuery = useGetNotifications();
  const messagesQuery = useGetMessages();
  const ticketsQuery = useGetTickets();
  const coursesQuery = useGetCourses();

  const courses = coursesQuery.data;
  const lookup = useMemo(() => buildCourseLookup(courses ?? []), [courses]);
  // Teacher names the courses list already carries: no request per message
  const teachers = useMemo(
    () =>
      (courses ?? []).flatMap(c =>
        c.teacherId && c.teacherName
          ? [{ id: c.teacherId, name: c.teacherName }]
          : [],
      ),
    [courses],
  );

  const items = useMemo(
    () =>
      buildInboxItems({
        notifications: notificationsQuery.data?.data,
        messages: messagesQuery.data,
        tickets: ticketsQuery.data,
        courses: lookup,
        teachers,
        toText: getHtmlTextContent,
      }),
    [
      notificationsQuery.data,
      messagesQuery.data,
      ticketsQuery.data,
      lookup,
      teachers,
    ],
  );
  const counts = useMemo(() => unreadCounts(items), [items]);

  return {
    items,
    counts,
    notificationsQuery,
    messagesQuery,
    ticketsQuery,
    coursesQuery,
  };
};

/** Marks one inbox item, or many, as read on the server */
export const useInboxActions = () => {
  const markAsRead = useMarkAsRead();
  const client = useQueryClient();

  const markItemRead = useCallback(
    async (item: InboxItem, refresh = true) => {
      const calls: Promise<boolean>[] = [];
      const { unreadNotificationIds, messageId, ticketId, ticketUnread } =
        item.read;
      if (unreadNotificationIds.length) {
        calls.push(markAsRead.notifications(unreadNotificationIds, refresh));
      }
      if (messageId !== undefined && item.unread) {
        calls.push(markAsRead.message(messageId, refresh));
      }
      if (ticketId !== undefined && ticketUnread) {
        calls.push(markAsRead.ticket(ticketId));
      }
      const results = await Promise.all(calls);
      return results.every(Boolean);
    },
    [markAsRead],
  );

  /** One item after the other, a few at a time. Resolves to how many went through */
  const markAllRead = useCallback(
    async (items: InboxItem[], onProgress?: (done: number) => void) => {
      let next = 0;
      let done = 0;
      let succeeded = 0;
      const worker = async () => {
        while (next < items.length) {
          const item = items[next++];
          if (await markItemRead(item, false)) succeeded += 1;
          onProgress?.(++done);
        }
      };
      await Promise.all(
        Array.from(
          { length: Math.min(MARK_ALL_CONCURRENCY, items.length) },
          worker,
        ),
      );
      // The lists are refreshed once for the whole batch
      await Promise.all([
        client.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
        client.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY, exact: true }),
      ]);
      return succeeded;
    },
    [client, markItemRead],
  );

  return { markItemRead, markAllRead };
};
