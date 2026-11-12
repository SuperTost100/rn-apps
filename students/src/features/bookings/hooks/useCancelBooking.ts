import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useFeedbackContext } from '@polito/lib/core';
import { Booking } from '@polito/student-api-client';
import { useQueryClient } from '@tanstack/react-query';

import {
  BOOKINGS_QUERY_KEY,
  useDeleteBooking,
} from '../../../core/queries/bookingHooks';
import { describeMutationFailure } from '../../../utils/mutationFailure';

/**
 * Cancels a booking after a confirmation dialog. On success it calls
 * onCancelled (to leave the screen) and says "Booking cancelled."; on
 * failure it gives the server's reason in an error message. When the answer
 * is lost it asks the server whether the booking is still there.
 */
export const useCancelBooking = (
  bookingId: number,
  onCancelled: () => void,
) => {
  const { t } = useTranslation();
  const { setFeedback } = useFeedbackContext();
  const client = useQueryClient();
  const mutation = useDeleteBooking(bookingId);

  const done = () => {
    onCancelled();
    setFeedback({ text: t('bookings.cancelledFeedback') });
  };

  const run = async () => {
    try {
      await mutation.mutateAsync();
      done();
    } catch (error) {
      const failure = await describeMutationFailure(error);
      if (failure.lost) {
        await client.refetchQueries({ queryKey: BOOKINGS_QUERY_KEY });
        const stillThere = client
          .getQueryData<Booking[]>(BOOKINGS_QUERY_KEY)
          ?.some(b => b.id === bookingId);
        if (stillThere === false) {
          done();
          return;
        }
      }
      setFeedback({
        isError: true,
        text: failure.message
          ? t('bookings.cancelFailedReason', {
              reason: failure.message.replace(/([^.!?])\s*$/, '$1.'),
            })
          : failure.lost
            ? t('bookings.cancelLost')
            : t('bookings.cancelFailed'),
      });
    }
  };

  const cancel = () =>
    Alert.alert(t('bookings.cancelTitle'), t('bookings.cancelText'), [
      { text: t('bookings.keepBooking'), style: 'cancel' },
      {
        text: t('bookingScreen.cancelBooking'),
        style: 'destructive',
        onPress: run,
      },
    ]);

  return { cancel, isPending: mutation.isPending };
};
