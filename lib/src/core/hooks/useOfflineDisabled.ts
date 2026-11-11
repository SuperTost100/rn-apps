import { useSyncExternalStore } from 'react';

import { onlineManager } from '@tanstack/react-query';

const getIsOnline = () => onlineManager.isOnline();

export const useOfflineDisabled = (
  isDataMissingCallback: () => boolean = () => true,
) => {
  const isOnline = useSyncExternalStore(onlineManager.subscribe, getIsOnline);

  return !isOnline && isDataMissingCallback();
};
