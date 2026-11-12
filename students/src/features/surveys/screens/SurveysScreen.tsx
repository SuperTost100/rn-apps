import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { useQueryStates } from '@polito/lib/core';
import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Section,
  SectionHeader,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useGetSurveys } from '../../../core/queries/surveysHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { SurveyListItem } from '../components/SurveyListItem';

interface Props {
  navigation: NativeStackNavigationProp<ServiceStackParamList, 'Surveys'>;
}

export const SurveysScreen = (_: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const surveysQuery = useGetSurveys();
  const states = useQueryStates(surveysQuery, { isEmpty: () => false });

  const IncompleteSurveys = () => {
    const incompleteSurveys = (surveysQuery.data || [])
      .filter(survey => !survey.isCompiled)
      .sort(
        (a, b) =>
          b.startsAt.getTime() - a.startsAt.getTime() ||
          b.title.localeCompare(a.title),
      );

    return (
      <Section>
        <SectionHeader title={t('surveysScreen.toBeCompiledTitle')} />
        <OverviewList
          indented
          states={states}
          skeleton={{ count: 2 }}
          emptyState={{ title: t('surveysScreen.toBeCompiledEmptyState') }}
          errorState={{ title: t('states.surveys.failedTitle') }}
        >
          {incompleteSurveys?.map(survey => (
            <SurveyListItem survey={survey} key={survey.id} />
          ))}
        </OverviewList>
      </Section>
    );
  };

  const CompiledSurveys = () => {
    const compiledSurveys = (surveysQuery.data || [])
      .filter(survey => survey.isCompiled)
      .sort(
        (a, b) =>
          b.startsAt.getTime() - a.startsAt.getTime() ||
          b.title.localeCompare(a.title),
      );

    const renderedCompiledSurveys = useMemo(
      () => compiledSurveys.slice(0, 4),
      [compiledSurveys],
    );

    return (
      <Section>
        <SectionHeader
          title={t('surveysScreen.compiledTitle')}
          linkTo={{
            screen: 'SurveyList',
            params: { isCompiled: true },
          }}
          linkToMoreCount={
            compiledSurveys.length - renderedCompiledSurveys.length
          }
        />
        {states.status !== 'error' && (
          <OverviewList
            indented
            states={states}
            skeleton={{ count: 4 }}
            emptyState={{ title: t('surveysScreen.compiledEmptyState') }}
          >
            {renderedCompiledSurveys.map(survey => (
              <SurveyListItem survey={survey} key={survey.id} />
            ))}
          </OverviewList>
        )}
      </Section>
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[surveysQuery]} manual />}
      contentContainerStyle={styles.container}
    >
      <SafeAreaView>
        <IncompleteSurveys />
        <CompiledSurveys />
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: spacing[5],
    },
  });
