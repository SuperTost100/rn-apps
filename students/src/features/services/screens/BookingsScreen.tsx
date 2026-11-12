import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useIsOnline } from '@polito/lib/core';
import {
  BottomActionBar,
  CtaButton,
  OverviewList,
  RefreshControl,
  Section,
  SectionHeader,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGetBookings } from '../../../core/queries/bookingHooks';
import { BookingListItem } from '../../bookings/components/BookingListItem';
import { ServiceStackParamList } from '../components/ServicesNavigator';

type Props = NativeStackScreenProps<ServiceStackParamList, 'Bookings'>;

/**
 * The upcoming bookings in one card, and New booking in a bar under the
 * list. After a booking the new row is highlighted (route param newId)
 */
export const BookingsScreen = ({ navigation, route }: Props) => {
  const bookingsQuery = useGetBookings();
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const isOnline = useIsOnline();
  const newId = route.params?.newId;

  const bookings = useMemo(
    () =>
      bookingsQuery.data
        ?.slice()
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    [bookingsQuery.data],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl queries={[bookingsQuery]} manual />}
      >
        <Section style={styles.section}>
          <SectionHeader
            title={t('bookings.upcoming')}
            ellipsizeTitle={false}
          />
          <OverviewList
            queries={bookingsQuery}
            skeleton={{ count: 3, leading: 'tile', subtitleLines: 2 }}
            emptyState={{
              title: t('states.bookings.emptyTitle'),
              text: t('bookings.emptyText'),
            }}
            errorState={{ title: t('states.bookings.failedTitle') }}
          >
            {bookings?.map(booking => (
              <BookingListItem
                key={booking.id}
                booking={booking}
                selected={booking.id === newId}
              />
            ))}
          </OverviewList>
        </Section>
      </ScrollView>
      <BottomActionBar>
        <CtaButton
          absolute={false}
          containerStyle={{ padding: 0 }}
          action={() => navigation.navigate('BookingTopic')}
          title={
            isOnline
              ? t('bookingsScreen.newBooking')
              : t('bookings.needsConnection')
          }
          icon={faPlus}
          disabled={!isOnline}
        />
      </BottomActionBar>
    </View>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    section: {
      paddingTop: spacing[5],
    },
  });
