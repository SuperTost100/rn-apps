import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  APP_TIMEZONE,
  dateFormatter,
  formatDate,
  usePreferencesContext,
} from '@polito/lib/core';
import {
  ListItem,
  StatusChip,
  StatusChipTone,
  Text,
  type Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import {
  ProvisionalGrade,
  ProvisionalGradeStateEnum,
} from '@polito/student-api-client';

import { DateTime } from 'luxon';

import { AppPreferences } from '../../../core/types/preferences';
import { useGradeMask } from './HideGradesButton';

type Props = {
  grade: ProvisionalGrade;
};

export type ProvisionalStatus =
  | 'decide'
  | 'published'
  | 'accepted'
  | 'rejected';

/**
 * Where a provisional grade stands for the student: waiting for a decision
 * when the server allows one, otherwise its state
 */
export const provisionalStatus = (
  grade: ProvisionalGrade,
): ProvisionalStatus => {
  if (grade.state === ProvisionalGradeStateEnum.Rejected) return 'rejected';
  if (grade.canBeAccepted || grade.canBeRejected) return 'decide';
  if (grade.state === ProvisionalGradeStateEnum.Confirmed) return 'accepted';
  return 'published';
};

export const PROVISIONAL_TONE: Record<ProvisionalStatus, StatusChipTone> = {
  decide: 'warning',
  published: 'info',
  accepted: 'success',
  rejected: 'neutral',
};

/** "Sun 15 Nov", in the app time zone and language */
export const useShortDay = () => {
  const { language } = usePreferencesContext<AppPreferences>();
  return (date: Date) =>
    DateTime.fromJSDate(date, { zone: APP_TIMEZONE })
      .setLocale(language)
      .toFormat('ccc d LLL');
};

/**
 * A provisional grade: the course, when it was published, the deadline to
 * decide and its state as a chip under the text, so the chip is never cut.
 * The grade is the trailing figure.
 */
export const ProvisionalGradeListItem = ({ grade }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { hidden, mask } = useGradeMask();
  // At large text the grade goes under the text, so the course name keeps
  // the row's width and no word breaks
  const { isLarge } = useTextScale();
  const shortDay = useShortDay();
  const formatHHmm = dateFormatter('HH:mm');
  const status = provisionalStatus(grade);
  const chip = t(`transcriptGradesScreen.provisionalChip.${status}`);

  const published = [
    t('transcriptGradesScreen.publishedOn', {
      date: shortDay(new Date(grade.date)),
    }),
    t('common.creditsWithUnit', { credits: grade.credits }),
  ].join(' · ');
  const deadline =
    status === 'decide' && grade.canBeRejected && grade.rejectingExpiresAt
      ? t('transcriptGradesScreen.rejectUntil', {
          date: shortDay(grade.rejectingExpiresAt),
        })
      : status === 'rejected' && grade.rejectedAt
        ? t('transcriptGradesScreen.rejectedSubtitle', {
            date: formatDate(grade.rejectedAt),
            time: formatHHmm(grade.rejectedAt),
          })
        : undefined;
  const gradeText = status === 'rejected' ? '-' : mask(grade.grade);

  return (
    <ListItem
      title={grade.courseName}
      subtitle={
        <View style={styles.lines}>
          <Text variant="secondaryText">{published}</Text>
          {deadline && (
            <Text
              variant="secondaryText"
              weight={status === 'decide' ? 'semibold' : undefined}
              style={status === 'decide' && { color: colors.warningText }}
            >
              {deadline}
            </Text>
          )}
          <View style={styles.chip}>
            <StatusChip label={chip} tone={PROVISIONAL_TONE[status]} />
          </View>
          {isLarge && (
            <Text variant="cardTitle" style={styles.grade}>
              {gradeText}
            </Text>
          )}
        </View>
      }
      trailingItem={
        isLarge ? undefined : (
          <Text variant="cardTitle" style={styles.grade}>
            {gradeText}
          </Text>
        )
      }
      showChevron
      accessibilityLabel={[
        grade.courseName,
        hidden
          ? t('transcriptGradesScreen.gradeHidden')
          : t('transcriptGradesScreen.gradeLabel', { grade: gradeText }),
        published,
        deadline,
        chip,
      ]
        .filter(Boolean)
        .join(', ')}
      linkTo={{ screen: 'ProvisionalGrade', params: { id: grade.id } }}
    />
  );
};

const createStyles = ({ colors, spacing }: Theme) =>
  StyleSheet.create({
    lines: {
      gap: spacing[0.5],
    },
    chip: {
      flexDirection: 'row',
      marginTop: spacing[1],
    },
    grade: {
      color: colors.title,
      fontVariant: ['tabular-nums'],
    },
  });
