import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  APP_TIMEZONE,
  isValidDate,
  useFeedbackContext,
  useIsOnline,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  CtaButton,
  type Option,
  RadioGroup,
  Text,
  type Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { ExamStatusEnum } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DateTime } from 'luxon';

import { FailureNote } from '../../../core/components/FailureNote';
import { useBookExam, useGetExams } from '../../../core/queries/examHooks';
import {
  MutationFailure,
  describeMutationFailure,
} from '../../../utils/mutationFailure';
import { useExamWhen } from '../components/ExamListItem';
import { TeachingStackParamList } from '../components/TeachingNavigator';

type Props = NativeStackScreenProps<TeachingStackParamList, 'ExamQuestion'>;

/**
 * The question some teachers ask before a booking. Booking from here goes
 * back to the exam page, which shows the booking in place.
 */
export const ExamQuestionScreen = ({ route, navigation }: Props) => {
  const styles = useStylesheet(createStyles);
  const { t } = useTranslation();
  const { setFeedback } = useFeedbackContext();
  const isOnline = useIsOnline();
  const examWhen = useExamWhen();

  const { id } = route.params;
  const examsQuery = useGetExams();
  const exam = examsQuery.data?.find(e => e.id === id);

  const { mutateAsync: bookExam, isPending } = useBookExam(id);
  const [value, setValue] = useState<number>();
  const [showError, setShowError] = useState(false);
  const [failure, setFailure] = useState<MutationFailure>();

  useEffect(() => {
    if (exam && !exam.question) navigation.goBack();
  }, [exam, navigation]);

  const options: Option<number>[] | undefined = useMemo(
    () =>
      exam?.question?.options.map((label, index) => ({ label, value: index })),
    [exam],
  );

  const done = () => {
    if (!exam) return;
    const start =
      exam.examStartsAt && isValidDate(exam.examStartsAt)
        ? DateTime.fromJSDate(exam.examStartsAt, { zone: APP_TIMEZONE })
        : undefined;
    setFeedback({
      text: t('examScreen.bookedFeedback', {
        course: exam.courseName,
        day: examWhen(exam),
      }),
      action: start
        ? {
            label: t('examScreen.viewInAgenda'),
            onPress: () =>
              navigation.navigate('AgendaTab' as any, {
                screen: 'Agenda',
                params: { date: start.toISODate(), requestedAt: Date.now() },
                pop: true,
              }),
          }
        : undefined,
    });
    navigation.popTo('Exam', { id });
  };

  const onSubmit = () => {
    if (!exam?.question) return;
    if (value === undefined) {
      setShowError(true);
      return;
    }
    setFailure(undefined);
    return bookExam({
      courseShortcode: exam.courseShortcode,
      questionId: exam.question.id,
      questionOption: value + 1,
    }).then(done, async error => {
      const described = await describeMutationFailure(error);
      // An answer lost on the way back: the booking may have gone through
      const { data } = await examsQuery.refetch();
      const now = data?.find(e => e.id === id);
      if (now?.status === ExamStatusEnum.Booked) done();
      else setFailure(described);
    });
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={styles.intro}>
        <Text variant="secondaryText">{t('examQuestionScreen.intro')}</Text>
        {exam?.question && (
          <Text variant="cardTitle" accessibilityRole="header">
            {exam.question.statement}
          </Text>
        )}
      </View>
      {options && (
        <Card>
          <RadioGroup
            options={options}
            value={value as number}
            setValue={next => {
              setValue(next);
              setShowError(false);
            }}
            showError={showError}
            accessibilityLabel={exam?.question?.statement}
          />
        </Card>
      )}
      <View style={styles.actions}>
        {failure && (
          <FailureNote
            title={t('examScreen.bookFailedTitle')}
            failure={failure}
            lostText={t('examScreen.lostAnswer')}
          />
        )}
        <CtaButton
          absolute={false}
          containerStyle={styles.button}
          title={
            isOnline
              ? t('examQuestionScreen.book')
              : t('examScreen.bookNeedsConnection')
          }
          action={onSubmit}
          loading={isPending}
          disabled={!isOnline || !exam?.question}
        />
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    intro: {
      gap: spacing[2],
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      paddingBottom: spacing[2],
    },
    actions: {
      gap: spacing[4],
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
    },
    button: {
      padding: 0,
    },
  });
