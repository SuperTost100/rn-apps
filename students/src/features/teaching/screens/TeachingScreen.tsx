import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PixelRatio,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';

import {
  faCalendarXmark,
  faClipboard,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-regular-svg-icons';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  usePreferencesContext,
  useQueryStates,
  useQuietQueryErrors,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  Icon,
  ListItem,
  OverviewList,
  QueryStateView,
  RefreshControl,
  Section,
  SectionHeader,
  SkeletonCard,
  SkeletonRows,
  StateBlock,
  StatusChip,
  Text,
  type Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { Deadline, type Event } from '@polito/student-api-client';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { AppPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useGetCourses } from '../../../core/queries/courseHooks';
import { useGetEventAdmissions } from '../../../core/queries/eventAdmissionHooks';
import { useGetExams } from '../../../core/queries/examHooks';
import {
  useGetDeadlineWeeks,
  useGetStudent,
} from '../../../core/queries/studentHooks';
import {
  useGetCpdSurveys,
  useGetSurveyCategories,
} from '../../../core/queries/surveysHooks';
import { Exam } from '../../../core/types/api';
import { useGetAgendaWeek } from '../../agenda/queries/agendaHooks';
import { DeadlineItem } from '../../agenda/types/AgendaItem';
import { CourseListItem } from '../../courses/components/CourseListItem';
import { CreditsRing } from '../components/CreditsRing';
import { ExamListItem } from '../components/ExamListItem';
import { GraduationSessionSection } from '../components/GraduationSessionSection';
import { TeachingStackParamList } from '../components/TeachingNavigator';
import { TODAY_TYPES, TodayList } from '../components/TodayList';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Home'>;

/** Exam calls shown here; the rest are behind "See all" */
const EXAMS_SHOWN = 4;
/** Deadlines in the next two weeks join the exams */
const DEADLINE_DAYS = 14;

/** Today's Monday and the two after it, in the app time zone */
const deadlineMondays = () => {
  const monday = DateTime.now().setZone(APP_TIMEZONE).startOf('week');
  return [0, 1, 2].map(week => monday.plus({ week }));
};

type ExamOrDeadline =
  | { kind: 'exam'; at: number; exam: Exam }
  | { kind: 'deadline'; at: number; deadline: Deadline };

export const TeachingScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  // Tapping the active tab again scrolls back to the top
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const styles = useStylesheet(createStyles);
  const { courses: coursePreferences } =
    usePreferencesContext<AppPreferences>();
  const { getUnreadsCountPerCourse } = useNotifications();
  const coursesQuery = useGetCourses();
  const examsQuery = useGetExams();
  const studentQuery = useGetStudent();
  const eventAdmissionsQuery = useGetEventAdmissions();
  const mondays = useMemo(deadlineMondays, []);
  const deadlinesQueries = useGetDeadlineWeeks(mondays);
  // Pulling to refresh reloads today's lectures too
  const { sourceQueries: todayQueries } = useGetAgendaWeek(
    mondays[0],
    TODAY_TYPES,
  );
  // These parts appear only when they have something to show
  useQuietQueryErrors([eventAdmissionsQuery, ...deadlinesQueries.queries]);

  const eventAdmissionsByContext = useMemo(() => {
    const byContext = new Map<string, Event[]>();
    (eventAdmissionsQuery.data ?? []).forEach(event => {
      const events = byContext.get(event.contextName) ?? [];
      events.push(event);
      byContext.set(event.contextName, events);
    });
    return [...byContext.entries()];
  }, [eventAdmissionsQuery.data]);

  const courses = useMemo(
    () =>
      (coursesQuery.data ?? []).filter(
        c =>
          !c.uniqueShortcode || !coursePreferences[c.uniqueShortcode]?.isHidden,
      ),
    [coursesQuery.data, coursePreferences],
  );

  const hiddenCoursesCount = useMemo(() => {
    if (!coursesQuery.data) return undefined;
    let count = 0;
    coursesQuery.data.forEach(course => {
      if (
        course.uniqueShortcode &&
        coursePreferences[course.uniqueShortcode]?.isHidden
      ) {
        count += 1 + (course.modules?.length ?? 0);
        return;
      }
      if (!course.modules?.length) return;
      const hiddenModules = course.modules.filter(
        (_, index) =>
          coursePreferences[`${course.shortcode}${index + 1}`]?.isHidden,
      ).length;
      count += hiddenModules;
      if (hiddenModules === course.modules.length) {
        count += 1;
      }
    });
    return count > 0 ? count : undefined;
  }, [coursesQuery.data, coursePreferences]);

  // Upcoming exam calls of followed courses, the first ones in date order
  const exams = useMemo(() => {
    if (!coursesQuery.data || !examsQuery.data) return [];
    const now = Date.now();
    return examsQuery.data
      .filter(
        e =>
          !coursePreferences[e.uniqueShortcode]?.isHidden &&
          (!e.examEndsAt || e.examEndsAt.valueOf() > now),
      )
      .sort(
        (a, b) =>
          (a.examStartsAt?.valueOf() ?? Number.MAX_SAFE_INTEGER) -
          (b.examStartsAt?.valueOf() ?? Number.MAX_SAFE_INTEGER),
      )
      .slice(0, EXAMS_SHOWN);
  }, [coursePreferences, coursesQuery.data, examsQuery.data]);

  const deadlines = useMemo(() => {
    const today = DateTime.now().setZone(APP_TIMEZONE).startOf('day');
    const until = today.plus({ day: DEADLINE_DAYS }).endOf('day');
    const seen = new Set<number | undefined>();
    return deadlinesQueries.data
      .flatMap(week => week ?? [])
      .filter(d => {
        const at = DateTime.fromJSDate(d.date, { zone: APP_TIMEZONE });
        if (at < today || at > until || seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
  }, [deadlinesQueries.data]);

  const examsAndDeadlines = useMemo<ExamOrDeadline[]>(
    () =>
      [
        ...exams.map(exam => ({
          kind: 'exam' as const,
          at: exam.examStartsAt?.valueOf() ?? Number.MAX_SAFE_INTEGER,
          exam,
        })),
        ...deadlines.map(deadline => ({
          kind: 'deadline' as const,
          at: deadline.date.valueOf(),
          deadline,
        })),
      ].sort((a, b) => a.at - b.at),
    [exams, deadlines],
  );

  const coursesStates = useQueryStates(coursesQuery);
  const examsStates = useQueryStates([examsQuery, coursesQuery], {
    isEmpty: () => examsAndDeadlines.length === 0,
  });
  const studentStates = useQueryStates(studentQuery);
  // When nothing loads at all, one block says so instead of three
  const nothingLoaded = [coursesStates, examsStates, studentStates].every(
    s => s.status === 'error',
  );
  const retryAll = () => {
    coursesStates.retry();
    examsStates.retry();
    studentStates.retry();
  };

  return (
    <ScrollView
      ref={scrollRef}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          queries={[
            coursesQuery,
            examsQuery,
            studentQuery,
            eventAdmissionsQuery,
            ...deadlinesQueries.queries,
            ...todayQueries,
          ]}
          manual
        />
      }
    >
      {/* The navy goes on above the list when the page is pulled down */}
      <View style={styles.overscroll} />
      <TodayList quiet={nothingLoaded} />
      <View style={styles.container}>
        {nothingLoaded ? (
          <StateBlock
            card
            variant={coursesStates.isOffline ? 'empty' : 'error'}
            title={
              coursesStates.isOffline
                ? t('states.offlineTitle')
                : t('states.teaching.failedTitle')
            }
            text={
              coursesStates.isOffline
                ? t('states.offlineText')
                : t('states.teaching.failedText')
            }
            action={
              coursesStates.isOffline
                ? undefined
                : {
                    label: t('states.tryAgain'),
                    icon: faArrowsRotate,
                    primary: true,
                    onPress: retryAll,
                  }
            }
          />
        ) : (
          <>
            <SurveysRow />
            <Section>
              <SectionHeader
                title={t('coursesScreen.title')}
                linkTo={{ screen: 'Courses' }}
                linkToMoreCount={hiddenCoursesCount}
              />
              <OverviewList
                states={coursesStates}
                indented
                skeleton={{ count: 5, leading: 'tile' }}
                emptyState={
                  coursesStates.status === 'empty'
                    ? {
                        title: t('states.courses.emptyTitle'),
                        text: t('states.courses.emptyText'),
                      }
                    : { title: t('teachingScreen.allCoursesHidden') }
                }
                errorState={{ title: t('states.courses.failedTitle') }}
              >
                {courses.map(course => (
                  <CourseListItem
                    key={course.shortcode + '' + course.id}
                    course={course}
                    badge={getUnreadsCountPerCourse(
                      course.id,
                      course.previousEditions,
                    )}
                  />
                ))}
              </OverviewList>
            </Section>
            <Section>
              <SectionHeader
                title={t('teachingScreen.examsTitle')}
                linkTo={{ screen: 'Exams' }}
                linkToMoreCount={
                  examsQuery.data
                    ? examsQuery.data.length - exams.length
                    : undefined
                }
              />
              <OverviewList
                states={examsStates}
                indented
                skeleton={{ count: 3, leading: 'tile', trailing: 'chip' }}
                emptyState={{
                  title: t('states.exams.emptyTitle'),
                  text: t('states.exams.emptyText'),
                }}
                errorState={{ title: t('states.exams.failedTitle') }}
              >
                {examsAndDeadlines.map(entry =>
                  entry.kind === 'exam' ? (
                    <ExamListItem
                      key={`${entry.exam.id}` + entry.exam.moduleNumber}
                      exam={entry.exam}
                    />
                  ) : (
                    <DeadlineRow
                      key={`deadline-${entry.deadline.id}`}
                      deadline={entry.deadline}
                    />
                  ),
                )}
              </OverviewList>
            </Section>
            {eventAdmissionsByContext.map(([contextName, events]) => (
              <GraduationSessionSection
                key={contextName}
                contextName={contextName}
                events={events}
              />
            ))}
            <Section>
              <SectionHeader
                title={t('common.transcript')}
                trailingItem={<HideGrades />}
              />
              <QueryStateView
                states={studentStates}
                skeleton={<TranscriptSkeleton />}
                errorState={{ title: t('states.transcript.failedTitle') }}
              >
                <TranscriptCard
                  onPress={() => navigation.navigate('Transcript')}
                />
              </QueryStateView>
            </Section>
          </>
        )}
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

/**
 * "Teaching surveys: 2 to fill in", with the due date and why it matters.
 * Only while there are mandatory surveys to fill in.
 */
const SurveysRow = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { language } = usePreferencesContext<AppPreferences>();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeachingStackParamList>>();
  const surveysQuery = useGetCpdSurveys();
  const typesQuery = useGetSurveyCategories();
  useQuietQueryErrors(surveysQuery);

  if (surveysQuery.isLoading) {
    return (
      <SkeletonRows
        count={1}
        leading="icon"
        subtitleLines={2}
        style={styles.surveys}
      />
    );
  }
  const surveys = surveysQuery.data ?? [];
  if (!surveys.length) return null;

  const due = Math.min(...surveys.map(s => s.endsAt.valueOf()));
  const date = DateTime.fromMillis(due, { zone: APP_TIMEZONE })
    .setLocale(language)
    .toFormat('ccc d LLL');
  const types = typesQuery.data ?? [];
  const open = () => {
    // One kind of survey opens its list; several open the surveys page
    if (types.length === 1) {
      navigation.navigate('CpdSurveys', {
        categoryId: types[0].categoryId,
        typeId: types[0].typeId,
        typeName: types[0].name,
      });
    } else {
      navigation.navigate('ServicesTab' as any, {
        screen: 'Surveys',
        initial: false,
      });
    }
  };

  return (
    <OverviewList style={styles.surveys}>
      <ListItem
        title={t('teachingScreen.surveysTitle', { count: surveys.length })}
        subtitle={
          Number.isFinite(due)
            ? t('teachingScreen.surveysDue', { date })
            : t('teachingScreen.surveysNoDue')
        }
        subtitleProps={{ numberOfLines: undefined }}
        multilineTitle
        leadingItem={
          <Icon icon={faClipboard} size={24} color={colors.secondaryText} />
        }
        isAction
        onPress={open}
      />
    </OverviewList>
  );
};

/** A deadline among the exams: a neutral tile, the day and a "Deadline" chip */
const DeadlineRow = ({ deadline }: { deadline: Deadline }) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { language } = usePreferencesContext<AppPreferences>();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeachingStackParamList>>();
  const start = DateTime.fromJSDate(deadline.date, {
    zone: APP_TIMEZONE,
  }).startOf('day');
  const subtitle = [
    start.setLocale(language).toFormat('ccc d LLL'),
    deadline.type,
  ]
    .filter(Boolean)
    .join(' · ');
  const chip = t('teachingScreen.examChip.deadline');
  // The deadline screen takes the agenda's item, built as the agenda does
  const item: DeadlineItem = {
    id: deadline.id!,
    key: 'deadline-' + deadline.id,
    type: 'deadline',
    title: deadline.name,
    start,
    end: start.plus({ hour: 1 }),
    startTimestamp: deadline.date.valueOf(),
    date: start.toFormat('yyyy-MM-dd'),
    url: deadline.url,
  };
  return (
    <ListItem
      title={deadline.name}
      subtitle={subtitle}
      leadingItem={
        <View style={styles.neutralTile}>
          <Icon
            icon={faCalendarXmark}
            size={20}
            color={colors.neutralChipText}
          />
        </View>
      }
      chip={<StatusChip label={chip} tone="neutral" />}
      chipLabel={chip}
      showChevron={false}
      onPress={() => navigation.navigate('Deadline', { item })}
    />
  );
};

/** The figure as the main number, the scale after it smaller: 26.21/30 */
const Average = ({
  label,
  value,
  scale,
}: {
  label: string;
  value?: number | null;
  scale: number;
}) => {
  const { colors } = useTheme();
  return (
    <View>
      <Text variant="secondaryText">{label}</Text>
      <Text
        variant="number"
        style={{ color: colors.title, fontVariant: ['tabular-nums'] }}
      >
        {value ?? '--'}
        <Text variant="secondaryText" weight="semibold">
          {` /${scale}`}
        </Text>
      </Text>
    </View>
  );
};

/**
 * The transcript card: the two averages on the left and the double ring of
 * credits on the right, centred. At large text the ring goes under them.
 */
const TranscriptCard = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge } = useTextScale();
  const { hideGrades } = usePreferencesContext<AppPreferences>();
  const { data: student } = useGetStudent();
  const total = student?.totalCredits ?? 0;
  const acquired = student?.totalAcquiredCredits ?? 0;
  const attended = student?.totalAttendedCredits ?? 0;
  const ringLabel = hideGrades
    ? t('teachingScreen.creditsRingHiddenLabel')
    : t('teachingScreen.creditsRingLabel', { acquired, attended, total });
  const label = hideGrades
    ? t('teachingScreen.transcriptHiddenLabel')
    : t('teachingScreen.transcriptLabel', {
        average: student?.averageGrade ?? '--',
        final: student?.estimatedFinalGrade ?? '--',
        credits: ringLabel,
      });

  return (
    <Card style={styles.transcriptCard}>
      <TouchableHighlight
        onPress={onPress}
        underlayColor={colors.touchableHighlight}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={[styles.transcript, isLarge && styles.transcriptLarge]}>
          <View style={styles.averages}>
            <Average
              label={t('transcriptMetricsScreen.weightedAverage')}
              value={hideGrades ? null : student?.averageGrade}
              scale={30}
            />
            <Average
              label={t('teachingScreen.finalAverage')}
              value={hideGrades ? null : student?.estimatedFinalGrade}
              scale={110}
            />
          </View>
          {total > 0 && (
            <View style={styles.ring}>
              <CreditsRing
                acquired={acquired}
                attended={attended}
                total={total}
                hidden={hideGrades}
                unit={t('teachingScreen.ringCredits')}
                // The card's label already says what the ring shows
                accessible={false}
                accessibilityLabel={ringLabel}
              />
            </View>
          )}
        </View>
      </TouchableHighlight>
    </Card>
  );
};

