import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';

import { useFeedbackContext } from '@polito/lib/core';

/** What image-crop-picker rejects with when the student closes the camera */
const CAMERA_CANCELLED = 'E_PICKER_CANCELLED';
/** ... and when the camera permission is denied */
const CAMERA_DENIED = 'E_NO_CAMERA_PERMISSION';

const codeOf = (e: unknown) =>
  typeof e === 'object' && e && 'code' in e
    ? String((e as { code: unknown }).code)
    : undefined;

/**
 * What a failed camera opening tells the student: nothing when they closed
 * it, the way to the settings when the permission is off, and a message for
 * anything else
 */
export const useCameraErrorHandler = () => {
  const { t } = useTranslation();
  const { setFeedback } = useFeedbackContext();
  return useCallback(
    (e: unknown) => {
      const code = codeOf(e);
      if (code === CAMERA_CANCELLED) return;
      if (code === CAMERA_DENIED) {
        Alert.alert(
          t('course.upload.cameraDeniedTitle'),
          t('course.upload.cameraDeniedText'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('course.upload.openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }
      console.error(e);
      setFeedback({ text: t('course.upload.cameraFailed'), isError: true });
    },
    [t, setFeedback],
  );
};
