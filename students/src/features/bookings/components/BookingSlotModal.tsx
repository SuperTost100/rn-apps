import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import {
  APP_TIMEZONE,
  getHtmlTextContent,
  setTimeoutAccessibilityInfoHelper,
  usePreferencesContext,
} from '@polito/lib/core';
import { ModalContent, StateBlock, Theme, useStylesheet } from '@polito/lib/ui';

import { DateTime } from 'luxon';

import { AppPreferences } from '../../../core/types/preferences';
import {
  formatBookingTime,
  isSlotBookable,
  isSlotFull,
} from '../../../utils/bookings';
import { BookingCalendarEvent } from '../screens/BookingSlotScreen';
import { BookingFacts } from './BookingFacts';
import { BookingSeatsCta } from './BookingSeatsCta';

type Props = {
  close: () => void;
  item: BookingCalendarEvent;
  topicId: string;
  /** What is being booked, as the topic list names it */
  topicName?: string;
};

/**
 * The sheet that confirms a slot: what, when, where and the places left,
 * then Confirm booking and Cancel. A slot that can't be booked says why.
 */
export const BookingSlotModal = ({ close, item, topicName }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { language } = usePreferencesContext<AppPreferences>();
  const now = DateTime.now().setZone(APP_TIMEZONE);

  const canBeBooked = isSlotBookable(item) && !!item.id;
  const isFull = isSlotFull(item);
  const opensAt = item.bookingStartsAt
    ? DateTime.fromJSDate(item.bookingStartsAt, { zone: APP_TIMEZONE })
    : undefined;
  const notYetOpen = !!opensAt && opensAt > now;
  const closesAt = item.bookingEndsAt
    ? DateTime.fromJSDate(item.bookingEndsAt, { zone: APP_TIMEZONE })
    : undefined;
  const isOpen = !!opensAt && !!closesAt && opensAt <= now && now < closesAt;

  // Why the slot can't be booked, in the order the server decides it
  const reason = useMemo(() => {
    if (canBeBooked) return undefined;
    if (isOpen && !isFull && item.feedback) return item.feedback;
    if (isFull) return t('bookings.slotFull');
    if (notYetOpen && opensAt) {
      const format =
        opensAt.hour === 0 && opensAt.minute === 0
          ? 'ccc d LLL yyyy'
          : 'ccc d LLL yyyy, HH:mm';
      return t('bookings.slotOpensOn', {
        date: opensAt.setLocale(language).toFormat(format),
      });
    }
    return t('bookings.slotClosed');
  }, [
    canBeBooked,
    isOpen,
    isFull,
    item.feedback,
    notYetOpen,
    opensAt,
    language,
    t,
  ]);

  useEffect(() => {
    if (reason) setTimeoutAccessibilityInfoHelper(reason, 500);
  }, [reason]);

  if (reason) {
    return (
      <ModalContent close={close} title={t('bookings.slotUnavailableTitle')}>
        <StateBlock title={reason} showIcon={false} />
      </ModalContent>
    );
  }

  const day = item.start.setLocale(language).toFormat('ccc d LLL yyyy');
  const where = [item.location?.name, item.location?.description]
    .map(part => part?.trim())
    .filter(Boolean)
    .join(', ');
  const what = getHtmlTextContent(topicName || item.description || '').trim();
  const left = Math.max(0, item.places - item.bookedPlaces);

  return (
    <ModalContent close={close} title={t('bookings.confirmTitle')}>
      <BookingFacts
        style={styles.facts}
        facts={[
          ...(what ? [{ label: t('bookings.what'), value: what }] : []),
          {
            label: t('bookings.when'),
            value: `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${formatBookingTime(item.start)} - ${formatBookingTime(item.end)}`,
          },
          ...(where ? [{ label: t('bookings.where'), value: where }] : []),
          {
            label: t('bookings.placesLeft'),
            value: t('bookings.placesOf', {
              left,
              total: item.places,
            }),
          },
        ]}
      />
      <BookingSeatsCta
        slotId={item.id.toString()}
        startsAt={item.start}
        hasSeatSelection={item.hasSeatSelection}
        modal={true}
        onCloseModal={close}
      />
    </ModalContent>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    facts: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
    },
  });