/** The card's height while the student loads: ring and padding, or stacked */
const TranscriptSkeleton = () => {
  const styles = useStylesheet(createStyles);
  const { scale, isLarge } = useTextScale();
  const k = Math.min(scale * PixelRatio.getFontScale(), 2);
  // Two averages: a label line and a number line each, 12 apart
  const averages = (20 + 32) * 2 * k + 12;
  const ring = 120 * k;
  const height = isLarge
    ? averages + 16 + ring + 32
    : Math.max(averages, ring) + 32;
  return (
    <SkeletonCard
      height={height}
      lines={['secondaryText', 'heading', 'secondaryText', 'heading']}
      style={styles.transcriptCard}
    />
  );
};

const HideGrades = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { hideGrades, updatePreference } =
    usePreferencesContext<AppPreferences>();

  const label = hideGrades ? t('common.show') : t('common.hide');
  const icon = hideGrades ? faEye : faEyeSlash;

  const onHide = (value: boolean) => updatePreference('hideGrades', value);

  return (
    <View
      style={styles.hideGradesSwitch}
      accessibilityLabel={`${label}. ${t(
        `common.activeStatus.${!!hideGrades}`,
      )} `}
      accessibilityRole="switch"
      accessible={true}
    >
      <Icon icon={icon} color={colors.link} />
      <Text variant="link" onPress={() => onHide(!hideGrades)}>
        {label}
      </Text>
    </View>
  );
};

const createStyles = ({ colors, controls, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    overscroll: {
      position: 'absolute',
      top: -1000,
      left: 0,
      right: 0,
      height: 1000,
      backgroundColor: colors.header,
    },
    container: {
      paddingTop: spacing[4],
    },
    surveys: {
      marginBottom: spacing[6],
    },
    neutralTile: {
      width: controls.courseTileSize,
      height: controls.courseTileSize,
      borderRadius: shapes.md,
      backgroundColor: colors.neutralChipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    transcriptCard: {},
    ring: {
      alignSelf: 'center',
    },
    transcript: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[4],
      padding: layout.cardPadding,
    },
    transcriptLarge: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    averages: {
      flexGrow: 1,
      flexShrink: 1,
      gap: spacing[3],
    },
    hideGradesSwitch: {
      display: 'flex',
      flexDirection: 'row',
      gap: spacing[1],
      alignItems: 'center',
    },
  });
