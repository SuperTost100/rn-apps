import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { APP_TIMEZONE, usePreferencesContext } from '@polito/lib/core';
import { ListItem, Text, type Theme, useStylesheet } from '@polito/lib/ui';
import { ExamGrade } from '@polito/student-api-client';

import { DateTime } from 'luxon';

import { AppPreferences } from '../../../core/types/preferences';
import { formatGrade } from '../../../utils/grades';
import { useGradeMask } from './HideGradesButton';

type RecordedGradeProps = {
  grade: ExamGrade;
};

/** "8 Sept 2026", in the app time zone and language */
export const useRecordedDay = () => {
  const { language } = usePreferencesContext<AppPreferences>();
  return (date: Date) =>
    DateTime.fromJSDate(date, { zone: APP_TIMEZONE })
      .setLocale(language)
      .toFormat('d LLL yyyy');
};

/** A recorded grade: the course, date and credits, the grade at the end */
export const RecordedGradeListItem = ({ grade }: RecordedGradeProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { hidden, mask } = useGradeMask();
  const recordedDay = useRecordedDay();
  const gradeText = mask(t(formatGrade(grade.grade)));
  const subtitle = [
    recordedDay(grade.date),
    t('common.creditsWithUnit', { credits: grade.credits }),
    grade.creditsCountTowardsDegree === false
      ? t('transcriptGradesScreen.notCounted')
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListItem
      title={grade.courseName}
      subtitle={subtitle}
      trailingItem={
        <Text variant="cardTitle" style={styles.grade}>
          {gradeText}
        </Text>
      }
      showChevron
      accessibilityLabel={[
        grade.courseName,
        hidden
          ? t('transcriptGradesScreen.gradeHidden')
          : t('transcriptGradesScreen.gradeLabel', { grade: gradeText }),
        subtitle,
      ].join(', ')}
      linkTo={{
        screen: 'RecordedGrade',
        params: {
          grade: {
            ...grade,
            date: grade.date.toISOString(),
          },
        },
      }}
    />
  );
};

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    grade: {
      color: colors.title,
      fontVariant: ['tabular-nums'],
    },
  });
