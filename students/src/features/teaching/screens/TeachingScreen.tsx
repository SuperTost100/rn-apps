import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableHighlight, View } from 'react-native';

import {
  faArrowsRotate,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import {
  usePreferencesContext,
  useQueryStates,
  useQuietQueryErrors,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  Col,
  GlobalStyles,
  Icon,
  Metric,
  OverviewList,
  QueryStateView,
  RefreshControl,
  Row,
  Section,
  SectionHeader,
  SkeletonCard,
  StateBlock,
  Text,
  type Theme,
  UnreadBadge,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { type Event, ExamStatusEnum } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useGetCourses } from '../../../core/queries/courseHooks';
import { useGetEventAdmissions } from '../../../core/queries/eventAdmissionHooks';
import { useGetExams } from '../../../core/queries/examHooks';
import { useGetStudent } from '../../../core/queries/studentHooks';
import { useGetSurveyCategories } from '../../../core/queries/surveysHooks';
import { formatFinalGrade, formatThirtiethsGrade } from '../../../utils/grades';
import { CourseListItem } from '../../courses/components/CourseListItem';
import { ExamListItem } from '../components/ExamListItem';
import { GraduationSessionSection } from '../components/GraduationSessionSection';
import { ProgressChart } from '../components/ProgressChart';
import { SurveyTypesSection } from '../components/SurveyTypesSection';
import { TeachingStackParamList } from '../components/TeachingNavigator';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Home'>;

/** The transcript card: the 140 px chart and 18 px of padding above and below */
const TRANSCRIPT_CARD_HEIGHT = 176;

export const TeachingScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { colors, palettes } = useTheme();
  const styles = useStylesheet(createStyles);
  const { courses: coursePreferences, hideGrades } =
    usePreferencesContext<AppPreferences>();
  const { getUnreadsCountPerCourse } = useNotifications();
  const surveyCategoriesQuery = useGetSurveyCategories();
  const coursesQuery = useGetCourses();
  const examsQuery = useGetExams();
  const studentQuery = useGetStudent();
  const eventAdmissionsQuery = useGetEventAdmissions();
  const transcriptBadge = null;
  // These sections appear only when they have something to show
  useQuietQueryErrors([surveyCategoriesQuery, eventAdmissionsQuery]);

  const eventAdmissionsByContext = useMemo(() => {
    if (!eventAdmissionsQuery.data?.length) {
      return [];
    }

    const byContext = new Map<string, Event[]>();

    eventAdmissionsQuery.data.forEach(event => {
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

  const exams = useMemo(() => {
    if (!coursesQuery.data || !examsQuery.data) return [];

    const hiddenCourses: string[] = [];

    Object.keys(coursePreferences).forEach((key: string) => {
      if (coursePreferences[key].isHidden) {
        hiddenCourses.push(key);
      }
    });

    return (
      examsQuery.data
        .filter(
          e =>
            !hiddenCourses.includes(e.uniqueShortcode) &&
            (!e.examEndsAt ||
              e.examEndsAt.valueOf() > DateTime.now().toJSDate().valueOf()),
        )
        .sort((a, b) => {
          const status =
            (a.status === ExamStatusEnum.Booked ? -1 : 0) +
            (b.status === ExamStatusEnum.Booked ? 1 : 0);
          return status !== 0
            ? status
            : (a.examStartsAt?.valueOf() ?? Number.MAX_SAFE_INTEGER) -
                (b.examStartsAt?.valueOf() ?? Number.MAX_SAFE_INTEGER);
        })
        .slice(0, 4) ?? []
    );
  }, [coursePreferences, coursesQuery.data, examsQuery.data]);

  const coursesStates = useQueryStates(coursesQuery);
  const examsStates = useQueryStates([examsQuery, coursesQuery], {
    isEmpty: () => exams.length === 0,
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
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          queries={[
            coursesQuery,
            examsQuery,
            studentQuery,
            surveyCategoriesQuery,
            eventAdmissionsQuery,
          ]}
          manual
        />
      }
    >
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
            {eventAdmissionsByContext.map(([contextName, events]) => (
              <GraduationSessionSection
                key={contextName}
                contextName={contextName}
                events={events}
              />
            ))}
            {surveyCategoriesQuery.data?.length ? (
              <SurveyTypesSection types={surveyCategoriesQuery.data} />
            ) : undefined}
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
                title={t('examsScreen.title')}
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
                {exams.map((exam, index) => (
                  <ExamListItem
                    key={`${exam.id}` + exam.moduleNumber}
                    exam={exam}
                    bottomBorder={index < exams.length - 1}
                  />
                ))}
              </OverviewList>
            </Section>
            <Section>
              <SectionHeader
                title={t('common.transcript')}
                trailingItem={<HideGrades />}
              />
              <QueryStateView
                states={studentStates}
                skeleton={
                  <SkeletonCard
                    height={TRANSCRIPT_CARD_HEIGHT}
                    style={styles.transcriptCard}
                  />
                }
                errorState={{ title: t('states.transcript.failedTitle') }}
              >
                <View style={GlobalStyles.relative}>
                  <Card style={styles.transcriptCard}>
                    <TouchableHighlight
                      onPress={() => navigation.navigate('Transcript')}
                      underlayColor={colors.touchableHighlight}
                    >
                      <Row
                        p={5}
                        gap={5}
                        align="center"
                        justify="space-between"
                        style={styles.transcriptRow}
                      >
                        <Col justify="center" flexShrink={1} gap={5}>
                          <Metric
                            title={t('transcriptMetricsScreen.weightedAverage')}
                            value={formatThirtiethsGrade(
                              !hideGrades
                                ? studentQuery.data?.averageGrade
                                : null,
                            )}
                            color={colors.title}
                          />
                          <Metric
                            title={t('transcriptMetricsScreen.averageLabel')}
                            value={formatFinalGrade(
                              !hideGrades
                                ? studentQuery.data?.estimatedFinalGrade
                                : null,
                            )}
                            color={colors.title}
                          />
                        </Col>
                        <Col style={styles.graph} flexShrink={1}>
                          <View style={{ alignItems: 'center' }}>
                            <ProgressChart
                              label={
                                studentQuery.data?.totalCredits
                                  ? `${
                                      hideGrades
                                        ? '--'
                                        : studentQuery.data
                                            ?.totalAcquiredCredits
                                    }/${studentQuery.data?.totalCredits}\n${t(
                                      'common.ects',
                                    )}`
                                  : undefined
                              }
                              data={
                                hideGrades
                                  ? []
                                  : studentQuery.data?.totalCredits
                                    ? [
                                        (studentQuery.data
                                          ?.totalAttendedCredits ?? 0) /
                                          studentQuery.data?.totalCredits,
                                        (studentQuery.data
                                          ?.totalAcquiredCredits ?? 0) /
                                          studentQuery.data?.totalCredits,
                                      ]
                                    : []
                              }
                              boxSize={140}
                              radius={40}
                              thickness={18}
                              colors={[
                                palettes.primary[400],
                                palettes.secondary[500],
                              ]}
                            />
                          </View>
                        </Col>
                      </Row>
                    </TouchableHighlight>
                  </Card>
                  {transcriptBadge && (
                    <UnreadBadge text={transcriptBadge} style={styles.badge} />
                  )}
                </View>
              </QueryStateView>
            </Section>
          </>
        )}
      </View>
      <BottomBarSpacer />
    </ScrollView>
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
        `common.activeStatus.${hideGrades}`,
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

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing[5],
    },
    transcriptRow: {
      minHeight: TRANSCRIPT_CARD_HEIGHT,
    },
    transcriptCard: {
      marginVertical: spacing[2],
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 10,
    },
    hideGradesSwitch: {
      display: 'flex',
      flexDirection: 'row',
      gap: spacing[1],
      alignItems: 'center',
    },
    graph: {
      paddingHorizontal: spacing[4],
    },
  });
