import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useApiContext,
  usePreferencesContext,
  useQuietQueryErrors,
} from '@polito/lib/core';
import {
  PlacesNavigator,
  useGetCurrentCampus,
  useGetSites,
} from '@polito/lib/features/places';
import {
  OutlineIcon,
  OutlineIconName,
  Text,
  Theme,
  UnreadBadge,
  tabBarStyle,
  useInnerTitleOptions,
  useStylesheet,
  useTabRootHeaderOptions,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { UnreadMessagesModal } from '~/features/user/screens/UnreadMessagesModal';

import { filterUnread } from '../../../src/utils/messages';
import { AgendaNavigator } from '../../features/agenda/components/AgendaNavigator';
import { ServicesNavigator } from '../../features/services/components/ServicesNavigator';
import { TeachingNavigator } from '../../features/teaching/components/TeachingNavigator';
import { UserNavigator } from '../../features/user/components/UserNavigator';
import { useDownloadsContext } from '../contexts/DownloadsContext';
import { useInitFirebaseMessaging } from '../hooks/messaging';
import { useModalManager } from '../hooks/useModalManager';
import { useNotifications } from '../hooks/useNotifications';
import { useGetMessages, useGetStudent } from '../queries/studentHooks';
import { OnboardingModal } from '../screens/OnboardingModal';
import { RootParamList } from '../types/navigation';
import { AppPreferences } from '../types/preferences';

const TabNavigator = createBottomTabNavigator<RootParamList>();
const androidTabBarHeight = 60;
// Room for the label at its 14 px cap under the 20 px icon
const androidLargeTextTabBarHeight = 64;

// The label grows with the text size up to 14 px, as in the mockup, and
// never hides. At 14 px the longest labels (Teaching, Didattica) are 66 px
// wide. A tab is 72 dp wide on a 360 dp phone, but its button pads 5 px on
// each side, so the label takes that padding back. The active tab's label
// is bold, so the selection never rests on colour alone.
const TabLabel = ({
  focused,
  color,
  children,
}: {
  focused: boolean;
  color: string;
  children: string;
}) => (
  <Text
    variant="tabLabel"
    maxFontSize={14}
    numberOfLines={1}
    weight={focused ? 'bold' : undefined}
    style={[tabBarStyles.label, { color }]}
  >
    {children}
  </Text>
);

/**
 * The tab icon: an outline glyph with a pill behind it on the active tab,
 * and the unread count on its corner
 */
const TabIcon = ({
  name,
  focused,
  color,
  unread,
}: {
  name: OutlineIconName;
  focused: boolean;
  color: string;
  unread?: number;
}) => {
  const { colors } = useTheme();
  const { isLargest } = useTextScale();
  return (
    <View
      style={[
        tabBarStyles.pill,
        isLargest && tabBarStyles.narrowPill,
        focused && { backgroundColor: colors.tabIndicator },
      ]}
    >
      <OutlineIcon name={name} color={color} />
      {!!unread && (
        <View
          style={[
            tabBarStyles.badge,
            isLargest && tabBarStyles.narrowBadge,
            { borderColor: colors.tabBarBackground },
          ]}
        >
          <UnreadBadge text={unread} />
        </View>
      )}
    </View>
  );
};

const tabBarStyles = StyleSheet.create({
  label: { marginHorizontal: -5 },
  pill: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  narrowPill: { width: 48 },
  badge: {
    position: 'absolute',
    top: -6,
    left: 32,
    borderWidth: 2,
    borderRadius: 999,
  },
  narrowBadge: { left: 28 },
});

export const RootNavigator = ({
  versionModalIsOpen,
}: {
  versionModalIsOpen?: boolean;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const styles = useStylesheet(createStyles);
  const { username } = useApiContext();
  const { syncLocalFilesToDb } = useDownloadsContext();
  const { data: student } = useGetStudent();
  const { updatePreference } = usePreferencesContext<AppPreferences>();
  const { isLarge } = useTextScale();
  const { getUnreadsCount } = useNotifications();
  const hasSyncedFiles = useRef(false);
  const campus = useGetCurrentCampus();
  const sitesQuery = useGetSites();
  const { data: sites } = sitesQuery;
  const { isOnboardingVisible, closeOnboarding } =
    useModalManager(versionModalIsOpen);
  const profileMessages = useGetMessages();
  // The tab badge and the campus list load in the background
  useQuietQueryErrors([profileMessages, sitesQuery]);

  useInitFirebaseMessaging();

  useEffect(() => {
    if (username && !hasSyncedFiles.current) {
      hasSyncedFiles.current = true;
      syncLocalFilesToDb().catch(() => {});
    }
  }, [username, syncLocalFilesToDb]);

  useEffect(() => {
    if (student && !campus && sites?.data?.length) {
      updatePreference('campusId', sites?.data[0].id);
    }
  }, [campus, sites?.data, student, updatePreference]);

  const instantAnimation = {
    animation: 'timing' as const,
    config: { duration: 0 },
  };

  const androidTabBarBottom = useMemo(
    () =>
      Platform.select({
        android: {
          height:
            (isLarge ? androidLargeTextTabBarHeight : androidTabBarHeight) +
            bottom,
        },
      }),
    [bottom, isLarge],
  );

  const placesHeaderOptions = {
    root: useTabRootHeaderOptions(),
    inner: useInnerTitleOptions(),
  };

  // Badges count unread items only, which reading them clears: course
  // announcements, files and lectures; ticket replies; messages
  const unread = {
    teaching: getUnreadsCount(['teaching']),
    services: getUnreadsCount(['services', 'tickets']),
    profile: filterUnread(profileMessages.data || []).length || undefined,
  };
  const tabOptions = (
    title: string,
    icon: OutlineIconName,
    count?: number,
  ) => ({
    title,
    tabBarAccessibilityLabel: count
      ? `${title}, ${t('navigation.unreadCount', { count })}`
      : title,
    tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
      <TabIcon name={icon} focused={focused} color={color} unread={count} />
    ),
  });

  return (
    <>
      <TabNavigator.Navigator
        backBehavior="history"
        screenOptions={{
          tabBarLabel: TabLabel,
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarVisibilityAnimationConfig: {
            show: instantAnimation,
            hide: instantAnimation,
          },
          tabBarStyle: [styles.tabBarStyle, androidTabBarBottom],
          tabBarBackground: () => <View style={styles.tabBarBackground} />,
          tabBarItemStyle: styles.tabBarItemStyle,
          tabBarActiveTintColor: colors.tabBar,
          tabBarInactiveTintColor: colors.tabBarInactive,
        }}
      >
        <TabNavigator.Screen
          name="TeachingTab"
          component={TeachingNavigator}
          options={tabOptions(
            t('teachingScreen.title'),
            'book',
            unread.teaching,
          )}
        />
        <TabNavigator.Screen
          name="AgendaTab"
          component={AgendaNavigator}
          options={tabOptions(t('agendaScreen.title'), 'calendar')}
        />
        <TabNavigator.Screen
          name="PlacesTab"
          options={tabOptions(t('placesScreen.title'), 'compass')}
        >
          {() => (
            <PlacesNavigator
              unreadMessagesModal={UnreadMessagesModal}
              headerOptions={placesHeaderOptions}
            />
          )}
        </TabNavigator.Screen>
        <TabNavigator.Screen
          name="ServicesTab"
          component={ServicesNavigator}
          options={tabOptions(t('common.services'), 'grid', unread.services)}
        />
        <TabNavigator.Screen
          name="ProfileTab"
          component={UserNavigator}
          options={tabOptions(t('profileScreen.title'), 'user', unread.profile)}
        />
      </TabNavigator.Navigator>
      <OnboardingModal
        visible={isOnboardingVisible}
        onClose={closeOnboarding}
      />
    </>
  );
};

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    tabBarStyle: {
      ...tabBarStyle,
      position: 'absolute',
      borderTopColor: colors.divider,
    },
    // Solid, not translucent: the bar is white (the surface in dark)
    tabBarBackground: {
      flex: 1,
      backgroundColor: colors.tabBarBackground,
    },
    tabBarItemStyle: {
      paddingVertical: 3,
    },
  });
