import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { useScreenTitle } from '@polito/lib/core';
import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGetSurveys } from '../../../core/queries/surveysHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { SurveyListItem } from '../components/SurveyListItem';

type Props = NativeStackScreenProps<ServiceStackParamList, 'SurveyList'>;

/** Every completed survey, or every one still to fill in, newest first */
export const SurveyListScreen = ({ route }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { isCompiled } = route.params;

  const surveysQuery = useGetSurveys();

  const surveys = (surveysQuery.data || [])
    .filter(survey => survey.isCompiled === isCompiled)
    .sort(
      (a, b) =>
        b.startsAt.getTime() - a.startsAt.getTime() ||
        b.title.localeCompare(a.title),
    );

  useScreenTitle(
    isCompiled
      ? t('serviceInfo.surveys.completedTitle')
      : t('serviceInfo.surveys.toFillInTitle'),
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl queries={[surveysQuery]} manual />}
    >
      <SafeAreaView>
        <OverviewList
          queries={surveysQuery}
          isEmpty={() => surveys.length === 0}
          skeleton={{ count: 6, trailing: isCompiled ? 'chip' : 'chevron' }}
          emptyState={{
            title: isCompiled
              ? t('serviceInfo.surveys.noneCompletedTitle')
              : t('serviceInfo.surveys.noneToFillInTitle'),
          }}
          errorState={{ title: t('states.surveys.failedTitle') }}
        >
          {surveys.map(survey => (
            <SurveyListItem
              survey={survey}
              key={survey.id}
              showStatus={survey.isMandatory}
            />
          ))}
        </OverviewList>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    // The card's own 8 px plus these 8: 16 px under the header
    container: {
      paddingTop: spacing[2],
    },
  });
