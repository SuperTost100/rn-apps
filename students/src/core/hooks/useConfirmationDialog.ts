import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { setTimeoutAccessibilityInfoHelper } from '@polito/lib/core';

interface Options {
  title?: string;
  message?: string;
  /** The button that confirms, e.g. "Remove files". Default: OK */
  confirmText?: string;
  /** The button that keeps things as they are. Default: Cancel */
  cancelText?: string;
}

export const useConfirmationDialog = ({
  title,
  message,
  confirmText,
  cancelText,
}: Options = {}) => {
  const { t } = useTranslation();
  return () =>
    new Promise<boolean>(resolve => {
      setTimeoutAccessibilityInfoHelper(
        t('bookingScreen.cancelBookingText'),
        500,
      );
      Alert.alert(
        title ?? t('common.areYouSure?'),
        message ?? t('common.actionPotentiallyNotUndoable'),
        confirmText
          ? [
              {
                text: cancelText ?? t('common.cancel'),
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: confirmText,
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ]
          : [
              { text: t('common.ok'), onPress: () => resolve(true) },
              {
                text: cancelText ?? t('common.cancel'),
                onPress: () => resolve(false),
              },
            ],
        { cancelable: false },
      );
    });
};
