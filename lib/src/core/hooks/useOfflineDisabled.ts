import { useSyncExternalStore } from 'react';

import { onlineManager } from '@tanstack/react-query';

const getIsOnline = () => onlineManager.isOnline();

/** Whether the phone has a connection, as TanStack Query sees it */
export const useIsOnline = () =>
  useSyncExternalStore(onlineManager.subscribe, getIsOnline);

/**
 * True when the phone is offline and the callback says the data an action
 * needs is missing. Use it only for actions that need the network (sending,
 * booking, downloading a file that is not on the phone): rows that open saved
 * content stay enabled offline.
 */
export const useOfflineDisabled = (
  isDataMissingCallback: () => boolean = () => true,
) => {
  const isOnline = useIsOnline();

  return !isOnline && isDataMissingCallback();
};
