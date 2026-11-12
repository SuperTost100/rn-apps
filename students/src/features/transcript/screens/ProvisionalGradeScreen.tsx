import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import {
  faCircleCheck,
  faCircleInfo,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  useFeedbackContext,
  useIsOnline,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import { useGetPerson } from '@polito/lib/features/people';
import {
  BottomBarSpacer,
  Card,
  CtaButton,
  Icon,
  InfoMessage,
  ListItem,
  OverviewList,
  PersonListItem,
  RefreshControl,
  RegionStateBlock,
  Section,
  SectionHeader,
  SkeletonDetail,
  Text,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { ProvisionalGrade } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { DateTime } from 'luxon';

import { FailureNote } from '../../../core/components/FailureNote';
import {
  PROVISIONAL_GRADES_QUERY_KEY,
  useAcceptProvisionalGrade,
  useGetProvisionalGrades,
  useRejectProvisionalGrade,
} from '../../../core/queries/studentHooks';
import { AppPreferences } from '../../../core/types/preferences';
import {
  MutationFailure,
  describeMutationFailure,
} from '../../../utils/mutationFailure';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { GradeFigure } from '../components/GradeFigure';
import { useGradeMask } from '../components/HideGradesButton';
import {
  provisionalStatus,
  useShortDay,
} from '../components/ProvisionalGradeListItem';

type Props = NativeStackScreenProps<TeachingStackParamList, 'ProvisionalGrade'>;

type Decision = 'accept' | 'reject';

/**
 * A provisional grade: the grade large at the top, what happens next, and
 * Accept and Reject while the server allows them. Both ask once; the
 * result shows in place with a short message.
 */
export const ProvisionalGradeScreen = ({ route }: Props) => {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { id } = route.params;
  const gradesQuery = useGetProvisionalGrades();
  const grade = useMemo(
    () => gradesQuery.data?.find(g => g.id === id),
    [gradesQuery.data, id],
  );
  const states = useQueryStates(gradesQuery, { isEmpty: () => !grade });
  const teacher = useGetPerson(grade?.teacherId ?? undefined).data;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[gradesQuery]} manual />}
    >
      {states.status === 'loading' && (
        <SkeletonDetail title={false} cards={[260, 96, 120]} />
      )}
      <RegionStateBlock
        states={states}
        emptyState={{
          title: t('provisionalGradeScreen.notFoundTitle'),
          text: t('provisionalGradeScreen.notFoundText'),
        }}
        errorState={{ title: t('provisionalGradeScreen.failedTitle') }}
        style={{ marginTop: spacing[4] }}
      />
      {states.status === 'ready' && grade && (
        <>
          <DecisionCard grade={grade} />
          {!!grade.teacherMessage && (
            <Section style={{ marginTop: spacing[6] }}>
              <SectionHeader title={t('provisionalGradeScreen.fromTeacher')} />
              <Card padded>
                <Text>{grade.teacherMessage}</Text>
              </Card>
            </Section>
          )}
          <OverviewList indented style={{ marginTop: spacing[2] }}>
            {teacher && (
              <PersonListItem person={teacher} subtitle={t('common.teacher')} />
            )}
            <ListItem
              leadingItem={<Icon icon={faBookOpen} size={20} />}
              title={t('common.creditsWithUnit', { credits: grade.credits })}
              subtitle={t('provisionalGradeScreen.credits')}
            />
          </OverviewList>
        </>
      )}
      <View style={{ height: spacing[4] }} />
      <BottomBarSpacer />
    </ScrollView>
  );
};

