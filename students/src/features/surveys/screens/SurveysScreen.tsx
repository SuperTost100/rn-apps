import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { APP_TIMEZONE, useQueryStates } from '@polito/lib/core';
import {
  BottomBarSpacer,
  OverviewList,
  QueryStateView,
  RefreshControl,
  Section,
  SectionHeader,
  SkeletonLine,
  SkeletonRegion,
  SkeletonRows,
  StateBlock,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { Survey } from '@polito/student-api-client';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DateTime } from 'luxon';

import { useGetSurveys } from '../../../core/queries/surveysHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { SurveyListItem } from '../components/SurveyListItem';

interface Props {
  navigation: NativeStackNavigationProp<ServiceStackParamList, 'Surveys'>;
}

/** How many completed surveys the page shows before "See all" */
const COMPLETED_SHOWN = 4;

const newestFirst = (a: Survey, b: Survey) =>
  b.startsAt.getTime() - a.startsAt.getTime() || b.title.localeCompare(a.title);

/** To fill in first, then by date */
const toFillInFirst = (a: Survey, b: Survey) =>
  Number(a.isCompiled) - Number(b.isCompiled) || newestFirst(a, b);

/** The page while it loads: two sections of rows */
const SurveysSkeleton = () => {
  const styles = useStylesheet(createStyles);
  return (
    <SkeletonRegion>
      {[3, 1].map((count, i) => (
        <Section key={i}>
          <SkeletonLine variant="heading" width="60%" style={styles.gutter} />
          <SkeletonRows count={count} trailing="chip" />
        </Section>
      ))}
    </SkeletonRegion>
  );
};

/**
 * Surveys in the order they need doing: the mandatory teaching surveys
 * (CPD) still open, then the other open ones, then the completed ones
 */
export const SurveysScreen = (_: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const surveysQuery = useGetSurveys();
  const surveys = surveysQuery.data ?? [];
  const states = useQueryStates(surveysQuery, {
    isEmpty: () => surveys.length === 0,
  });
  const now = Date.now();

  // Mandatory surveys whose window is still open, done or not
  const cpd = surveys
    .filter(s => s.isMandatory && s.endsAt.getTime() >= now)
    .sort(toFillInFirst);
  const cpdToFill = cpd.filter(s => !s.isCompiled);
  const nextDue = cpdToFill.reduce<Date | undefined>(
    (min, s) => (!min || s.endsAt < min ? s.endsAt : min),
    undefined,
  );
  const others = surveys
    .filter(s => !s.isMandatory && !s.isCompiled)
    .sort(newestFirst);
  const shownIds = new Set([...cpd, ...others].map(s => s.id));
  const completed = surveys
    .filter(s => s.isCompiled && !shownIds.has(s.id))
    .sort(newestFirst);
  const completedShown = completed.slice(0, COMPLETED_SHOWN);
  const nothingToFill = cpdToFill.length === 0 && others.length === 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[surveysQuery]} manual />}
      contentContainerStyle={styles.container}
    >
      <SafeAreaView>
        <QueryStateView
          states={states}
          skeleton={<SurveysSkeleton />}
          errorState={{ title: t('states.surveys.failedTitle') }}
          emptyState={{
            title: t('serviceInfo.surveys.emptyTitle'),
            text: t('serviceInfo.surveys.emptyText'),
          }}
        >
          {nothingToFill && (
            <StateBlock
              card
              title={t('surveysScreen.toBeCompiledEmptyState')}
              style={styles.block}
            />
          )}
          {cpd.length > 0 && (
            <Section>
              <SectionHeader
                title={t('serviceInfo.surveys.cpdTitle')}
                ellipsizeTitle={false}
                trailingItem={
                  cpdToFill.length > 0 ? (
                    <Text variant="secondaryText" style={styles.aside}>
                      {t('serviceInfo.surveys.toFillInCount', {
                        count: cpdToFill.length,
                      })}
                    </Text>
                  ) : undefined
                }
              />
              {nextDue && (
                <Text variant="secondaryText" style={styles.note}>
                  {t('serviceInfo.surveys.due', {
                    date: DateTime.fromJSDate(nextDue, {
                      zone: APP_TIMEZONE,
                    }).toFormat('ccc d LLL'),
                  })}
                </Text>
              )}
              <OverviewList>
                {cpd.map(survey => (
                  <SurveyListItem survey={survey} key={survey.id} showStatus />
                ))}
              </OverviewList>
            </Section>
          )}
          {others.length > 0 && (
            <Section>
              <SectionHeader title={t('serviceInfo.surveys.otherTitle')} />
              <OverviewList>
                {others.map(survey => (
                  <SurveyListItem survey={survey} key={survey.id} />
                ))}
              </OverviewList>
            </Section>
          )}
          {completed.length > 0 && (
            <Section>
              <SectionHeader
                title={t('serviceInfo.surveys.completedTitle')}
                linkTo={{
                  screen: 'SurveyList',
                  params: { isCompiled: true },
                }}
                linkToMoreCount={completed.length - completedShown.length}
              />
              <OverviewList>
                {completedShown.map(survey => (
                  <SurveyListItem
                    survey={survey}
                    key={survey.id}
                    showStatus={survey.isMandatory}
                  />
                ))}
              </OverviewList>
            </Section>
          )}
        </QueryStateView>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    // The first section mark 24 px under the header
    container: {
      paddingTop: spacing[6],
    },
    gutter: {
      marginHorizontal: layout.gutter,
      marginBottom: spacing[1],
    },
    aside: {
      paddingBottom: spacing[0.5],
    },
    note: {
      paddingHorizontal: layout.gutter,
      paddingBottom: spacing[1],
    },
    block: {
      marginBottom: layout.sectionGap - spacing[2],
    },
  });
