import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform } from 'react-native';

import { useQueryStates, useScreenTitle } from '@polito/lib/core';
import {
  BottomBarSpacer,
  IndentedDivider,
  QueryStateView,
  RefreshControl,
  useSafeAreaSpacing,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGetSurveys } from '../../../core/queries/surveysHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { SurveyListItem } from '../components/SurveyListItem';

type Props = NativeStackScreenProps<ServiceStackParamList, 'SurveyList'>;

export const SurveyListScreen = ({ route }: Props) => {
  const { t } = useTranslation();
  const { isCompiled } = route.params;

  const surveysQuery = useGetSurveys();
  const { paddingHorizontal } = useSafeAreaSpacing();

  const compiledSurveys = (surveysQuery.data || [])
    .filter(survey => survey.isCompiled === isCompiled)
    .sort(
      (a, b) =>
        b.startsAt.getTime() - a.startsAt.getTime() ||
        b.title.localeCompare(a.title),
    );
  const states = useQueryStates(surveysQuery, {
    isEmpty: () => compiledSurveys.length === 0,
  });

  const labels = useMemo(() => {
    return {
      title: isCompiled
        ? t('surveysScreen.compiledTitle')
        : t('cpdSurveysScreen.toBeCompiledTitle'),
      emptyState: isCompiled
        ? t('ticketsScreen.closedEmptyState')
        : t('ticketsScreen.openEmptyState'),
    };
  }, [isCompiled, t]);

  useScreenTitle(labels.title);

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={paddingHorizontal}
      refreshControl={<RefreshControl queries={[surveysQuery]} manual />}
      data={compiledSurveys}
      renderItem={({ item }) => <SurveyListItem survey={item} key={item.id} />}
      ItemSeparatorComponent={Platform.select({
        ios: IndentedDivider,
      })}
      ListFooterComponent={<BottomBarSpacer />}
      ListEmptyComponent={
        <QueryStateView
          states={states}
          skeleton={{ count: 6, card: false }}
          emptyState={{ title: t('surveysScreen.compiledEmptyState') }}
          errorState={{ title: t('states.surveys.failedTitle') }}
        >
          {null}
        </QueryStateView>
      }
    />
  );
};
