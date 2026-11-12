import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import {
  faBookBookmark,
  faBriefcase,
  faClipboardQuestion,
  faComments,
  faEnvelope,
  faIdCard,
  faNewspaper,
  faPersonCirclePlus,
  faSignsPost,
} from '@fortawesome/free-solid-svg-icons';
import {
  split,
  useOfflineDisabled,
  usePreferencesContext,
} from '@polito/lib/core';
import { useOpenInAppLink, useQuietQueryErrors } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Grid,
  Theme,
  auto,
  useStylesheet,
} from '@polito/lib/ui';
import { useQueryClient } from '@tanstack/react-query';

import { AppPreferences } from '~/core/types/preferences.ts';

import { useNotifications } from '../../../core/hooks/useNotifications';
import {
  WEBMAIL_LINK_QUERY_KEY,
  useGetWebmailLink,
} from '../../../core/queries/studentAuthHooks';
import { useGetUnreadEmails } from '../../../core/queries/studentHooks.ts';
import { ServiceCard } from '../components/ServiceCard';

export const ServicesScreen = () => {
  const { t } = useTranslation();
  const {
    favoriteServices: favoriteServiceIds,
    emailGuideRead,
    updatePreference,
    accessibility,
  } = usePreferencesContext<AppPreferences>();
  const { getUnreadsCount } = useNotifications();
  const styles = useStylesheet(createStyles);
  const isOffline = useOfflineDisabled();
  const queryClient = useQueryClient();
  const unreadTickets = getUnreadsCount(['services', 'tickets']);
  const unreadEmailsQuery = useGetUnreadEmails();
  // The webmail badge
  useQuietQueryErrors(unreadEmailsQuery);
  const [fontSize, setFontSize] = useState(Number(accessibility?.fontSize));
  useEffect(() => {
    setFontSize(Number(accessibility?.fontSize) ?? 0);
  }, [accessibility?.fontSize]);
  const openInAppLink = useOpenInAppLink();
  const getWebmailLink = useGetWebmailLink();

  const openWebmailLink = useCallback(async () => {
    queryClient
      .fetchQuery({
        queryKey: WEBMAIL_LINK_QUERY_KEY,
        queryFn: getWebmailLink,
        staleTime: 55 * 1000, // 55 seconds
        gcTime: 55 * 1000, // 55 seconds
        persister: undefined, // disable persister
      })
      .then(res => openInAppLink(res.url));
  }, [openInAppLink, queryClient, getWebmailLink]);

  const services = useMemo(() => {
    return [
      {
        id: 'tickets',
        name: t('ticketsScreen.title'),
        icon: faComments,
        linkTo: { screen: 'Tickets' },
        unReadCount: unreadTickets,
        accessibilityLabel: `${t('ticketsScreen.title')} ${
          unreadTickets ? t('servicesScreen.newElement') : ''
        }`,
      },
      {
        id: 'news',
        name: t('newsScreen.title'),
        icon: faNewspaper,
        linkTo: {
          screen: 'News',
        },
        unReadCount: getUnreadsCount(['services', 'news']),
        accessibilityLabel: `${t('newsScreen.title')} ${
          getUnreadsCount(['services', 'news'])
            ? t('servicesScreen.newElement')
            : ''
        }`,
      },
      {
        id: 'jobOffers',
        name: t('jobOffersScreen.title'),
        icon: faBriefcase,
        linkTo: { screen: 'JobOffers' },
        accessibilityLabel: t('jobOffersScreen.title'),
      },
      {
        id: 'offering',
        name: t('offeringScreen.title'),
        icon: faBookBookmark,
        linkTo: { screen: 'Offering' },
        accessibilityLabel: t('offeringScreen.title'),
      },
      {
        id: 'contacts',
        name: t('contactsScreen.title'),
        icon: faIdCard,
        linkTo: { screen: 'Contacts' },
        accessibilityLabel: t('contactsScreen.title'),
      },
      {
        id: 'guides',
        name: t('guidesScreen.title'),
        icon: faSignsPost,
        linkTo: { screen: 'Guides' },
        unReadCount: emailGuideRead ? 0 : 1,
        accessibilityLabel: `${t('guidesScreen.title')} ${
          !emailGuideRead ? t('servicesScreen.newElement') : ''
        }`,
      },
      {
        id: 'bookings',
        name: t('bookingsScreen.title'),
        icon: faPersonCirclePlus,
        linkTo: { screen: 'Bookings' },
        accessibilityLabel: t('bookingsScreen.title'),
      },
      {
        id: 'surveys',
        name: t('surveysScreen.title'),
        icon: faClipboardQuestion,
        linkTo: { screen: 'Surveys' },
        accessibilityLabel: t('surveysScreen.title'),
      },
      {
        id: 'mail',
        name: 'Web\nMail',
        icon: faEnvelope,
        // Opens the webmail in the browser: it needs the network
        disabled: isOffline,
        unReadCount: unreadEmailsQuery.data
          ? unreadEmailsQuery.data.unreadEmails
          : 0,
        onPress: () => openWebmailLink(),
        accessibilityLabel: `${t('WebMail')} ${
          unreadEmailsQuery.data ? t('servicesScreen.newElement') : ''
        }`,
      },
    ];
  }, [
    t,
    isOffline,
    unreadTickets,
    getUnreadsCount,
    emailGuideRead,
    unreadEmailsQuery.data,
    openWebmailLink,
  ]);

  const [favoriteServices, otherServices] = useMemo(
    () =>
      services.reduce(
        split(s => favoriteServiceIds.includes(s.id)),
        [[], []],
      ),
    [favoriteServiceIds, services],
  );

  const updateFavorite =
    (service: (typeof services)[number]) => (favorite: boolean) => {
      const newVal = favorite
        ? [...new Set([...favoriteServiceIds, service.id])]
        : favoriteServiceIds.filter(fs => fs !== service.id);
      updatePreference('favoriteServices', newVal);
    };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView>
        {favoriteServices.length > 0 && (
          <Grid
            numColumns={fontSize && fontSize >= 125 ? 1 : auto}
            minColumnWidth={ServiceCard.minWidth}
            maxColumnWidth={ServiceCard.maxWidth}
            gap={4}
            style={styles.grid}
          >
            {favoriteServices.map(service => (
              <ServiceCard
                key={service.id}
                name={service.name}
                icon={service.icon}
                disabled={service.disabled}
                linkTo={service.linkTo}
                onPress={service.onPress}
                favorite
                onFavoriteChange={updateFavorite(service)}
                unReadCount={service?.unReadCount}
                accessibilityLabel={service?.accessibilityLabel}
              />
            ))}
          </Grid>
        )}

        {otherServices.length > 0 && (
          <Grid
            numColumns={fontSize && fontSize >= 125 ? 1 : auto}
            minColumnWidth={ServiceCard.minWidth}
            maxColumnWidth={ServiceCard.maxWidth}
            gap={4}
            style={styles.grid}
          >
            {otherServices.map(service => (
              <ServiceCard
                key={service.id}
                name={service.name}
                icon={service.icon}
                disabled={service.disabled}
                linkTo={service.linkTo}
                onPress={service.onPress}
                onFavoriteChange={updateFavorite(service)}
                unReadCount={service?.unReadCount}
                accessibilityLabel={service?.accessibilityLabel}
              />
            ))}
          </Grid>
        )}
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    grid: {
      margin: spacing[5],
    },
  });
