import { useMemo } from 'react';

import {
  Message,
  NotificationsGetNotifications200Response,
  StudentApi,
  Ticket,
  TicketOverview,
  TicketsApi,
} from '@polito/student-api-client';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

import {
  MESSAGES_QUERY_KEY,
  NOTIFICATIONS_QUERY_KEY,
} from '../queries/studentHooks';
import { TICKETS_QUERY_KEY, TICKET_QUERY_PREFIX } from '../queries/ticketHooks';

/**
 * Read calls already sent in this session, by `n<id>`, `m<id>` or `t<id>`.
 * A call is sent once: when the server still reports the item unread after
 * answering, the next render does not send it again (the loop of hundreds of
 * identical PUT /notifications/{id}/read). A failed call is removed, so a
 * later visit can try again.
 */
const sent = new Set<string>();

const once = (key: string, call: () => Promise<unknown>) => {
  if (sent.has(key)) return null;
  sent.add(key);
  return call().then(
    () => true,
    () => {
      sent.delete(key);
      return false;
    },
  );
};

const setNotificationsRead = (client: QueryClient, ids: Set<number>) =>
  client.setQueryData<NotificationsGetNotifications200Response>(
    NOTIFICATIONS_QUERY_KEY,
    prev =>
      prev && {
        ...prev,
        data: prev.data.map(n => (ids.has(n.id) ? { ...n, isRead: true } : n)),
      },
  );

const setTicketRead = (client: QueryClient, ticketId: number) => {
  client.setQueryData<Ticket>([TICKET_QUERY_PREFIX, ticketId], prev =>
    prev ? { ...prev, unreadCount: 0 } : prev,
  );
  client.setQueryData<TicketOverview[]>(TICKETS_QUERY_KEY, prev =>
    prev?.map(t => (t.id === ticketId ? { ...t, unreadCount: 0 } : t)),
  );
};

/**
 * Marks notifications, messages and tickets as read: one request per item,
 * never repeated in a session, with the cached lists updated at once so
 * badges and rows change before the server answers.
 * Each function resolves to false when a request failed. With `refresh`
 * false the caller refreshes the lists itself, once for a batch.
 */
export const useMarkAsRead = () => {
  const client = useQueryClient();

  return useMemo(() => {
    const notifications = async (ids: number[], refresh = true) => {
      const calls = ids
        .map(id =>
          once(`n${id}`, () =>
            new StudentApi().markNotificationAsRead({ notificationId: id }),
          ),
        )
        .filter((c): c is Promise<boolean> => !!c);
      if (!calls.length) return true;
      setNotificationsRead(client, new Set(ids));
      const results = await Promise.all(calls);
      // Refreshed once, after every call has answered
      if (refresh) {
        await client.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      }
      return results.every(Boolean);
    };

    const message = async (messageId: number, refresh = true) => {
      const call = once(`m${messageId}`, () =>
        new StudentApi().markMessageAsRead({ messageId }),
      );
      if (!call) return true;
      client.setQueryData<Message[]>(MESSAGES_QUERY_KEY, prev =>
        prev?.map(m => (m.id === messageId ? { ...m, isRead: true } : m)),
      );
      const ok = await call;
      if (refresh) {
        await client.invalidateQueries({
          queryKey: MESSAGES_QUERY_KEY,
          exact: true,
        });
      }
      return ok;
    };

    const ticket = async (ticketId: number) => {
      const call = once(`t${ticketId}`, () =>
        new TicketsApi().markTicketAsRead({ ticketId }),
      );
      if (!call) return true;
      setTicketRead(client, ticketId);
      return call;
    };

    return { notifications, message, ticket };
  }, [client]);
};
