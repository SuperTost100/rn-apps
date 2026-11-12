import { useCallback, useMemo } from 'react';

import { useQuietQueryErrors } from '@polito/lib/core';
import {
  CourseModuleEdition,
  MessageType,
  Notification,
} from '@polito/student-api-client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { get, has, setWith } from 'lodash';

import { CourseTabsParamList } from '../../features/courses/navigation/CourseNavigator';
import { notificationCourseId } from '../../features/inbox/inboxItems';
import { useGetNotifications } from '../queries/studentHooks';
import { RootParamList } from '../types/navigation';
import {
  PushNotificationPayload,
  RemoteMessage,
  UnreadNotificationsByScope,
} from '../types/notifications';
import { useMarkAsRead } from './useMarkAsRead';
import { useMfaChallengeHandler } from './useMfaChallengeHandler';

const CourseTransactionId = {
  avvisidoc: 'avvisidoc',
  videolezioni: 'videolezioni',
  virtualclassroom: 'virtualclassroom',
  matdid: 'matdid',
} as const;

type CourseTransactionId =
  (typeof CourseTransactionId)[keyof typeof CourseTransactionId];

const TransactionId = {
  ...MessageType,
  ...CourseTransactionId,
  ticket: 'ticket',
  booking: 'booking',
  avvisi: 'avvisi',
} as const;

type TransactionId = (typeof TransactionId)[keyof typeof TransactionId];

const courseTransactionsMapping: Record<
  CourseTransactionId,
  {
    section: 'notices' | 'lectures' | 'files';
    screen: keyof CourseTabsParamList;
  }
> = {
  avvisidoc: { section: 'notices', screen: 'CourseNoticesScreen' },
  videolezioni: { section: 'lectures', screen: 'CourseLecturesScreen' },
  virtualclassroom: { section: 'lectures', screen: 'CourseLecturesScreen' },
  matdid: { section: 'files', screen: 'CourseFilesScreen' },
};

const useUnreadNotificationsByScope = () => {
  const notificationsQuery = useGetNotifications();
  const { data: notifications } = notificationsQuery;
  // Badges: a failed load leaves them as they were, with nothing to say
  useQuietQueryErrors(notificationsQuery);
  const unreadByScope = useMemo(
    () =>
      (notifications?.data
        ?.filter(n => !n.isRead)
        ?.reduce((byScope, notif) => {
          if (notif.scope) {
            const existingNotifications = get(byScope, notif.scope);
            setWith(
              byScope,
              notif.scope,
              // Important to avoid picking up objects with numeric keys
              (Array.isArray(existingNotifications)
                ? existingNotifications
                : []
              ).concat(notif),
              Object,
            );
          }
          return byScope;
        }, {}) ?? {}) as UnreadNotificationsByScope,
    [notifications?.data],
  );
  const unread = useMemo(
    () => notifications?.data?.filter(n => !n.isRead) ?? [],
    [notifications?.data],
  );
  return { byScope: unreadByScope, unread };
};

const extractSubtreeNotifications = (root: any) => {
  const notifications: Notification[] = [];
  const exploreNode = (node: any) => {
    if (Array.isArray(node)) {
      notifications.push(...(node as any[]));
    } else if (typeof node === 'object') {
      Object.values(node).forEach(exploreNode);
    }
  };
  exploreNode(root);
  return notifications;
};

type PathExtractor<T, Paths extends readonly unknown[] = readonly []> =
  T extends Array<Notification>
    ? Paths
    : T extends object
      ?
          | Paths
          | {
              [K in keyof T]: PathExtractor<T[K], readonly [...Paths, K]>;
            }[keyof T]
      : Paths;

export const useNotifications = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { byScope: unreadNotifications, unread } =
    useUnreadNotificationsByScope();
  const markAsRead = useMarkAsRead();

  const clearNotificationScope = useCallback(
    (notificationScope: PathExtractor<UnreadNotificationsByScope>) => {
      if (!has(unreadNotifications, notificationScope!)) {
        return;
      }
      const notificationsToClear = extractSubtreeNotifications(
        get(unreadNotifications, notificationScope!),
      );

      if (
        !Array.isArray(notificationsToClear) ||
        !notificationsToClear.length
        // BEWARE! Promise.all([]) is like Promise.resolve()!
      ) {
        return;
      }

      // Sent once per notification in a session, so a screen whose effect
      // runs again when the list refreshes does not send it again
      return markAsRead.notifications(notificationsToClear.map(n => n.id));
    },
    [markAsRead, unreadNotifications],
  );

  const getUnreadsCount = useCallback(
    (
      path: PathExtractor<UnreadNotificationsByScope>,
      /**
       * Only count direct children
       */
      summarize = false,
    ) => {
      const root = get(unreadNotifications, path!);
      const visitNode = (node: object | Notification[]): number => {
        if (Array.isArray(node)) {
          return node.length ?? 0;
        }
        if (summarize) {
          return Object.keys(node ?? {}).length ?? 0;
        }
        return Object.values(node ?? {}).reduce(
          (acc, val) => acc + visitNode(val),
          0,
        );
      };
      return visitNode(root) || undefined;
    },
    [unreadNotifications],
  );

  // Read from each scope the way the inbox reads it, whatever the scope's
  // depth, so a course's badge and its rows in the inbox agree
  const getUnreadsCountPerCourse = useCallback(
    (courseId?: number | null, prevEditions?: CourseModuleEdition[]) => {
      if (courseId === undefined || !prevEditions) return 0;
      const courseIds = prevEditions.map(e => Number(e.id));
      if (courseId) {
        courseIds.push(courseId);
      }
      return (
        unread.filter(n => {
          const id = notificationCourseId(n);
          return id !== undefined && courseIds.includes(id);
        }).length || undefined
      );
    },
    [unread],
  );

  const { refetch: refetchMfaChallenge } = useMfaChallengeHandler();

  const navigateToUpdate = useCallback(
    (notification?: RemoteMessage) => {
      if (!notification || !notification.data?.polito_transaction) {
        return;
      }
      let payload: PushNotificationPayload | null = null;
      try {
        payload = JSON.parse(
          notification.data?.payload ?? 'null',
        ) as PushNotificationPayload | null;
      } catch {
        // A malformed payload only means there is no detail screen to open.
      }
      const transaction = notification.data.polito_transaction as TransactionId;
      // Course
      const mapping =
        courseTransactionsMapping[transaction as CourseTransactionId];
      if (mapping) {
        if (payload?.inc) {
          navigation.navigate('TeachingTab', {
            screen: 'Course',
            params: {
              id: payload.inc,
              screen: mapping.screen,
            },
            initial: false,
          });
        }
      }
      // Tickets
      if (transaction === TransactionId.ticket && payload?.idTicket) {
        navigation.navigate('ServicesTab', {
          screen: 'Ticket',
          params: {
            id: payload.idTicket,
          },
          initial: false,
        });
      }
      // News
      if (
        transaction === TransactionId.avvisi &&
        payload?.origine !== 'personali' &&
        payload?.idAvviso
      ) {
        navigation.navigate('ServicesTab', {
          screen: 'NewsItem',
          params: {
            id: payload.idAvviso,
          },
          initial: false,
        });
      }

      if (transaction === TransactionId.Mfa) {
        refetchMfaChallenge().catch(console.error);
      }
    },
    [navigation, refetchMfaChallenge],
  );

  return {
    navigateToUpdate,
    clearNotificationScope,
    getUnreadsCount,
    getUnreadsCountPerCourse,
  };
};