const DecisionCard = ({ grade }: { grade: ProvisionalGrade }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { language } = usePreferencesContext<AppPreferences>();
  const { setFeedback } = useFeedbackContext();
  const isOnline = useIsOnline();
  const client = useQueryClient();
  const { hidden, mask } = useGradeMask();
  const shortDay = useShortDay();
  const accept = useAcceptProvisionalGrade();
  const reject = useRejectProvisionalGrade();
  const [failure, setFailure] = useState<
    MutationFailure & { decision: Decision }
  >();

  const status = provisionalStatus(grade);
  const busy = accept.isPending || reject.isPending;
  const gradeText = status === 'rejected' ? '-' : mask(grade.grade);
  const deadline = grade.rejectingExpiresAt
    ? DateTime.fromJSDate(grade.rejectingExpiresAt, {
        zone: APP_TIMEZONE,
      }).setLocale(language)
    : undefined;

  /** After a failure the card shows what the server now says */
  const settle = async (decision: Decision, error: unknown) => {
    const described = await describeMutationFailure(error);
    await client.refetchQueries({ queryKey: PROVISIONAL_GRADES_QUERY_KEY });
    const now = client
      .getQueryData<ProvisionalGrade[]>(PROVISIONAL_GRADES_QUERY_KEY)
      ?.find(g => g.id === grade.id);
    if (now && provisionalStatus(now) !== 'decide') return;
    setFailure({ decision, ...described });
  };

  const decide = (decision: Decision) => {
    const isAccept = decision === 'accept';
    Alert.alert(
      hidden
        ? t(`provisionalGradeScreen.${decision}TitleHidden`)
        : t(`provisionalGradeScreen.${decision}Title`, { grade: grade.grade }),
      t(`provisionalGradeScreen.${decision}Text`, { course: grade.courseName }),
      [
        {
          text: isAccept
            ? t('provisionalGradeScreen.notNow')
            : t('provisionalGradeScreen.keepGrade'),
          style: 'cancel',
        },
        {
          text: t(`provisionalGradeScreen.${decision}`),
          style: isAccept ? 'default' : 'destructive',
          onPress: () => {
            setFailure(undefined);
            (isAccept ? accept : reject).mutateAsync(grade.id).then(
              () =>
                setFeedback({
                  text: t(
                    isAccept
                      ? 'provisionalGradeScreen.acceptedFeedback'
                      : 'provisionalGradeScreen.rejectedFeedback',
                  ),
                }),
              error => settle(decision, error),
            );
          },
        },
      ],
    );
  };

  let note;
  if (status === 'decide') {
    note = (
      <InfoMessage variant="warning" icon={faClock}>
        {deadline
          ? t('provisionalGradeScreen.decideNote', {
              date: shortDay(grade.rejectingExpiresAt!),
              time: deadline.toFormat('HH:mm'),
            })
          : t('provisionalGradeScreen.decideNoteNoDate')}
      </InfoMessage>
    );
  } else if (status === 'accepted') {
    note = (
      <InfoMessage
        icon={faCircleCheck}
        style={{ backgroundColor: colors.successBg }}
      >
        <Text variant="secondaryText" style={{ color: colors.successText }}>
          {t('provisionalGradeScreen.acceptedNote')}
        </Text>
      </InfoMessage>
    );
  } else {
    note = (
      <InfoMessage icon={faCircleInfo}>
        {status === 'rejected'
          ? t('provisionalGradeScreen.rejectedNote')
          : t('provisionalGradeScreen.waitNote')}
      </InfoMessage>
    );
  }

  return (
    <Card padded style={styles.card}>
      <Text variant="caption">{grade.courseName}</Text>
      <View style={styles.facts}>
        <GradeFigure
          label={t('provisionalGradeScreen.grade')}
          grade={gradeText}
          hidden={hidden}
        />
        <View
          accessible
          accessibilityLabel={`${t(
            'provisionalGradeScreen.published',
          )}: ${shortDay(new Date(grade.date))}`}
        >
          <Text variant="secondaryText">
            {t('provisionalGradeScreen.published')}
          </Text>
          <Text variant="title" weight="bold" style={{ color: colors.title }}>
            {shortDay(new Date(grade.date))}
          </Text>
        </View>
      </View>
      {note}
      {failure && (
        <FailureNote
          title={
            failure.decision === 'accept'
              ? t('provisionalGradeScreen.acceptFailedTitle')
              : t('provisionalGradeScreen.rejectFailedTitle')
          }
          failure={failure}
          lostText={t('provisionalGradeScreen.lostAnswer')}
        />
      )}
      {status === 'decide' && (
        <View style={styles.buttons}>
          {grade.canBeAccepted && (
            <CtaButton
              absolute={false}
              containerStyle={styles.button}
              title={
                isOnline
                  ? t('provisionalGradeScreen.accept')
                  : t('states.needsConnection')
              }
              action={() => decide('accept')}
              loading={accept.isPending}
              disabled={!isOnline || busy}
            />
          )}
          {grade.canBeRejected && (
            <CtaButton
              absolute={false}
              containerStyle={styles.button}
              variant="outlined"
              destructive
              title={t('provisionalGradeScreen.reject')}
              action={() => decide('reject')}
              loading={reject.isPending}
              disabled={!isOnline || busy}
              accessibilityHint={
                isOnline ? undefined : t('states.needsConnection')
              }
            />
          )}
        </View>
      )}
    </Card>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    card: {
      marginTop: spacing[4],
      gap: spacing[4],
    },
    facts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      columnGap: spacing[8],
      rowGap: spacing[3],
    },
    buttons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[3],
    },
    button: {
      padding: 0,
      flexGrow: 1,
      flexBasis: 140,
    },
  });
