import { ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  To,
  useFeedbackContext,
  useOfflineDisabled,
  usePreferencesContext,
} from '@polito/lib/core';
import { useOpenInAppLink, useQuietQueryErrors } from '@polito/lib/core';
import {
  BottomBarSpacer,
  ListItem,
  OutlineIcon,
  OutlineIconName,
  OverviewList,
  Section,
  SectionHeader,
  Text,
  Theme,
  UnreadBadge,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { useScrollToTop } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { AppPreferences } from '~/core/types/preferences.ts';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useGetBookings } from '../../../core/queries/bookingHooks';
import {
  WEBMAIL_LINK_QUERY_KEY,
  useGetWebmailLink,
} from '../../../core/queries/studentAuthHooks';
import { useGetUnreadEmails } from '../../../core/queries/studentHooks.ts';
import { useGetCpdSurveys } from '../../../core/queries/surveysHooks';
import { useGetTickets } from '../../../core/queries/ticketHooks';

interface ServiceRow {
  id: string;
  name: string;
  icon: OutlineIconName;
  linkTo?: To<any>;
  onPress?: () => void;
  disabled?: boolean;
  /** A short status on the right, e.g. "3 upcoming" */
  status?: string;
  /** Unread items inside: the only case with a badge */
  unread?: number;
  /** Read by screen readers after the name, e.g. "opens in the browser" */
  hint?: string;
}

/**
 * Services as a short list grouped by purpose. Each row says what is waiting
 * inside ("1 new reply", "2 to fill in"); a badge only counts unread items.
 */
