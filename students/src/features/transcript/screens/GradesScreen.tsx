import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Section,
  SectionHeader,
  Text,
  type Theme,
  useStylesheet,
} from '@polito/lib/ui';

import {
  useGetGrades,
  useGetProvisionalGrades,
} from '../../../core/queries/studentHooks';
import { ProvisionalGradeListItem } from '../components/ProvisionalGradeListItem';
import { RecordedGradeListItem } from '../components/RecordedGradeListItem';

/**
 * Provisional grades first, each with what the student can still do, then
 * the recorded grades, newest first
 */
export const GradesScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const gradesQuery = useGetGrades();
  const provisionalGradesQuery = useGetProvisionalGrades();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          queries={[gradesQuery, provisionalGradesQuery]}
          manual
        />
      }
    >
      <Section>
        <SectionHeader title={t('transcriptGradesScreen.provisionalTitle')} />
        <OverviewList
          queries={provisionalGradesQuery}
          skeleton={{
            count: 1,
            leading: 'none',
            trailing: 'value',
            subtitleLines: 2,
          }}
          emptyState={{
            title: t('transcriptGradesScreen.provisionalEmptyState'),
          }}
          errorState={{ title: t('states.grades.failedProvisionalTitle') }}
        >
          {provisionalGradesQuery.data?.map(grade => (
            <ProvisionalGradeListItem key={grade.id} grade={grade} />
          ))}
        </OverviewList>
      </Section>
      <Section>
        <SectionHeader
          title={t('transcriptGradesScreen.recordedTitle')}
          trailingItem={
            gradesQuery.data?.length ? (
              <Text variant="secondaryText" style={styles.count}>
                {t('transcriptGradesScreen.examsCount', {
                  total: gradesQuery.data.length,
                })}
              </Text>
            ) : undefined
          }
        />
        <OverviewList
          queries={gradesQuery}
          skeleton={{ count: 8, leading: 'none', trailing: 'value' }}
          emptyState={{
            title: t('states.grades.emptyTitle'),
            text: t('states.grades.emptyText'),
          }}
          errorState={{ title: t('states.grades.failedTitle') }}
        >
          {gradesQuery.data?.map((grade, index) => (
            <RecordedGradeListItem
              grade={grade}
              key={`${grade.shortcode}-${index}`}
            />
          ))}
        </OverviewList>
      </Section>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      paddingTop: spacing[4],
    },
    count: {
      paddingBottom: spacing[3],
    },
  });
