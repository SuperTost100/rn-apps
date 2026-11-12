import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableHighlight, View } from 'react-native';

import { faSquare, faSquareCheck } from '@fortawesome/free-regular-svg-icons';
import { useIsOnline } from '@polito/lib/core';
import { useGetPerson } from '@polito/lib/features/people';
import {
  BottomBarSpacer,
  CtaButton,
  Icon,
  Text,
  TextField,
  type Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { ExamStatusEnum } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FailureNote } from '../../../core/components/FailureNote';
import {
  useGetExams,
  useRescheduleRequest,
} from '../../../core/queries/examHooks';
import {
  MutationFailure,
  describeMutationFailure,
} from '../../../utils/mutationFailure';
import { TeachingStackParamList } from '../components/TeachingNavigator';

type Props = NativeStackScreenProps<TeachingStackParamList, 'ExamReschedule'>;

/**
 * Asks the teacher for another date: the reason and the dates the student
 * suggests, both required, and the statement the university asks for.
 * Errors show under each field when the student sends; once sent, the exam
 * page confirms it in place.
 */
export const ExamRescheduleScreen = ({ navigation, route }: Props) => {
  const { id } = route.params;
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const isOnline = useIsOnline();
  const { scale } = useTextScale();
  // A box that shows the given number of lines before it scrolls
  const fieldHeight = (lines: number) => 24 * scale * lines + 24;
  const examsQuery = useGetExams();
  const exam = examsQuery.data?.find(e => e.id === id);
  const teacher = useGetPerson(exam?.teacherId).data;
  const { mutateAsync: request, isPending } = useRescheduleRequest(id);

  const [reason, setReason] = useState('');
  const [dates, setDates] = useState('');
  const [declared, setDeclared] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [failure, setFailure] = useState<MutationFailure>();

  const reasonError =
    showErrors && !reason.trim()
      ? t('examRescheduleScreen.reasonError')
      : undefined;
  const datesError =
    showErrors && !dates.trim()
      ? t('examRescheduleScreen.datesError')
      : undefined;
  const declarationError =
    showErrors && !declared
      ? t('examRescheduleScreen.declarationError')
      : undefined;

  const onSubmit = () => {
    if (!exam) return;
    if (!reason.trim() || !dates.trim() || !declared) {
      setShowErrors(true);
      return;
    }
    setFailure(undefined);
    return request({
      courseShortcode: exam.courseShortcode,
      requestReason: reason.trim(),
      requestDetails: dates.trim(),
    }).then(
      // The exam page confirms the request in place
      () => navigation.popTo('Exam', { id, dateChangeSent: true }),
      async error => {
        setFailure(await describeMutationFailure(error));
        examsQuery.refetch();
      },
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <Text>
          {[
            teacher
              ? t('examRescheduleScreen.intro', {
                  teacher: `${teacher.firstName} ${teacher.lastName}`,
                })
              : t('examRescheduleScreen.introNoTeacher'),
            exam?.status === ExamStatusEnum.Booked
              ? t('examScreen.dateChangeKeepsBooking')
              : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
        </Text>
        <TextField
          variant="boxed"
          label={t('examRescheduleScreen.reasonLabel')}
          multiline
          numberOfLines={4}
          inputStyle={{ minHeight: fieldHeight(4) }}
          autoCapitalize="sentences"
          value={reason}
          onChangeText={setReason}
          error={reasonError}
        />
        <TextField
          variant="boxed"
          label={t('examRescheduleScreen.datesLabel')}
          multiline
          numberOfLines={3}
          inputStyle={{ minHeight: fieldHeight(3) }}
          autoCapitalize="sentences"
          value={dates}
          onChangeText={setDates}
          error={datesError}
        />
        <View>
          <TouchableHighlight
            underlayColor={colors.touchableHighlight}
            onPress={() => setDeclared(value => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: declared }}
            accessibilityLabel={t('examRescheduleScreen.declaration')}
            accessibilityHint={declarationError}
            style={styles.check}
          >
            <View style={styles.checkRow}>
              <Icon
                icon={declared ? faSquareCheck : faSquare}
                size={24}
                color={declarationError ? colors.dangerText : colors.link}
              />
              <Text style={styles.checkText}>
                {t('examRescheduleScreen.declaration')}
              </Text>
            </View>
          </TouchableHighlight>
          {declarationError && (
            <Text variant="secondaryText" style={{ color: colors.dangerText }}>
              {declarationError}
            </Text>
          )}
        </View>
        {failure && (
          <FailureNote
            title={t('examRescheduleScreen.failedTitle')}
            failure={failure}
            lostText={t('examRescheduleScreen.lostAnswer')}
          />
        )}
        <CtaButton
          absolute={false}
          containerStyle={styles.button}
          title={
            isOnline
              ? t('examRescheduleScreen.button')
              : t('examScreen.requestNeedsConnection')
          }
          action={onSubmit}
          loading={isPending}
          disabled={!isOnline || !exam}
        />
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ colors, controls, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    form: {
      gap: spacing[4],
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      paddingBottom: spacing[6],
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    check: {
      minHeight: controls.touchTarget,
      justifyContent: 'center',
      borderRadius: shapes.md,
      marginHorizontal: -spacing[2],
      paddingHorizontal: spacing[2],
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
    },
    checkText: {
      flex: 1,
    },
    button: {
      padding: 0,
    },
  });
