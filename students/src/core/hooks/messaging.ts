import { useCallback, useEffect } from 'react';
import {
  RESULTS,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';

import { useUpdateAppInfo } from '@polito/lib/features/auth';
import { MessageType } from '@polito/student-api-client';
import {
  AuthorizationStatus,
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';

import {
  MESSAGES_QUERY_KEY,
  NOTIFICATIONS_QUERY_KEY,
} from '../queries/studentHooks';
import { RemoteMessage } from '../types/notifications';
import { useNotifications } from './useNotifications';

export const useInitFirebaseMessaging = () => {
  const queryClient = useQueryClient();
  const { navigateToUpdate } = useNotifications();
  const { mutate: updateAppInfo } = useUpdateAppInfo();
  const onMessageHandler = useCallback(
    (msg: FirebaseMessagingTypes.RemoteMessage) => {
      const transactionIsMessage = Object.values(MessageType).includes(
        (msg as RemoteMessage).data?.polito_transaction,
      );

      return queryClient.invalidateQueries({
        queryKey: transactionIsMessage
          ? MESSAGES_QUERY_KEY
          : NOTIFICATIONS_QUERY_KEY,
      });
    },
    [queryClient],
  );
  useEffect(() => {
    let cancelled = false;
    const unsubscribers: (() => void)[] = [];
    // The setup is async, so a listener may be added after the cleanup ran
    const addListener = (unsubscribe: () => void) => {
      if (cancelled) {
        unsubscribe();
      } else {
        unsubscribers.push(unsubscribe);
      }
    };

    (async () => {
      const messaging = getMessaging();

      addListener(onTokenRefresh(messaging, updateAppInfo));

      if ((await checkNotifications()).status !== RESULTS.GRANTED) {
        await requestNotifications();
      }

      const authorizationStatus = await requestPermission(messaging, {
        badge: true,
        alert: true,
        sound: true,
      });
      if (cancelled) return;
      if (authorizationStatus !== AuthorizationStatus.DENIED) {
        addListener(
          onNotificationOpenedApp(messaging, remoteMessage => {
            navigateToUpdate(remoteMessage as RemoteMessage);
          }),
        );

        getInitialNotification(messaging).then(remoteMessage => {
          navigateToUpdate(remoteMessage as RemoteMessage);
        });

        addListener(onMessage(messaging, onMessageHandler));

        setBackgroundMessageHandler(messaging, onMessageHandler);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribers.forEach(fn => fn());
    };
  }, [navigateToUpdate, updateAppInfo, queryClient, onMessageHandler]);
};
