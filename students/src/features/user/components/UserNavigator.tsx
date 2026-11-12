import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { UserNavigatorID } from '@polito/lib/core';
import { MfaSettings } from '@polito/lib/features/auth';
import {
  offlineScreenLayout,
  useInnerHeaderOptions,
  useTabRootHeaderOptions,
  withoutHeaderHairline,
} from '@polito/lib/ui';
import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { SharedScreens } from '../../../shared/navigation/SharedScreens';
import { DegreeTopTabsNavigator } from '../../offering/navigation/DegreeTopTabsNavigator';
import { OfferingStackParamList } from '../../services/components/ServicesNavigator';
import { NewsItemScreen } from '../../services/screens/NewsItemScreen';
import { CreateTicketScreen } from '../../tickets/screens/CreateTicketScreen';
import { AccessibilitySettingsScreen } from '../screens/AccessibilityFontSettingsScreen.tsx';
import { AppInfoScreen } from '../screens/AppInfoScreen.tsx';
import { NewOverlayScreen } from '../screens/NewOverlayScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RequestESCScreen } from '../screens/RequestESCScreen.tsx';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WhatsNewScreen } from '../screens/WhatsNewScreen';

export type UserStackParamList = OfferingStackParamList & {
  Profile: { firstRequest?: boolean };
  Settings: undefined;
  AppInfo: undefined;
  WhatsNew: undefined;
  RecentCommunications: undefined;
  NewOverlay: { id: string };
  CreateTicket: {
    topicId?: number;
    subtopicId?: number;
  };
  MfaSettings: undefined;
  RequestESC: undefined;
  MessagesModal: undefined;
  Notifications: undefined;
  Person: { id: number };
  NewsItem: { id: number };
};

const MfaSettingsScreen = ({
  navigation,
}: NativeStackScreenProps<UserStackParamList, 'MfaSettings'>) => (
  <MfaSettings
    onEnroll={() =>
      navigation.navigate('PolitoAuthenticator', { activeView: 'enroll' })
    }
  />
);

const Stack = createNativeStackNavigator<
  UserStackParamList,
  typeof UserNavigatorID
>();

export const UserNavigator = () => {
  const { t } = useTranslation();
  const rootOptions = useTabRootHeaderOptions();

  return (
    <Stack.Navigator
      screenLayout={offlineScreenLayout}
      id={UserNavigatorID}
      screenOptions={useInnerHeaderOptions()}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ firstRequest: false }}
        options={{
          ...rootOptions,
          headerTitle: t('profileScreen.title'),
        }}
      />
      <Stack.Screen
        name="RequestESC"
        component={RequestESCScreen}
        options={{
          headerTitle: t('escRequestScreen.title'),
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerTitle: t('notificationsScreen.title'),
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: t('settingsScreen.title'),
        }}
      />
      <Stack.Screen
        name="AppInfo"
        component={AppInfoScreen}
        options={{
          headerTitle: t('appInfoScreen.title'),
        }}
      />
      <Stack.Screen
        name="CreateTicket"
        component={CreateTicketScreen}
        options={{
          headerTitle: t('common.appFeedback'),
        }}
      />
      <Stack.Screen
        name="WhatsNew"
        component={WhatsNewScreen}
        options={{
          headerTitle: t('appInfoScreen.news'),
          headerBackTitle: t('profileScreen.title'),
        }}
      />
      <Stack.Screen
        name="RecentCommunications"
        component={WhatsNewScreen}
        options={{
          headerTitle: t('appInfoScreen.recentCommunications'),
          headerBackTitle: t('profileScreen.title'),
        }}
      />
      <Stack.Screen
        name="NewOverlay"
        component={NewOverlayScreen}
        getId={({ params }) => params.id}
        options={{
          headerTitle: t('appInfoScreen.news'),
          headerBackVisible: false,
          presentation: 'modal',
          ...(Platform.OS === 'ios'
            ? {
                sheetGrabberVisible: true,
              }
            : {}),
        }}
      />
      <Stack.Screen
        name="NewsItem"
        component={NewsItemScreen}
        getId={({ params: { id } }) => id.toString()}
        options={{
          headerTitle: t('newsScreen.title'),
        }}
      />
      <Stack.Screen
        name="AccessibilitySettings"
        component={AccessibilitySettingsScreen}
        options={{
          headerTitle: t('accessibilitySettingsScreen.customFontSectionTitle'),
        }}
      />
      <Stack.Screen
        name="MfaSettings"
        component={MfaSettingsScreen}
        options={{
          headerTitle: t('settingsScreen.authenticatorTitle'),
        }}
      />
      <Stack.Screen
        name="Degree"
        component={DegreeTopTabsNavigator}
        getId={({ params: { id, year } }) => id + (year ?? '0')}
        options={{
          headerTitle: t('degreeScreen.title'),
          ...withoutHeaderHairline,
        }}
      />
      {SharedScreens()}
    </Stack.Navigator>
  );
};
