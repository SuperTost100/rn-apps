import { Alert } from 'react-native';

import { getMessaging, getToken } from '@react-native-firebase/messaging';

import { t } from 'i18next';

import { hasPushNotifications } from '../../config/testBuild';

export async function getFcmToken(
  catchException: boolean = true,
): Promise<string | undefined> {
  // No token to ask for, and no "push setup failed" alert at login
  if (!hasPushNotifications) return undefined;
  try {
    return await getToken(getMessaging());
  } catch (e) {
    if (!catchException) {
      throw e;
    }
    console.error(e);
    Alert.alert(t('common.error'), t('loginScreen.fcmUnsupported'));
  }

  return undefined;
}
