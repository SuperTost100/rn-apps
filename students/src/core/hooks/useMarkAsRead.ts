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
 * Read calls by `n<id>`, `m<id>` or `t<id>`: in flight, and answered in this
 * session. When the server still reports an item unread after answering,
 * screens that mark items read by themselves do not send the call again on
 * the next render (the loop of hundreds of identical
 * PUT /notifications/{id}/read). A tap or "Mark all as read" sends it again
 * (`force`), once. A failed call can always be sent again.
 */
const pending = new Set<string>();
const done = new Set<string>();

const once = (key: string, call: () => Promise<unknown>, force = false) => {
  if (pending.has(key) || (!force && done.has(key))) return null;
  pending.add(key);
  return call().then(
    () => {
      pending.delete(key);
      done.add(key);
      return true;
    },
    () => {
      pending.delete(key);
      return false;
    },
  );
};

export interface MarkAsReadOptions {
  /** Refresh the list afterwards. False when the caller does it once for a batch */
  refresh?: boolean;
  /** Send the call even if it was answered earlier in the session: a tap */
  force?: boolean;
}

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
 * with the cached lists updated at once so badges and rows change before the
 * server answers. Each function resolves to false when a request failed.
 */
export const useMarkAsRead = () => {
  const client = useQueryClient();

  return useMemo(() => {
    const notifications = async (
      ids: number[],
      { refresh = true, force = false }: MarkAsReadOptions = {},
    ) => {
      const calls = ids
        .map(id =>
          once(
            `n${id}`,
            () =>
              new StudentApi().markNotificationAsRead({ notificationId: id }),
            force,
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

    const message = async (
      messageId: number,
      { refresh = true, force = false }: MarkAsReadOptions = {},
    ) => {
      const call = once(
        `m${messageId}`,
        () => new StudentApi().markMessageAsRead({ messageId }),
        force,
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

    const ticket = async (
      ticketId: number,
      { force = false }: MarkAsReadOptions = {},
    ) => {
      const call = once(
        `t${ticketId}`,
        () => new TicketsApi().markTicketAsRead({ ticketId }),
        force,
      );
      if (!call) return true;
      setTicketRead(client, ticketId);
      return call;
    };

    return { notifications, message, ticket };
  }, [client]);
};
