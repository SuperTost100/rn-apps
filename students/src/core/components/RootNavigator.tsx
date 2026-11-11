import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import {
  faBookOpen,
  faCircleInfo,
  faCompass,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useApiContext, usePreferencesContext } from '@polito/lib/core';
import {
  PlacesNavigator,
  useGetCurrentCampus,
  useGetSites,
} from '@polito/lib/features/places';
import {
  HeaderLogo,
  Icon,
  Text,
  Theme,
  TranslucentView,
  tabBarStyle,
  useStylesheet,
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
const tabBarIconSize = 20;

// The label grows with the text size up to 14 px, as in the mockup, and
// never hides. At 14 px the longest labels (Teaching, Didattica) are 66 px
// wide. A tab is 72 dp wide on a 360 dp phone, but its button pads 5 px on
// each side, so the label takes that padding back.
const TabLabel = ({ color, children }: { color: string; children: string }) => (
  <Text
    variant="tabLabel"
    maxFontSize={14}
    numberOfLines={1}
    style={[tabLabelStyles.label, { color }]}
  >
    {children}
  </Text>
);
const tabLabelStyles = StyleSheet.create({
  label: { marginHorizontal: -5 },
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
  const { data: sites } = useGetSites();
  const { isOnboardingVisible, closeOnboarding } =
    useModalManager(versionModalIsOpen);
  const profileMessages = useGetMessages();

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
          tabBarBackground: () => <TranslucentView fallbackOpacity={1} />,
          tabBarItemStyle: styles.tabBarItemStyle,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarBadgeStyle: styles.tabBarBadgeStyle,
        }}
      >
        <TabNavigator.Screen
          name="TeachingTab"
          component={TeachingNavigator}
          options={{
            title: t('teachingScreen.title'),
            tabBarIcon: ({ color }) => (
              <Icon icon={faBookOpen} color={color} size={tabBarIconSize} />
            ),
            tabBarBadge: getUnreadsCount(['teaching']),
          }}
        />
        <TabNavigator.Screen
          name="AgendaTab"
          component={AgendaNavigator}
          options={{
            title: t('agendaScreen.title'),
            tabBarIcon: ({ color }) => (
              <Icon icon={faCalendar} color={color} size={tabBarIconSize} />
            ),
          }}
        />
        <TabNavigator.Screen
          name="PlacesTab"
          options={{
            title: t('placesScreen.title'),
            tabBarIcon: ({ color }) => (
              <Icon icon={faCompass} color={color} size={tabBarIconSize} />
            ),
          }}
        >
          {() => <PlacesNavigator unreadMessagesModal={UnreadMessagesModal} />}
        </TabNavigator.Screen>
        <TabNavigator.Screen
          name="ServicesTab"
          component={ServicesNavigator}
          options={{
            headerLeft: () => <HeaderLogo />,
            title: t('common.services'),
            tabBarIcon: ({ color }) => (
              <Icon icon={faCircleInfo} color={color} size={tabBarIconSize} />
            ),
            tabBarBadge: getUnreadsCount(['services']),
          }}
        />
        <TabNavigator.Screen
          name="ProfileTab"
          component={UserNavigator}
          options={{
            title: t('profileScreen.title'),
            tabBarIcon: ({ color }) => (
              <Icon icon={faUser} color={color} size={tabBarIconSize} />
            ),
            tabBarBadge:
              filterUnread(profileMessages.data || []).length || undefined,
          }}
        />
      </TabNavigator.Navigator>
      <OnboardingModal
        visible={isOnboardingVisible}
        onClose={closeOnboarding}
      />
    </>
  );
};

const createStyles = ({
  colors,
  palettes,
  fontFamilies,
  fontWeights,
  fontSizes,
}: Theme) =>
  StyleSheet.create({
    tabBarStyle: {
      ...tabBarStyle,
      position: 'absolute',
      borderTopColor: colors.divider,
    },
    tabBarItemStyle: {
      paddingVertical: 3,
    },
    // Theme-independent hardcoded color
    // eslint-disable-next-line react-native/no-color-literals
    tabBarBadgeStyle: {
      backgroundColor: palettes.rose[600],
      color: 'white',
      top: -2,
      fontFamily: fontFamilies.body,
      fontWeight: fontWeights.semibold,
      fontSize: fontSizes.sm,
    },
  });
