import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView } from 'react-native';

import { useScreenTitle } from '@polito/lib/core';
import { useAccessibility } from '@polito/lib/core';
import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Section,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  useGetCpdSurveys,
  useGetSurveys,
} from '../../../core/queries/surveysHooks';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { SurveyListItem } from '../components/SurveyListItem';

type Props = NativeStackScreenProps<TeachingStackParamList, 'CpdSurveys'>;

export const CpdSurveysScreen = ({ route }: Props) => {
  const surveysQuery = useGetSurveys();
  const { data } = useGetCpdSurveys();

  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { accessibilityListLabel } = useAccessibility();

  const { categoryId, typeId, typeName } = route.params;

  useScreenTitle(typeName);

  const surveys = useMemo(
    () =>
      data?.filter(
        survey =>
          survey.category.id === categoryId && survey.type.id === typeId,
      ),
    [categoryId, data, typeId],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      accessibilityRole="list"
      accessibilityLabel={t('cpdSurveysScreen.total', {
        total: surveys?.length ?? 0,
      })}
      refreshControl={<RefreshControl queries={[surveysQuery]} manual />}
    >
      <SafeAreaView>
        <Section style={{ paddingTop: spacing[2] }}>
          <OverviewList
            queries={surveysQuery}
            isEmpty={() => (surveys?.length ?? 0) === 0}
            skeleton={{ count: 3, trailing: 'chip' }}
            emptyState={{ title: t('cpdSurveysScreen.emptyState') }}
            errorState={{ title: t('states.surveys.failedTitle') }}
          >
            {surveys?.map((survey, index) => (
              <SurveyListItem
                key={survey.id}
                survey={survey}
                showStatus
                accessibilityLabel={accessibilityListLabel(
                  index,
                  surveys.length,
                )}
              />
            ))}
          </OverviewList>
        </Section>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};
