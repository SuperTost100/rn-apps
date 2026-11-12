import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';
import { faCheck, faUsers } from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  isValidDate,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import { useGetPerson } from '@polito/lib/features/people';
import { PlacesListItem } from '@polito/lib/features/places';
import {
  BottomBarSpacer,
  BottomModal,
  Card,
  Icon,
  ListItem,
  OverviewList,
  PersonListItem,
  RefreshControl,
  RegionStateBlock,
  Section,
  SectionHeader,
  SkeletonBox,
  SkeletonLine,
  SkeletonRegion,
  SkeletonRows,
  StatusChip,
  Text,
  type Theme,
  useBottomModal,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { ExamStatusEnum } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { UNLIMITED_PLACES, useGetExams } from '~/core/queries/examHooks';
import { useGetAllCpdSurveys } from '~/core/queries/surveysHooks';

import { DateTime } from 'luxon';

import { Exam } from '../../../core/types/api';
import { AppPreferences } from '../../../core/types/preferences';
import { ExamCpdModalContent } from '../../surveys/components/ExamCpdModalContent';
import { ExamBookingPanel } from '../components/ExamBookingPanel';
import { EXAM_STATUS_TONE } from '../components/ExamListItem';
import { TeachingStackParamList } from '../components/TeachingNavigator';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Exam'>;

/** The statuses that leave the booking to the student, before any survey */
const OPEN_STATUSES: ExamStatusEnum[] = [
  ExamStatusEnum.Available,
  ExamStatusEnum.Requestable,
];

export const ExamScreen = ({ route, navigation }: Props) => {
  const { id, dateChangeSent } = route.params;
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const examsQuery = useGetExams();
  const cpdSurveysQuery = useGetAllCpdSurveys();
  const exam = examsQuery.data?.find(e => e.id === id);
  const teacherQuery = useGetPerson(exam?.teacherId);
  const teacher = teacherQuery.data;
  const {
    open: showBottomModal,
    modal: bottomModal,
    close: closeBottomModal,
  } = useBottomModal();
  const states = useQueryStates(examsQuery, { isEmpty: () => !exam });

  // The header carries the course name once it is known
  const courseName = exam?.courseName;
  useLayoutEffect(() => {
    if (courseName) navigation.setOptions({ headerTitle: courseName });
  }, [courseName, navigation]);

  // Surveys the student has to fill in before booking this exam, shown
  // once when the page opens on an exam that can still be booked
  const isOpen = !!exam && OPEN_STATUSES.includes(exam.status);
  const surveysShown = useRef(false);
  useLayoutEffect(() => {
    if (!cpdSurveysQuery.data || !exam || !isOpen || surveysShown.current)
      return;

    const getPeriodo = cpdSurveysQuery.data.filter(s => {
      return s.type.id === 'STUDENTE' && s.course?.id === exam.courseId;
    });

    const requirements = cpdSurveysQuery.data.filter(s => {
      return (
        ((s.type.id === 'CPDPERIODO' &&
          getPeriodo.filter(g => g.period === s.period).length > 0) ||
          (s.type.id === 'STUDENTE' && s.course?.id === exam.courseId)) &&
        !s.isCompiled
      );
    });

    if (!requirements.length) return;
    surveysShown.current = true;
    showBottomModal(
      <ExamCpdModalContent surveys={requirements} close={closeBottomModal} />,
    );
  }, [cpdSurveysQuery.data, exam, isOpen, showBottomModal, closeBottomModal]);

  return (
    <>
      <BottomModal dismissable {...bottomModal} />
      <ScrollView
        refreshControl={<RefreshControl queries={[examsQuery]} manual />}
        contentInsetAdjustmentBehavior="automatic"
      >
        {states.status === 'loading' && <ExamSkeleton />}
        <RegionStateBlock
          states={states}
          emptyState={{
            title: t('states.exam.goneTitle'),
            text: t('states.exam.goneText'),
            action: {
              label: t('states.exam.goneAction'),
              onPress: () => navigation.navigate('Exams'),
            },
          }}
          errorState={{
            title: t('states.exam.failedTitle'),
            text: t('states.exam.failedText'),
          }}
          style={{ marginTop: spacing[4] }}
        />
        {states.status === 'ready' && exam && (
          <>
            <ExamHead exam={exam} />
            <ExamBookingPanel
              exam={exam}
              teacherName={
                teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined
              }
              dateChangeSent={dateChangeSent}
            />
            <OverviewList
              indented
              style={{ marginTop: spacing[2] }}
              loading={teacherQuery.isLoading}
              skeleton={{ count: 3, leading: 'icon', trailing: 'none' }}
            >
              <PlacesListItem
                eventName={exam.courseName ?? ''}
                places={exam.places}
              />
              {teacher && (
                <PersonListItem
                  person={teacher}
                  subtitle={t('common.teacher')}
                />
              )}
              <BookedStudentsRow exam={exam} />
            </OverviewList>
            {exam.status === ExamStatusEnum.Requested &&
              (!!exam.requestReason || !!exam.requestDetails) && (
                <Section style={{ marginTop: spacing[4] }}>
                  <SectionHeader title={t('examScreen.yourRequest')} />
                  <OverviewList>
                    {!!exam.requestReason && (
                      <ListItem
                        inverted
                        title={exam.requestReason}
                        titleProps={{ numberOfLines: 0 }}
                        subtitle={t('examScreen.requestReasonTitle')}
                      />
                    )}
                    {!!exam.requestDetails && (
                      <ListItem
                        inverted
                        title={exam.requestDetails}
                        titleProps={{ numberOfLines: 0 }}
                        subtitle={t('examScreen.requestDetailsTitle')}
                      />
                    )}
                  </OverviewList>
                </Section>
              )}
            {!!exam.notes?.length && (
              <Section style={{ marginTop: spacing[4] }}>
                <SectionHeader title={t('examScreen.notes')} />
                <Card padded>
                  <Text>{exam.notes}</Text>
                </Card>
              </Section>
            )}
          </>
        )}
        <View style={{ height: spacing[4] }} />
        <BottomBarSpacer />
      </ScrollView>
    </>
  );
};

/** "Fri, 22 Jan 2027" and "08:30 - 10:30", in the app time zone and language */
const useExamDateTime = () => {
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();
  return (exam: Exam) => {
    if (!exam.examStartsAt || !isValidDate(exam.examStartsAt)) {
      return { date: t('common.dateToBeDefined') };
    }
    const zone = { zone: APP_TIMEZONE };
    const start = DateTime.fromJSDate(exam.examStartsAt, zone).setLocale(
      language,
    );
    const end =
      exam.examEndsAt && isValidDate(exam.examEndsAt)
        ? DateTime.fromJSDate(exam.examEndsAt, zone)
        : undefined;
    return {
      date: start.toFormat('ccc, d LLL yyyy'),
      time: exam.isTimeToBeDefined
        ? t('common.timeToBeDefined')
        : end
          ? t('examScreen.timeRange', {
              start: start.toFormat('HH:mm'),
              end: end.toFormat('HH:mm'),
            })
          : start.toFormat('HH:mm'),
    };
  };
};

/** The summary under the header: exam type, status, date and time */
const ExamHead = ({ exam }: { exam: Exam }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const examDateTime = useExamDateTime();
  const { date, time } = examDateTime(exam);
  const status = t(`teachingScreen.examChip.${exam.status}`);
  const isBooked =
    exam.status === ExamStatusEnum.Booked ||
    exam.status === ExamStatusEnum.RequestAccepted;

  return (
    <View
      style={styles.head}
      accessible
      accessibilityLabel={[
        exam.type,
        t('examScreen.statusLabel', { status }),
        date,
        time,
      ]
        .filter(Boolean)
        .join('. ')}
    >
      <View style={styles.headRow}>
        {!!exam.type && (
          <Text variant="caption" style={styles.type}>
            {exam.type}
          </Text>
        )}
        <StatusChip
          label={status}
          tone={EXAM_STATUS_TONE[exam.status] ?? 'neutral'}
          icon={isBooked ? faCheck : undefined}
        />
      </View>
      <View style={styles.when}>
        <View style={styles.whenPart}>
          <Icon icon={faCalendar} color={colors.secondaryText} size={20} />
          <Text variant="title" weight="semibold" style={styles.whenText}>
            {date}
          </Text>
        </View>
        {time && (
          <View style={styles.whenPart}>
            <Icon icon={faClock} color={colors.secondaryText} size={20} />
            <Text variant="title" weight="semibold" style={styles.whenText}>
              {time}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const BookedStudentsRow = ({ exam }: { exam: Exam }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const total = exam.bookedCount + exam.availableCount;
  return (
    <ListItem
      leadingItem={<Icon icon={faUsers} size={22} color={colors.prose} />}
      title={
        exam.availableCount === UNLIMITED_PLACES
          ? `${exam.bookedCount}`
          : t('examScreen.bookedStudentsValue', {
              booked: exam.bookedCount,
              total,
            })
      }
      subtitle={t('examScreen.bookedCount')}
    />
  );
};

/** The page while the exam loads, in the shape of the loaded one */
const ExamSkeleton = () => {
  const { t } = useTranslation();
  const { layout, spacing } = useTheme();
  const styles = useStylesheet(createStyles);
  return (
    <SkeletonRegion label={t('states.exam.loading')}>
      <View style={styles.head}>
        <SkeletonLine variant="caption" width="60%" />
        <SkeletonBox width={96} height={28} round />
        <SkeletonLine variant="title" width="75%" />
      </View>
      <Card
        style={{
          marginTop: spacing[4],
          padding: layout.cardPadding,
          gap: spacing[4],
        }}
      >
        <View style={{ gap: spacing[1] }}>
          <SkeletonLine variant="secondaryText" width="30%" />
          <SkeletonBox width={140} height={40} />
        </View>
        <SkeletonBox height={48} radius={12} />
        <SkeletonLine variant="secondaryText" width="45%" />
      </Card>
      <SkeletonRows
        count={3}
        leading="icon"
        trailing="none"
        style={{ marginTop: spacing[2] }}
      />
    </SkeletonRegion>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    head: {
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[3],
      paddingBottom: spacing[6],
      gap: spacing[2],
    },
    headRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      columnGap: spacing[3],
      rowGap: spacing[2],
    },
    type: {
      flexShrink: 1,
    },
    when: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: spacing[6],
      rowGap: spacing[1],
    },
    whenPart: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    whenText: {
      color: colors.title,
      fontVariant: ['tabular-nums'],
    },
  });
