import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import {
  APP_TIMEZONE,
  SCREEN_WIDTH,
  useOfflineDisabled,
} from '@polito/lib/core';
import {
  Col,
  CtaButton,
  CtaButtonContainer,
  Row,
  Theme,
  faSeat,
  useStylesheet,
} from '@polito/lib/ui';
import { Booking } from '@polito/student-api-client';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { isEmpty } from 'lodash';
import { DateTime } from 'luxon';

import {
  useGetBookingSeats,
  useGetBookings,
} from '../../../core/queries/bookingHooks';
import { canBeCancelled } from '../../../utils/bookings';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { BookingDeskCell } from '../components/BookingDeskCell';
import { BookingField } from '../components/BookingField';
import { BookingSeatCell } from '../components/BookingSeatCell';
import { useCalculateSeatsDimension } from '../hooks/useCalculateSeatsDimension';
import { useCancelBooking } from '../hooks/useCancelBooking';

type Props = NativeStackScreenProps<ServiceStackParamList, 'BookingSeat'>;

export const BookingSeatScreen = ({ route, navigation }: Props) => {
  const { t } = useTranslation();
  const { topicId, slotId, seatId, bookingId } = route.params;
  const bookingSeatsQuery = useGetBookingSeats(topicId, slotId);
  const styles = useStylesheet(createStyles);
  const [viewHeight, setViewHeight] = useState<number | undefined>();
  const bookingsQuery = useGetBookings();
  const headerHeight = useHeaderHeight();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const booking = bookingsQuery.data?.find((e: Booking) => e.id === bookingId);
  // Back past the booking page too: the booking is gone
  const { cancel, isPending } = useCancelBooking(bookingId, () =>
    navigation.pop(2),
  );
  const isDisabled = useOfflineDisabled();
  const { seatSize, gap } = useCalculateSeatsDimension(
    bookingSeatsQuery.data,
    viewHeight,
  );

  const timeOptions = {
    zone: APP_TIMEZONE,
  };

  const bookingStartAtTime =
    booking?.startsAt &&
    DateTime.fromJSDate(booking?.startsAt, timeOptions).toFormat('HH:mm');
  const bookingEndsAtTime =
    booking?.endsAt &&
    DateTime.fromJSDate(booking?.endsAt, timeOptions).toFormat('HH:mm');
  const bookingDay =
    booking?.startsAt &&
    DateTime.fromJSDate(booking?.endsAt, timeOptions).toFormat('d MMMM');

  const cancelEnabled = useMemo(() => canBeCancelled(booking), [booking]);

  return (
    <View
      style={StyleSheet.compose(styles.screenWrapper, {
        marginTop: Platform.select({
          ios: headerHeight,
          android: 0,
        }),
      })}
    >
      <View
        style={StyleSheet.compose(styles.zoomableViewContainer, {
          height: viewHeight,
        })}
        onLayout={e => setViewHeight(Math.round(e.nativeEvent.layout.height))}
      >
        <ReactNativeZoomableView
          accessible={true}
          contentWidth={SCREEN_WIDTH}
          contentHeight={viewHeight}
          bindToBorders={true}
          disablePanOnInitialZoom
          maxZoom={2}
          minZoom={1}
        >
          <Col
            align="flex-start"
            justify="flex-start"
            style={StyleSheet.compose(styles.rowsContainer, {
              height: viewHeight,
              gap,
            })}
          >
            {!isEmpty(bookingSeatsQuery.data?.rows) && (
              <Row
                align="center"
                justify="center"
                key="desk"
                style={{ width: SCREEN_WIDTH, gap }}
              >
                <BookingDeskCell seatSize={seatSize} />
              </Row>
            )}
            {bookingSeatsQuery.data?.rows?.map((row, index) => (
              <Row align="center" key={`row-${index}`} style={{ gap }}>
                {row?.seats?.map(seatCell => (
                  <BookingSeatCell
                    seat={seatCell}
                    size={seatSize}
                    isSelected={seatId === seatCell.id}
                    key={seatCell.id}
                  />
                ))}
              </Row>
            ))}
          </Col>
        </ReactNativeZoomableView>
      </View>
      <CtaButtonContainer
        absolute={false}
        style={[styles.ctaButtonContainer, { bottom: bottomTabBarHeight }]}
      >
        <Row gap={2} style={styles.recapContainer}>
          <BookingField
            icon={faSeat}
            label={t('common.seat')}
            value={
              booking?.seat
                ? `${booking.seat.row}${booking.seat.column}`
                : undefined
            }
            emptyText={t('bookingSeatScreen.noSeatSelected')}
          />
          <BookingField
            icon={faClock}
            label={t('common.hour')}
            value={`${bookingStartAtTime} - ${bookingEndsAtTime}`}
          />
          <BookingField
            icon={faCalendar}
            value={bookingDay}
            label={t('common.day')}
          />
        </Row>
        {cancelEnabled && (
          <CtaButton
            title={t('bookingScreen.cancelBooking')}
            action={cancel}
            loading={isPending}
            absolute={false}
            disabled={isDisabled || isPending}
            destructive={true}
          />
        )}
      </CtaButtonContainer>
    </View>
  );
};

const createStyles = ({ spacing, colors }: Theme) =>
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    zoomableViewContainer: {
      flex: 1,
      width: SCREEN_WIDTH,
    },
    rowsContainer: {
      padding: spacing[2],
      width: '100%',
      backgroundColor: colors.surface,
    },
    recapContainer: {
      marginHorizontal: spacing[4],
    },
    ctaButtonContainer: {
      backgroundColor: colors.surface,
      paddingBottom: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
  });
