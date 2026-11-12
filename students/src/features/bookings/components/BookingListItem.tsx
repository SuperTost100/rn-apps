import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { getHtmlTextContent, usePreferencesContext } from '@polito/lib/core';
import {
  ListItem,
  OutlineIcon,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { Booking } from '@polito/student-api-client';

import { AppPreferences } from '../../../core/types/preferences';
import {
  formatBookingDay,
  formatBookingTime,
  getBookingIconName,
} from '../../../utils/bookings';

interface Props {
  booking: Booking;
  /** Just booked: the row is highlighted */
  selected?: boolean;
}

/**
 * A booking in the list: a neutral tile by kind, the topic, the day and
 * time, and the place on a second line
 */
export const BookingListItem = ({ booking, selected }: Props) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();

  const title = getHtmlTextContent(booking.topic?.title ?? '');
  const day = formatBookingDay(booking.startsAt, language);
  const start = formatBookingTime(booking.startsAt);
  const end = formatBookingTime(booking.endsAt);
  const seat = booking.seat
    ? t('bookings.seatLabel', {
        seat: `${booking.seat.row}${booking.seat.column}`,
      })
    : undefined;
  const place = [booking.location?.name, seat].filter(Boolean).join(', ');

  return (
    <ListItem
      title={title}
      selected={selected}
      leadingItem={
        <View style={styles.tile}>
          <OutlineIcon
            name={getBookingIconName(booking)}
            size={20}
            color={colors.neutralChipText}
          />
        </View>
      }
      subtitle={
        <View>
          <Text variant="secondaryText" style={styles.number}>
            {`${day}, ${start} - ${end}`}
          </Text>
          {!!place && <Text variant="secondaryText">{place}</Text>}
        </View>
      }
      linkTo={{ screen: 'Booking', params: { id: booking.id } }}
      accessibilityLabel={[
        title,
        t('bookings.whenLabel', { day, start, end }),
        place,
      ]
        .filter(Boolean)
        .join(', ')}
    />
  );
};

const createStyles = ({ colors, controls, shapes }: Theme) =>
  StyleSheet.create({
    tile: {
      width: controls.courseTileSize,
      height: controls.courseTileSize,
      borderRadius: shapes.md,
      backgroundColor: colors.neutralChipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    number: {
      fontVariant: ['tabular-nums'],
    },
  });
