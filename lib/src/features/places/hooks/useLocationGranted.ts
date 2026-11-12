import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { PERMISSIONS, RESULTS, check } from 'react-native-permissions';

const LOCATION = Platform.select({
  ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
});

/**
 * Whether the app may read the location, checked without asking. It is
 * checked again whenever the app becomes active, which is also when the
 * system permission prompt closes.
 */
export const useLocationGranted = () => {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!LOCATION) return;
    let mounted = true;
    const refresh = () => {
      check(LOCATION)
        .then(status => {
          if (mounted) {
            setGranted(
              status === RESULTS.GRANTED || status === RESULTS.LIMITED,
            );
          }
        })
        .catch(() => {});
    };
    refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return granted;
};
