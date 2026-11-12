import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useIsOnline } from '@polito/lib/core';
import { useGetPerson } from '@polito/lib/features/people';
import {
  BottomBarSpacer,
  CtaButton,
  Text,
  TextField,
  type Theme,
  useStylesheet,
  useTextScale,
} from '@polito/lib/ui';
import { ExamStatusEnum } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FailureNote } from '../../../core/components/FailureNote';
import { useBookExam, useGetExams } from '../../../core/queries/examHooks';
import {
  MutationFailure,
  describeMutationFailure,
} from '../../../utils/mutationFailure';
import { TeachingStackParamList } from '../components/TeachingNavigator';

type Props = NativeStackScreenProps<TeachingStackParamList, 'ExamRequest'>;

/**
 * Asks the teacher for a place on an exam given on request. The reason is
 * required; once sent, the exam page shows the request in place.
 */
export const ExamRequestScreen = ({ route, navigation }: Props) => {
  const styles = useStylesheet(createStyles);
  const { t } = useTranslation();
  const isOnline = useIsOnline();
  const { scale } = useTextScale();
  // A box that shows the given number of lines before it scrolls
  const fieldHeight = (lines: number) => 24 * scale * lines + 24;

  const { id } = route.params;
  const examsQuery = useGetExams();
  const exam = examsQuery.data?.find(e => e.id === id);
  const teacher = useGetPerson(exam?.teacherId).data;

  const { mutateAsync: bookExam, isPending } = useBookExam(id);
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);
  const [failure, setFailure] = useState<MutationFailure>();

  // The exam page confirms the request in place
  const done = () => navigation.popTo('Exam', { id });

  const onSubmit = () => {
    if (!exam) return;
    if (!reason.trim()) {
      setShowError(true);
      return;
    }
    setFailure(undefined);
    return bookExam({
      courseShortcode: exam.courseShortcode,
      requestReason: reason.trim(),
    }).then(done, async error => {
      const described = await describeMutationFailure(error);
      // An answer lost on the way back: the request may have arrived
      const { data } = await examsQuery.refetch();
      const now = data?.find(e => e.id === id);
      if (now?.status === ExamStatusEnum.Requested) done();
      else setFailure(described);
    });
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <Text>
          {teacher
            ? t('examRequestScreen.intro', {
                teacher: `${teacher.firstName} ${teacher.lastName}`,
              })
            : t('examRequestScreen.introNoTeacher')}
        </Text>
        <TextField
          variant="boxed"
          label={t('examRequestScreen.reasonLabel')}
          multiline
          numberOfLines={5}
          inputStyle={{ minHeight: fieldHeight(5) }}
          autoCapitalize="sentences"
          value={reason}
          onChangeText={value => {
            setReason(value);
            if (value.trim()) setShowError(false);
          }}
          error={showError ? t('examRequestScreen.reasonError') : undefined}
        />
        {failure && (
          <FailureNote
            title={t('examRequestScreen.failedTitle')}
            failure={failure}
            lostText={t('examRequestScreen.lostAnswer')}
          />
        )}
        <CtaButton
          absolute={false}
          containerStyle={styles.button}
          title={
            isOnline
              ? t('examRequestScreen.send')
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

const createStyles = ({ colors, layout, spacing }: Theme) =>
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
    button: {
      padding: 0,
    },
  });
