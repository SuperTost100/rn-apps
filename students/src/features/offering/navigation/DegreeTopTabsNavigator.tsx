import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { useOfflineDisabled } from '@polito/lib/core';
import {
  Icon,
  Row,
  StatefulMenuView,
  Text,
  TopTabBar,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGetOfferingDegree } from '../../../core/queries/offeringHooks';
import { getShortYear } from '../../../utils/offerings';
import { OfferingStackParamList } from '../../services/components/ServicesNavigator';
import { DegreeContext } from '../contexts/DegreeContext';
import { DegreeInfoScreen } from '../screens/DegreeInfoScreen';
import { DegreeJobOpportunitiesScreen } from '../screens/DegreeJobOpportunitiesScreen';
import { DegreeTracksScreen } from '../screens/DegreeTracksScreen';

type Props = NativeStackScreenProps<OfferingStackParamList, 'Degree'>;

interface DegreeTabsParamList extends ParamListBase {
  DegreeInfoScreen: undefined;
  DegreeJobOpportunitiesScreen: undefined;
  DegreeTracksScreen: undefined;
}
const TopTabs = createMaterialTopTabNavigator<DegreeTabsParamList>();
export const DegreeTopTabsNavigator = ({ route, navigation }: Props) => {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const { id: degreeId, year: initialYear } = route.params;
  const [year, setYear] = useState(initialYear);
  const degreeQuery = useGetOfferingDegree({ degreeId, year });
  const displayYear = degreeQuery.data?.year?.toString() || year;
  const { isLarge } = useTextScale();
  const isOffline = useOfflineDisabled();

  const yearOptions = useMemo(() => {
    if (
      !degreeQuery?.data?.editions ||
      degreeQuery.data.editions.length < 2 ||
      isOffline
    )
      return [];

    return degreeQuery.data.editions;
  }, [degreeQuery.data?.editions, isOffline]);

  useEffect(() => {
    if (!degreeQuery.data || !displayYear) return;
    const degreeYear = Number(displayYear);
    const previousDegreeYear = degreeYear - 1;
    const accessibilityLabel = [
      t('profileScreen.enrollmentYear', {
        enrollmentYear: `${previousDegreeYear}/${getShortYear(degreeYear)}`,
      }),
    ].join(' ');
    navigation.setOptions({
      // The degree's name is the page title, so the tabs do not repeat it
      headerTitle: degreeQuery.data.name || degreeQuery.data.id,
      headerRight: () => (
        <View
          accessibilityLabel={accessibilityLabel}
          importantForAccessibility="yes"
          accessibilityRole="button"
          accessible={true}
        >
          <StatefulMenuView
            title={t('degreeScreen.cohort')}
            style={{ padding: spacing[1] }}
            actions={yearOptions}
            onPressAction={({ nativeEvent: { event } }) => setYear(event)}
          >
            <Row
              align="center"
              style={{
                marginTop: isLarge && Platform.OS === 'ios' ? -spacing[3] : 0,
              }}
            >
              <Text variant="prose">
                {previousDegreeYear}/{getShortYear(degreeYear)}
              </Text>
              {yearOptions.length > 0 && (
                <Icon
                  style={{ marginLeft: spacing[1] }}
                  icon={faAngleDown}
                  color={colors.link}
                  size={12}
                />
              )}
            </Row>
          </StatefulMenuView>
        </View>
      ),
    });
  }, [
    navigation,
    spacing,
    degreeQuery,
    displayYear,
    t,
    colors.link,
    yearOptions,
    isLarge,
  ]);

  return (
    <DegreeContext.Provider value={{ degreeId, year: displayYear }}>
      <TopTabs.Navigator tabBar={props => <TopTabBar {...props} />}>
        <TopTabs.Screen
          name="DegreeInfoScreen"
          component={DegreeInfoScreen}
          options={{ title: t('degreeScreen.info') }}
        />
        <TopTabs.Screen
          name="Degree1TracksScreen"
          component={DegreeTracksScreen}
          options={{ title: t('degreeScreen.tracks') }}
        />
        <TopTabs.Screen
          name="DegreeJobOpportunitiesScreen"
          component={DegreeJobOpportunitiesScreen}
          options={{ title: t('degreeScreen.jobOpportunities') }}
        />
      </TopTabs.Navigator>
    </DegreeContext.Provider>
  );
};