export const ServicesScreen = () => {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  // Tapping the active tab again scrolls back to the top
  useScrollToTop(scrollRef);
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge } = useTextScale();
  // favoriteServices may still be stored from older versions: it is ignored
  const { emailGuideRead } = usePreferencesContext<AppPreferences>();
  const { getUnreadsCount } = useNotifications();
  const { setFeedback } = useFeedbackContext();
  const isOffline = useOfflineDisabled();
  const queryClient = useQueryClient();
  const openInAppLink = useOpenInAppLink();
  const getWebmailLink = useGetWebmailLink();
  const [isOpeningMail, setIsOpeningMail] = useState(false);

  const ticketsQuery = useGetTickets();
  const bookingsQuery = useGetBookings();
  const surveysQuery = useGetCpdSurveys();
  const unreadEmailsQuery = useGetUnreadEmails();
  // The statuses are extras: a failure leaves them out without an alert
  useQuietQueryErrors([
    ticketsQuery,
    bookingsQuery,
    surveysQuery,
    unreadEmailsQuery,
  ]);

  const openWebmail = useCallback(() => {
    if (isOpeningMail) return;
    setIsOpeningMail(true);
    queryClient
      .fetchQuery({
        queryKey: WEBMAIL_LINK_QUERY_KEY,
        queryFn: getWebmailLink,
        staleTime: 55 * 1000,
        gcTime: 55 * 1000,
        persister: undefined,
      })
      .then(res => openInAppLink(res.url))
      .catch(() =>
        setFeedback({ text: t('servicesScreen.webMailFailed'), isError: true }),
      )
      .finally(() => setIsOpeningMail(false));
  }, [
    isOpeningMail,
    queryClient,
    getWebmailLink,
    openInAppLink,
    setFeedback,
    t,
  ]);

  const groups = useMemo(() => {
    // The tickets say how many replies are unread; a push that arrived
    // before the list was fetched again counts too
    const unreadReplies = Math.max(
      (ticketsQuery.data ?? []).reduce(
        (sum, ticket) => sum + (ticket.unreadCount ?? 0),
        0,
      ),
      getUnreadsCount(['services', 'tickets']) ?? 0,
    );
    const now = Date.now();
    const upcomingBookings = bookingsQuery.data?.filter(
      b => b.endsAt.getTime() > now,
    ).length;
    const surveysToFill = surveysQuery.data?.length;
    const unreadNews = getUnreadsCount(['services', 'news']) ?? 0;
    // The API sends the count as text
    const unreadMail = Number(unreadEmailsQuery.data?.unreadEmails) || 0;
    const newGuides = emailGuideRead ? 0 : 1;

    const help: ServiceRow[] = [
      {
        id: 'tickets',
        name: t('ticketsScreen.title'),
        icon: 'chat',
        linkTo: { screen: 'Tickets' },
        unread: unreadReplies,
        status: unreadReplies
          ? t('servicesScreen.newReplies', { count: unreadReplies })
          : undefined,
      },
      {
        id: 'guides',
        name: t('guidesScreen.title'),
        icon: 'guide',
        linkTo: { screen: 'Guides' },
        unread: newGuides,
        status: newGuides
          ? t('servicesScreen.newItems', { count: newGuides })
          : undefined,
      },
      {
        id: 'contacts',
        name: t('contactsScreen.title'),
        icon: 'card',
        linkTo: { screen: 'Contacts' },
      },
    ];
    const campus: ServiceRow[] = [
      {
        id: 'bookings',
        name: t('bookingsScreen.title'),
        icon: 'door',
        linkTo: { screen: 'Bookings' },
        status: upcomingBookings
          ? t('servicesScreen.upcoming', { count: upcomingBookings })
          : undefined,
      },
      {
        id: 'news',
        name: t('serviceInfo.news.title'),
        icon: 'news',
        linkTo: { screen: 'News' },
        unread: unreadNews,
        status: unreadNews
          ? t('servicesScreen.newItems', { count: unreadNews })
          : undefined,
      },
    ];
    const career: ServiceRow[] = [
      {
        id: 'jobOffers',
        name: t('jobOffersScreen.title'),
        icon: 'brief',
        linkTo: { screen: 'JobOffers' },
      },
      {
        id: 'offering',
        name: t('serviceInfo.catalogue.title'),
        icon: 'bookopen',
        linkTo: { screen: 'Offering' },
      },
      {
        id: 'surveys',
        name: t('surveysScreen.title'),
        icon: 'clipboard',
        linkTo: { screen: 'Surveys' },
        status: surveysToFill
          ? t('servicesScreen.toFillIn', { count: surveysToFill })
          : undefined,
      },
    ];
    const mail: ServiceRow[] = [
      {
        id: 'mail',
        name: t('servicesScreen.webMail'),
        icon: 'mail',
        // Opens the mailbox in the browser: it needs the network
        disabled: isOffline,
        onPress: openWebmail,
        status: isOffline
          ? t('servicesScreen.needsConnection')
          : unreadMail
            ? t('servicesScreen.unreadMail', { count: unreadMail })
            : undefined,
        hint: t('servicesScreen.opensInBrowser'),
      },
    ];
    return [
      { title: t('servicesScreen.groups.help'), rows: help },
      { title: t('servicesScreen.groups.campus'), rows: campus },
      { title: t('servicesScreen.groups.career'), rows: career },
      { title: t('servicesScreen.groups.mail'), rows: mail },
    ];
  }, [
    t,
    ticketsQuery.data,
    bookingsQuery.data,
    surveysQuery.data,
    unreadEmailsQuery.data,
    getUnreadsCount,
    emailGuideRead,
    isOffline,
    openWebmail,
  ]);

  const renderRow = (row: ServiceRow): ReactElement => {
    const isExternal = row.id === 'mail';
    // At large text the status moves under the name, so neither is squeezed
    const statusInTrail = !!row.status && !isLarge;
    const trailing =
      statusInTrail || row.unread || isExternal ? (
        <View style={styles.trailing}>
          {statusInTrail && (
            <Text
              variant="secondaryText"
              numberOfLines={2}
              style={styles.status}
            >
              {row.status}
            </Text>
          )}
          {!!row.unread && <UnreadBadge text={row.unread} />}
          {isExternal && (
            <OutlineIcon name="ext" size={20} color={colors.secondaryText} />
          )}
        </View>
      ) : undefined;
    return (
      <ListItem
        key={row.id}
        title={row.name}
        subtitle={isLarge ? row.status : undefined}
        leadingItem={
          <OutlineIcon name={row.icon} color={colors.secondaryText} />
        }
        trailingItem={trailing}
        showChevron={!isExternal}
        linkTo={row.linkTo}
        onPress={row.onPress}
        disabled={row.disabled}
        accessibilityRole={isExternal ? 'link' : 'button'}
        accessibilityLabel={[row.name, row.status, row.hint]
          .filter(Boolean)
          .join(', ')}
        accessibilityState={{ busy: isExternal && isOpeningMail }}
      />
    );
  };

  return (
    <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.content}>
        {groups.map(group => (
          <Section key={group.title}>
            <SectionHeader title={group.title} />
            <OverviewList>{group.rows.map(renderRow)}</OverviewList>
          </Section>
        ))}
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing[5],
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      flexShrink: 1,
    },
    status: {
      flexShrink: 1,
      textAlign: 'right',
    },
  });
