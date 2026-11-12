import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import Barcode from 'react-native-barcode-svg';

import {
  faCheckCircle,
  faLocationDot,
  faVideo,
} from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  useFeedbackContext,
  useOfflineDisabled,
  usePreferencesContext,
} from '@polito/lib/core';
import { useOpenInAppLink } from '@polito/lib/core';
import { resolvePlaceId } from '@polito/lib/features/places';
import {
  BottomBarSpacer,
  Card,
  CtaButton,
  CtaButtonContainer,
  Icon,
  ListItem,
  OverviewList,
  RefreshControl,
  Section,
  SectionHeader,
  Theme,
  faSeat,
  isToday,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { Booking } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { inRange } from 'lodash';
import { DateTime } from 'luxon';

import { useConfirmationDialog } from '../../../core/hooks/useConfirmationDialog';
import { useGeolocation } from '../../../core/hooks/useGeolocation';
import {
  useDeleteBooking,
  useGetBookings,
  useUpdateBooking,
} from '../../../core/queries/bookingHooks';
import { useGetProfile } from '../../../core/queries/studentHooks';
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
  const { colors, palettes, spacing } = useTheme();
  const bookingsQuery = useGetBookings();
  const deleteBookingMutation = useDeleteBooking(id);
  const updateBookingMutation = useUpdateBooking();
  const profileQuery = useGetProfile();
  const confirmCancel = useConfirmationDialog({
    title: t('bookingScreen.cancelBooking'),
    message: t('bookingScreen.cancelBookingText'),
  });
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
      .catch(() => {
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
            .then(() => {
              setFeedback({ text: t('bookingScreen.checkInFeedback') });
              bookingsQuery.refetch();
            });
        } else {
          setFeedback({ text: t('bookingScreen.checkLocationErrorFeedback') });
        }
      });
  };

  const onPressLocation = async (location: Booking['location']) => {
    if (location.type === 'virtualPlace') {
      await openInAppLink(location.url);
    } else if (location.type === 'place') {
      navigation.navigate(placesStack(navigation), {
        screen: 'Place',
        params: {
          placeId: resolvePlaceId(location),
          isCrossNavigation: true,
          lat: booking?.locationCheck?.latitude,
          long: booking?.locationCheck?.longitude,
          name: booking?.location?.name,
        },
      });
    }
  };

  const onPressDelete = async () => {
    if (await confirmCancel()) {
      return deleteBookingMutation
        .mutateAsync()
        .then(() => navigation.goBack())
        .then(() => setFeedback({ text: t('bookingScreen.cancelFeedback') }));
    }
  };

  const locationAccessibilityLabel = booking
    ? [
        booking.location.name,
        t(`bookingScreen.locationAction.${booking.location.type}`),
      ].join(', ')
    : '';

  const seatAccessibilityLabel = booking?.seat
    ? [t('common.seat'), `${booking.seat.row}${booking.seat.column}`].join(', ')
    : '';

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl manual queries={[bookingsQuery]} />}
      >
        <SafeAreaView>
          {booking && (
            <EventHead
              caption={
                subTopicTitle
                  ? `${t('common.booking')} · ${subTopicTitle}`
                  : t('common.booking')
              }
              subtitle={description ? title : undefined}
              date={DateTime.fromJSDate(booking.startsAt, {
                zone: APP_TIMEZONE,
              })
                .setLocale(language)
                .toFormat('ccc, d LLL yyyy')}
              time={`${DateTime.fromJSDate(booking.startsAt, { zone: APP_TIMEZONE }).toFormat('HH:mm')} - ${DateTime.fromJSDate(booking.endsAt, { zone: APP_TIMEZONE }).toFormat('HH:mm')}`}
            />
          )}
          <OverviewList indented style={{ marginTop: spacing[4] }}>
            {booking?.location?.name && (
              <ListItem
                isAction
                accessibilityRole={
                  booking.location.type === 'virtualPlace' ? 'link' : 'button'
                }
                accessibilityLabel={locationAccessibilityLabel}
                leadingItem={
                  <Icon
                    icon={
                      booking.location.type === 'virtualPlace'
                        ? faVideo
                        : faLocationDot
                    }
                    size={24}
                    color={colors.secondaryText}
                  />
                }
                title={booking.location.name}
                subtitle={t(
                  `bookingScreen.locationAction.${booking.location.type}`,
                )}
                onPress={() => onPressLocation(booking?.location)}
              />
            )}
            {!!booking && !!booking?.seat && (
              <ListItem
                accessibilityRole="button"
                accessibilityLabel={seatAccessibilityLabel}
                leadingItem={
                  <Icon icon={faSeat} size={24} color={colors.secondaryText} />
                }
                title={`${booking.seat.row}${booking.seat.column}`}
                subtitle={t('common.seat')}
                onPress={() =>
                  booking?.seat?.id &&
                  booking?.id &&
                  navigation.navigate('BookingSeat', {
                    bookingId: booking.id,
                    slotId: String(booking?.id),
                    seatId: booking?.seat?.id,
                    topicId: booking.subtopic?.id || booking.topic.id,
                  })
                }
                isAction
              />
            )}
          </OverviewList>
          <Section style={{ marginTop: spacing[4] }} mb={0} accessible>
            <SectionHeader
              title={t('bookingScreen.barCodeTitle')}
              accessible={false}
            />
            <Card style={styles.barCodeCard} spaced>
              {profileQuery.data && (
                <Barcode
                  value={profileQuery.data.username}
                  format="CODE128"
                  height={85}
                  lineColor={palettes.primary[800]}
                  singleBarWidth={1.8}
                  backgroundColor="white"
                />
              )}
            </Card>
          </Section>
        </SafeAreaView>
      </ScrollView>
      {(hasCheckIn || canBeCancelled) && (
        <>
          <CtaButtonContainer absolute={false}>
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
                containerStyle={{ paddingVertical: 0 }}
              />
            )}
            {canBeCancelled && (
              <CtaButton
                title={t('bookingScreen.cancelBooking')}
                action={onPressDelete}
                loading={deleteBookingMutation.isPending}
                absolute={false}
                disabled={isDisabled || deleteBookingMutation.isPending}
                destructive={true}
                containerStyle={{ paddingVertical: 0 }}
              />
            )}
          </CtaButtonContainer>
          <BottomBarSpacer />
        </>
      )}
    </>
  );
};

const createStyles = ({ spacing, fontSizes }: Theme) =>
  StyleSheet.create({
    barCodeCard: {
      padding: fontSizes.md,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: Platform.select({ ios: spacing[4] }),
    },
  });
