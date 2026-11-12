import { PropsWithChildren, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import {
  useFeedbackContext,
  useIsOnline,
  usePreferencesContext,
} from '@polito/lib/core';
import {
  CtaButton,
  Text,
  Theme,
  useStylesheet,
  useTextScale,
} from '@polito/lib/ui';
import { Booking } from '@polito/student-api-client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { DateTime } from 'luxon';

import { FailureNote } from '../../../core/components/FailureNote';
import {
  BOOKINGS_QUERY_KEY,
  useCreateBooking,
} from '../../../core/queries/bookingHooks';
import { AppPreferences } from '../../../core/types/preferences';
import { formatBookingDay, formatBookingTime } from '../../../utils/bookings';
import {
  MutationFailure,
  describeMutationFailure,
} from '../../../utils/mutationFailure';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';

type BookingSeatsCtaProps = PropsWithChildren<{
  seatId?: string;
  hasSeatSelection?: boolean;
  slotId: string;
  /** When the slot starts: finds the new booking and names it in the message */
  startsAt?: DateTime;
  /** In the confirmation sheet: adds Cancel, and says when offline */
  modal: boolean;
  style?: StyleProp<ViewStyle>;
  onCloseModal?: () => void;
}>;

/**
 * Confirms a slot (and a seat). On success the bookings list opens with the
 * new row highlighted and a message that names the day and time. A failure
 * is said here, with the server's reason when it gave one.
 */
export const BookingSeatsCta = ({
  seatId,
  slotId,
  startsAt,
  modal,
  children,
  hasSeatSelection,
  style,
  onCloseModal,
}: BookingSeatsCtaProps) => {
  const styles = useStylesheet(createStyles);
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();
  const { isLarge } = useTextScale();
  const isOnline = useIsOnline();
  const { setFeedback } = useFeedbackContext();
  const client = useQueryClient();
  const createBookingMutation = useCreateBooking();
  const navigation =
    useNavigation<NativeStackNavigationProp<ServiceStackParamList>>();
  const [failure, setFailure] = useState<MutationFailure>();

  // Side by side in the sheet; one under the other at large text
  const stacked = isLarge || !modal;
  const ctaEnabled = hasSeatSelection ? !!seatId : true;

  /** The booking that was not in the list before, at the slot's start */
  const findNewBooking = (before: Set<number>) => {
    const after = client.getQueryData<Booking[]>(BOOKINGS_QUERY_KEY) ?? [];
    const fresh = after.filter(b => !before.has(b.id));
    if (!startsAt) return fresh[0];
    return fresh.find(b => b.startsAt.getTime() === startsAt.toMillis());
  };

  const onBooked = (newBooking?: Booking) => {
    // The tab navigator outlives this screen, so the message's action works
    const tabs = navigation.getParent();
    onCloseModal?.();
    navigation.popTo('Bookings', { newId: newBooking?.id });
    const start = newBooking?.startsAt ?? startsAt;
    if (!start) {
      setFeedback({ text: t('bookingSeatScreen.confirmSuccess') });
      return;
    }
    const date =
      start instanceof DateTime
        ? start.toISODate()
        : DateTime.fromJSDate(start).toISODate();
    const text = t('bookings.bookedFeedback', {
      day: formatBookingDay(start, language),
      time: formatBookingTime(start),
    });
    setFeedback({
      text,
      action: tabs
        ? {
            label: t('bookings.viewInAgenda'),
            onPress: () =>
              tabs.navigate('AgendaTab', {
                screen: 'Agenda',
                params: { date, requestedAt: Date.now() },
                pop: true,
              }),
          }
        : undefined,
    });
  };

  const onConfirm = async () => {
    setFailure(undefined);
    const before = new Set(
      client.getQueryData<Booking[]>(BOOKINGS_QUERY_KEY)?.map(b => b.id),
    );
    try {
      await createBookingMutation.mutateAsync({
        seatId: seatId ? Number(seatId) : undefined,
        slotId: Number(slotId),
      });
      onBooked(findNewBooking(before));
    } catch (error) {
      const described = await describeMutationFailure(error);
      if (described.lost) {
        // The answer was lost: the booking may have been made anyway
        await client.refetchQueries({ queryKey: BOOKINGS_QUERY_KEY });
        const made = startsAt ? findNewBooking(before) : undefined;
        if (made) {
          onBooked(made);
          return;
        }
      }
      setFailure(described);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {children}
      {failure && (
        <View style={styles.note}>
          <FailureNote
            title={t('bookings.bookFailedTitle')}
            failure={failure}
            lostText={t('bookings.bookLostText')}
          />
        </View>
      )}
      {modal && !isOnline && (
        <Text variant="secondaryText" style={styles.note}>
          {t('bookings.needsConnectionNote')}
        </Text>
      )}
      <View style={[styles.buttons, stacked && styles.stacked]}>
        <CtaButton
          title={t('bookingSeatScreen.confirm')}
          variant="filled"
          absolute={false}
          action={onConfirm}
          disabled={!ctaEnabled || !isOnline}
          loading={createBookingMutation.isPending}
          containerStyle={stacked ? styles.button : styles.rowButton}
        />
        {modal && (
          <CtaButton
            title={t('common.cancel')}
            variant="outlined"
            absolute={false}
            action={() => onCloseModal?.()}
            containerStyle={stacked ? styles.button : styles.rowButton}
          />
        )}
      </View>
    </View>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing[4],
      paddingVertical: spacing[4],
    },
    note: {
      marginHorizontal: layout.gutter,
    },
    buttons: {
      flexDirection: 'row',
      gap: spacing[3],
      paddingHorizontal: layout.gutter,
    },
    stacked: {
      flexDirection: 'column',
    },
    button: {
      padding: 0,
    },
    rowButton: {
      padding: 0,
      flex: 1,
    },
  });
