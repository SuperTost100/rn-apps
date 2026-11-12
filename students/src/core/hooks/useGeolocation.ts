import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { IS_ANDROID, useFeedbackContext } from '@polito/lib/core';
import Geolocation from '@react-native-community/geolocation';

import GeoPoint from 'geopoint';

type Coordinates = {
  latitude: number;
  longitude: number;
};

/** The error codes of Geolocation.getCurrentPosition */
const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;

let isConfigured = false;

/**
 * Set on first use, not at import: the permission is asked only when the
 * user taps an action that needs the position
 */
const configure = () => {
  if (isConfigured) return;
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    enableBackgroundLocationUpdates: true,
    locationProvider: 'auto',
  });
  isConfigured = true;
};

const openLocationSettings = () => {
  if (IS_ANDROID) {
    Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(
      console.error,
    );
  } else {
    Linking.openURL('app-settings:').catch(console.error);
  }
};

const openAppSettings = () => {
  Linking.openSettings().catch(console.error);
};

const computeDistance = (a?: Coordinates, b?: Coordinates) => {
  if (!a || !b) return 0;

  const pointA = new GeoPoint(a.latitude, a.longitude);
  const pointB = new GeoPoint(b.latitude, b.longitude);

  return pointA.distanceTo(pointB, true);
};

/**
 * The phone's position, read on demand. The system asks for the permission
 * the first time getCurrentPosition runs; a denial or location turned off is
 * explained once, in a message that goes away, with a way to the settings.
 */
export const useGeolocation = () => {
  const { setFeedback } = useFeedbackContext();
  const { t } = useTranslation();

  const getCurrentPosition = useCallback(() => {
    configure();
    return new Promise<Coordinates>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          resolve({ latitude, longitude });
        },
        error => {
          if (error.code === PERMISSION_DENIED) {
            setFeedback({
              text: t('bookings.locationPermissionNeeded'),
              action: {
                label: t('common.openSettings'),
                onPress: openAppSettings,
              },
            });
          } else if (error.code === POSITION_UNAVAILABLE) {
            setFeedback({
              text: t('bookings.locationOff'),
              action: {
                label: t('common.openSettings'),
                onPress: openLocationSettings,
              },
            });
          }
          reject(error);
        },
      );
    });
  }, [t, setFeedback]);

  return {
    getCurrentPosition,
    computeDistance,
  };
};
