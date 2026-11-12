import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView } from 'react-native';

import { useAccessibility } from '@polito/lib/core';
import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Section,
} from '@polito/lib/ui';

import { useGetExams } from '../../../core/queries/examHooks';
import { ExamListItem } from '../components/ExamListItem';

export const ExamsScreen = () => {
  const { t } = useTranslation();
  const examsQuery = useGetExams();
  const { accessibilityListLabel } = useAccessibility();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      accessibilityRole="list"
      accessibilityLabel={t('examsScreen.total', {
        total: examsQuery.data?.length ?? 0,
      })}
      refreshControl={<RefreshControl queries={[examsQuery]} manual />}
    >
      <SafeAreaView>
        <Section>
          <OverviewList
            queries={examsQuery}
            indented
            skeleton={{ count: 5, leading: 'tile', trailing: 'chip' }}
            emptyState={{
              title: t('states.exams.emptyTitle'),
              text: t('states.exams.emptyText'),
            }}
            errorState={{
              title: t('states.exams.failedTitle'),
              text: t('states.exams.failedText'),
            }}
          >
            {examsQuery.data?.map((exam, index) => (
              <ExamListItem
                key={`${exam.id}` + exam.moduleNumber}
                exam={exam}
                accessible={true}
                accessibilityLabel={accessibilityListLabel(
                  index,
                  examsQuery.data.length,
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
