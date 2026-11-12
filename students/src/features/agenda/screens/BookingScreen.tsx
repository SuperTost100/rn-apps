import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Barcode from 'react-native-barcode-svg';

import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  useFeedbackContext,
  useOfflineDisabled,
  usePreferencesContext,
} from '@polito/lib/core';
import { useOpenInAppLink } from '@polito/lib/core';
import { resolvePlaceId } from '@polito/lib/features/places';
import {
  BottomActionBar,
  BottomBarSpacer,
  Card,
  CtaButton,
  ListItem,
  OutlineIcon,
  OverviewList,
  RefreshControl,
  Section,
  SectionHeader,
  Theme,
  isToday,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { Booking, PlaceRef } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { inRange } from 'lodash';
import { DateTime } from 'luxon';

import { useGeolocation } from '../../../core/hooks/useGeolocation';
import {
  useGetBookings,
  useUpdateBooking,
} from '../../../core/queries/bookingHooks';
import { useGetProfile } from '../../../core/queries/studentHooks';
import {
  formatBookingDay,
  formatBookingTime,
  isVirtualPlace,
} from '../../../utils/bookings';
import { useCancelBooking } from '../../bookings/hooks/useCancelBooking';
import { AgendaStackParamList } from '../components/AgendaNavigator';
import { EventHead } from '../components/EventHead';
import { placesStack } from '../utils/placesStack';

type Props = NativeStackScreenProps<AgendaStackParamList, 'Booking'>;

const bookingLocationHasValidCoordinates = (
  location: Booking['locationCheck'],
) => {
  return !!location?.latitude && !!location?.longitude && !!location.radiusInKm;
};

export const BookingScreen = ({ navigation, route }: Props) => {
  const { id } = route.params;
  const { t } = useTranslation();
  const { setFeedback } = useFeedbackContext();
  const { language } = usePreferencesContext();
  const { getCurrentPosition, computeDistance } = useGeolocation();
  const { colors, palettes } = useTheme();
  const bookingsQuery = useGetBookings();
  const { cancel: onPressDelete, isPending: isCancelling } = useCancelBooking(
    id,
    () => navigation.goBack(),
  );
  const updateBookingMutation = useUpdateBooking();
  const profileQuery = useGetProfile();
  const isDisabled = useOfflineDisabled();
  const styles = useStylesheet(createStyles);
  const openInAppLink = useOpenInAppLink();
  const booking = bookingsQuery.data?.find((e: Booking) => e.id === id);
  const title = booking?.topic?.title ?? '';
  const subTopicTitle = booking?.subtopic?.title ?? '';
  const description = booking?.description;
  // The header names the booking itself: its description, or its topic
  const screenTitle = description ? description : title;
  useEffect(() => {
    if (screenTitle) navigation.setOptions({ headerTitle: screenTitle });
  }, [screenTitle, navigation]);

  const hasCheckIn = useMemo(
    () =>
      booking?.startsAt &&
      isToday(
        DateTime.fromJSDate(booking?.startsAt, {
          zone: APP_TIMEZONE,
        }),
      ) &&
      inRange(
        Date.now(),
        booking?.startsAt.getTime(),
        booking?.endsAt.getTime(),
      ) &&
      booking?.locationCheck?.enabled &&
      bookingLocationHasValidCoordinates(booking?.locationCheck),
    [booking],
  );

  const completedCheckIn = useMemo(
    () => hasCheckIn && booking?.locationCheck?.checked,
    [booking?.locationCheck?.checked, hasCheckIn],
  );

  const canBeCancelled = useMemo(
    () =>
      !!booking?.cancelableUntil &&
      booking?.cancelableUntil.getTime() > Date.now(),
    [booking],
  );

  const onPressCheckIn = async () => {
    if (!booking?.id) return;
    getCurrentPosition()
      .catch(error => {
        // useGeolocation already says when the permission is denied (1) or
        // location services are off (2)
        if (error?.code !== 1 && error?.code !== 2)
          setFeedback({ text: t('bookingScreen.locationUnavailable') });
        return undefined;
      })
      .then(currentDeviceCoordinates => {
        if (!currentDeviceCoordinates) return;
        const computedDistance = computeDistance(currentDeviceCoordinates, {
          latitude: Number(booking?.locationCheck?.latitude),
          longitude: Number(booking?.locationCheck?.longitude),
        });
        if (computedDistance < Number(booking?.locationCheck?.radiusInKm)) {
          updateBookingMutation
            .mutateAsync({
              bookingId: booking.id,
              isLocationChecked: true,
            })
            .then(
              () => {
                setFeedback({ text: t('bookingScreen.checkInFeedback') });
                bookingsQuery.refetch();
              },
              () =>
                setFeedback({
                  text: t('bookings.checkInFailed'),
                  isError: true,
                }),
            );
        } else {
          setFeedback({ text: t('bookingScreen.checkLocationErrorFeedback') });
        }
      });
  };

  const onPressLocation = async (location: Booking['location']) => {
    if (isVirtualPlace(location)) {
      await openInAppLink((location as { url: string }).url);
    } else {
      navigation.navigate(placesStack(navigation), {
        screen: 'Place',
        params: {
          placeId: resolvePlaceId(location as PlaceRef),
          isCrossNavigation: true,
          lat: booking?.locationCheck?.latitude,
          long: booking?.locationCheck?.longitude,
          name: booking?.location?.name,
        },
      });
    }
  };

  const locationKind =
    booking && isVirtualPlace(booking.location) ? 'virtualPlace' : 'place';
  const locationAccessibilityLabel = booking
    ? [
        booking.location.name,
        t(`bookingScreen.locationAction.${locationKind}`),
      ].join(', ')
    : '';

  const seatAccessibilityLabel = booking?.seat
    ? [t('common.seat'), `${booking.seat.row}${booking.seat.column}`].join(', ')
    : '';

  // From the bookings list (Services) the agenda is one tap away; from the
  // agenda it is where the user came from
  const isInAgendaStack = navigation.getState().routeNames.includes('Agenda');
  const openAgenda = () => {
    if (!booking) return;
    navigation.getParent()?.navigate('AgendaTab', {
      screen: 'Agenda',
      params: {
        date: DateTime.fromJSDate(booking.startsAt, {
          zone: APP_TIMEZONE,
        }).toISODate(),
        requestedAt: Date.now(),
      },
      pop: true,
    });
  };

  const cancelUntil =
    booking?.cancelableUntil && canBeCancelled
      ? `${formatBookingDay(booking.cancelableUntil, language)}, ${formatBookingTime(booking.cancelableUntil)}`
      : undefined;

  const iconColor = colors.secondaryText;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl manual queries={[bookingsQuery]} />}
      >
        {booking && (
          <EventHead
            caption={
              subTopicTitle
                ? `${t('common.booking')} · ${subTopicTitle}`
                : t('common.booking')
            }
            subtitle={description ? title : undefined}
            date={formatBookingDay(booking.startsAt, language)}
            time={`${formatBookingTime(booking.startsAt)} - ${formatBookingTime(booking.endsAt)}`}
          />
        )}
        <Section style={styles.firstSection}>
          <OverviewList indented>
            {booking?.location?.name && (
              <ListItem
                isAction
                accessibilityRole={
                  locationKind === 'virtualPlace' ? 'link' : 'button'
                }
                accessibilityLabel={locationAccessibilityLabel}
                leadingItem={
                  <OutlineIcon
                    name={locationKind === 'virtualPlace' ? 'video' : 'pin'}
                    color={iconColor}
                  />
                }
                title={booking.location.name}
                multilineTitle
                subtitle={t(`bookingScreen.locationAction.${locationKind}`)}
                onPress={() => onPressLocation(booking?.location)}
              />
            )}
            {!!booking?.seat && (
              <ListItem
                isAction
                accessibilityLabel={seatAccessibilityLabel}
                leadingItem={<OutlineIcon name="seat" color={iconColor} />}
                title={`${booking.seat.row}${booking.seat.column}`}
                subtitle={t('common.seat')}
                onPress={() =>
                  booking?.seat?.id &&
                  navigation.navigate('BookingSeat', {
                    bookingId: booking.id,
                    slotId: String(booking.id),
                    seatId: booking.seat.id,
                    topicId: booking.subtopic?.id || booking.topic.id,
                  })
                }
              />
            )}
            {!!cancelUntil && (
              <ListItem
                leadingItem={<OutlineIcon name="clock" color={iconColor} />}
                title={cancelUntil}
                subtitle={t('bookings.cancelUntil')}
                accessibilityLabel={`${t('bookings.cancelUntil')}: ${cancelUntil}`}
              />
            )}
            {!!booking && !isInAgendaStack && (
              <ListItem
                isAction
                leadingItem={<OutlineIcon name="calendar" color={iconColor} />}
                title={t('bookings.viewInAgenda')}
                onPress={openAgenda}
              />
            )}
          </OverviewList>
        </Section>
        <Section accessible>
          <SectionHeader
            title={t('bookingScreen.barCodeTitle')}
            accessible={false}
          />
          <Card style={styles.barCodeCard}>
            {profileQuery.data && (
              <Barcode
                value={profileQuery.data.username}
                format="CODE128"
                height={85}
                lineColor={palettes.primary[800]}
                singleBarWidth={1.8}
                // The scanner needs dark bars on white, in dark mode too
                backgroundColor="white"
              />
            )}
          </Card>
        </Section>
        {!(hasCheckIn || canBeCancelled) && <BottomBarSpacer />}
      </ScrollView>
      {(hasCheckIn || canBeCancelled) && (
        <BottomActionBar style={styles.actions}>
          {hasCheckIn && (
            <CtaButton
              title={
                completedCheckIn
                  ? t('bookingScreen.checkInFeedback')
                  : t('bookingScreen.checkIn')
              }
              action={onPressCheckIn}
              loading={updateBookingMutation.isPending}
              variant="outlined"
              icon={completedCheckIn ? faCheckCircle : undefined}
              absolute={false}
              success={completedCheckIn}
              disabled={
                isDisabled ||
                updateBookingMutation.isPending ||
                completedCheckIn
              }
              containerStyle={styles.button}
            />
          )}
          {canBeCancelled && (
            <CtaButton
              title={t('bookingScreen.cancelBooking')}
              action={onPressDelete}
              loading={isCancelling}
              absolute={false}
              disabled={isDisabled || isCancelling}
              variant="outlined"
              destructive={true}
              containerStyle={styles.button}
            />
          )}
        </BottomActionBar>
      )}
    </View>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    firstSection: {
      paddingTop: spacing[4],
    },
    barCodeCard: {
      padding: spacing[4],
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: layout.gutter,
    },
    actions: {
      gap: spacing[3],
    },
    button: {
      padding: 0,
    },
  });
