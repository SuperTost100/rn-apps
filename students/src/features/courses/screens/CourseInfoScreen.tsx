import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useQueryStates } from '@polito/lib/core';
import { useOpenInAppLink } from '@polito/lib/core';
import { useGetPersons } from '@polito/lib/features/people';
import {
  BottomBarSpacer,
  Card,
  Col,
  GlobalStyles,
  Grid,
  Icon,
  ListItem,
  Metric,
  OverviewList,
  PersonListItem,
  QueryStateView,
  RefreshControl,
  Row,
  Section,
  SectionHeader,
  SkeletonDetail,
  StatefulMenuView,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { Person } from '@polito/student-api-client';
import { MenuAction } from '@react-native-menu/menu';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useNotifications } from '../../../core/hooks/useNotifications';
import {
  useGetCourse,
  useGetCourseEditions,
  useGetCourseExams,
} from '../../../core/queries/courseHooks';
import { useGetCourses } from '../../../core/queries/courseHooks';
import { LectureCard } from '../../agenda/components/LectureCard';
import { useGetNextLecture } from '../../agenda/queries/lectureHooks';
import { ExamListItem } from '../../teaching/components/ExamListItem';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { CourseHeading } from '../components/CourseHeading';
import { CourseStatisticsFilterType } from '../components/CourseStatisticsFilters.tsx';
import { useCourseContext } from '../contexts/CourseContext';
import { CourseTabsParamList } from '../navigation/CourseNavigator';

type StaffMember = Person & { courseRole: 'roleHolder' | 'roleCollaborator' };

export const CourseInfoScreen = () => {
  const { t } = useTranslation();
  const courseId = useCourseContext();
  const styles = useStylesheet(createStyles);
  const { spacing, palettes } = useTheme();
  const { getUnreadsCount, getUnreadsCountPerCourse } = useNotifications();
  const { fontSizes } = useTheme();
  const { data: editions } = useGetCourseEditions(courseId);
  const courseQuery = useGetCourse(courseId);
  const states = useQueryStates(courseQuery);
  const coursesQuery = useGetCourses();
  const {
    nextLecture,
    dayOfMonth,
    weekDay,
    monthOfYear,
    isLoadingNextLecture,
  } = useGetNextLecture(courseId);
  const openInAppLink = useOpenInAppLink();
  const courseExamsQuery = useGetCourseExams(
    courseId,
    courseQuery.data?.shortcode,
  );
  const { queries: staffQueries, isLoading: isStaffLoading } = useGetPersons(
    courseQuery.data?.staff.map(s => s.id),
  );

  const unreadsCurrentYear = getUnreadsCount([
    'teaching',
    'courses',
    `${courseId}`,
  ]);
  const unreadsPrevEditions =
    (getUnreadsCountPerCourse(null, editions) ?? 0) - (unreadsCurrentYear ?? 0);

  const isModule = useMemo(() => {
    if (!coursesQuery.data) return false;
    return coursesQuery.data.some(
      course =>
        course.modules?.some(module => module.id === courseId) ||
        course.modules?.some(module =>
          module.previousEditions.some(e => +e.id === courseId),
        ),
    );
  }, [coursesQuery.data, courseId]);

  const parentCourse = useMemo(() => {
    if (!coursesQuery.data || !isModule) return null;
    return coursesQuery.data.find(
      course =>
        course.modules?.some(module => module.id === courseId) ||
        course.modules?.some(module =>
          module.previousEditions.some(e => +e.id === courseId),
        ),
    );
  }, [coursesQuery.data, courseId, isModule]);

  const { getParent } = useNavigation();
  const { params } =
    useRoute<RouteProp<CourseTabsParamList, 'CourseInfoScreen'>>();
  const lockEdition = params?.lockEdition ?? false;

  const menuActions = useMemo(() => {
    if (!editions || lockEdition) return [];
    return editions.map(e => {
      const editionsCount = getUnreadsCount(['teaching', 'courses', `${e.id}`]);
      return {
        id: `${e.id}`,
        title: e.year.toString(),
        state: courseId === +e.id ? 'on' : undefined,
        image: editionsCount
          ? Platform.select({ ios: 'circle.fill', android: 'circle' })
          : undefined,
        imageColor: editionsCount ? palettes.rose[600] : undefined,
      } as MenuAction;
    });
  }, [editions, lockEdition, courseId, palettes, getUnreadsCount]);
  const staff = useMemo(() => {
    if (!courseQuery.data || isStaffLoading) return [];
    const staffData: StaffMember[] = [];

    staffQueries.forEach((staffQuery, index) => {
      if (!staffQuery.data) return;

      staffData.push({
        ...staffQuery.data,
        courseRole:
          courseQuery.data.staff[index].role === 'Titolare'
            ? 'roleHolder'
            : 'roleCollaborator',
      });
    });

    return staffData;
  }, [courseQuery.data, isStaffLoading, staffQueries]);

  const isStatisticsDisabled = !courseQuery.data?.shortcode;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          queries={[courseQuery, courseExamsQuery, ...staffQueries]}
          manual
        />
      }
    >
      <SafeAreaView>
        {states.status === 'ready' ? (
          <>
            <CourseHeading
              name={courseQuery.data?.name}
              shortcode={courseQuery.data?.shortcode}
              cfu={courseQuery.data?.cfu}
              parentCourseName={isModule ? parentCourse?.name : undefined}
            />
            <Card style={styles.metricsCard} accessible={true}>
              <Grid>
                <View
                  style={GlobalStyles.grow}
                  importantForAccessibility="yes"
                  accessibilityRole={lockEdition ? undefined : 'button'}
                  accessible={true}
                >
                  <StatefulMenuView
                    actions={menuActions}
                    onPressAction={async ({ nativeEvent: { event } }) => {
                      // replace current screen with same screen with event id as param
                      (
                        getParent()! as NativeStackNavigationProp<
                          TeachingStackParamList,
                          'Course'
                        >
                      ).replace('Course', {
                        id: +event,
                        animated: false,
                      });
                    }}
                  >
                    <Row justify="flex-start" align="center">
                      <Metric
                        title={t('common.period')}
                        value={`${courseQuery.data?.teachingPeriod ?? '--'} - ${
                          courseQuery.data?.year ?? '--'
                        }`}
                        accessibilityLabel={`${t('degreeCourseScreen.period')}: ${
                          courseQuery.data?.teachingPeriod ?? '--'
                        } - ${courseQuery.data?.year ?? '--'}`}
                        style={styles.periodMetric}
                      />
                      <Col align="center">
                        {!lockEdition && unreadsPrevEditions > 0 && (
                          <Icon
                            icon={faCircle}
                            size={8}
                            color={styles.dotIcon.color}
                            style={styles.dotIcon}
                          />
                        )}
                        {!lockEdition && (editions?.length ?? 0) > 0 && (
                          <Icon
                            icon={faAngleDown}
                            size={14}
                            style={{
                              marginTop: unreadsPrevEditions
                                ? undefined
                                : spacing[4],
                            }}
                            color={styles.periodDropdownIcon.color}
                          />
                        )}
                      </Col>
                    </Row>
                  </StatefulMenuView>
                </View>
              </Grid>
            </Card>
            <Section>
              <SectionHeader title={t('courseInfoTab.nextLectureLabel')} />
              <OverviewList
                indented
                loading={isLoadingNextLecture}
                skeleton={{ count: 1, leading: 'tile', subtitleLines: 2 }}
                emptyStateText={t('courseInfoTab.nextLectureEmptyState')}
              >
                {nextLecture && (
                  <Row style={styles.nextLectureBox}>
                    <Col style={styles.dayColumn} align="stretch">
                      <View style={[styles.dayBox, styles.nextLecBox]}>
                        <Text
                          variant="heading"
                          style={[styles.nextLec, styles.secondaryDay]}
                        >
                          {weekDay}
                        </Text>
                        <Text variant="heading" style={styles.nextLec}>
                          {dayOfMonth}
                        </Text>
                        {monthOfYear && (
                          <Text variant="heading" style={styles.nextLec}>
                            {monthOfYear}
                          </Text>
                        )}
                      </View>
                    </Col>
                    <Col flex={1}>
                      {nextLecture && (
                        <LectureCard
                          item={nextLecture}
                          nextLecture
                          nextDate={`${weekDay}/${dayOfMonth}/${monthOfYear}`}
                        />
                      )}
                    </Col>
                  </Row>
                )}
              </OverviewList>
            </Section>

            <Section>
              <SectionHeader title={t('courseInfoTab.staffSectionTitle')} />
              <OverviewList
                indented
                loading={
                  (courseQuery.data?.staff?.length ?? 0) > 0 && isStaffLoading
                }
                skeleton={{
                  count: courseQuery.data?.staff?.length ?? 1,
                  leading: 'avatar',
                }}
              >
                {staff.map(member => (
                  <PersonListItem
                    key={`${member.id}`}
                    person={member}
                    subtitle={t(`common.${member.courseRole}`)}
                  />
                ))}
              </OverviewList>
            </Section>
            <Section>
              <SectionHeader title={t('examsScreen.title')} />
              <OverviewList
                queries={courseExamsQuery}
                indented
                skeleton={{ count: 1, leading: 'tile', trailing: 'chip' }}
                emptyState={{
                  title: t('states.exams.emptyTitle'),
                  text: t('states.exams.emptyText'),
                }}
                errorState={{ title: t('states.exams.failedTitle') }}
              >
                {courseExamsQuery.data?.map(exam => (
                  <ExamListItem
                    key={`${exam.id}` + exam.moduleNumber}
                    exam={exam}
                  />
                ))}
              </OverviewList>
            </Section>

            <Section>
              <SectionHeader title={t('courseInfoTab.linksSectionTitle')} />
              <OverviewList
                indented
                emptyStateText={t('courseInfoTab.linksSectionEmptyState')}
              >
                {courseQuery.data?.links.map((link, index) => (
                  <ListItem
                    key={index}
                    leadingItem={<Icon icon={faLink} size={fontSizes.xl} />}
                    title={
                      link.description ?? t('courseInfoTab.linkDefaultTitle')
                    }
                    subtitle={link.url}
                    onPress={() => openInAppLink(link.url)}
                  />
                ))}
              </OverviewList>
            </Section>

            <Section>
              <SectionHeader title={t('courseInfoTab.moreSectionTitle')} />
              <OverviewList>
                <ListItem
                  title={t('courseGuideScreen.title')}
                  linkTo={{ screen: 'CourseGuide', params: { courseId } }}
                />
                <ListItem
                  title={t('courseStatisticsScreen.title')}
                  subtitle={t('courseStatisticsScreen.subtitle')}
                  linkTo={{
                    screen: 'CourseStatistics',
                    params: {
                      courseShortcode: courseQuery.data?.shortcode,
                      year: courseQuery.data?.year,
                      teacherId: courseQuery.data?.teacherId,
                      filter: CourseStatisticsFilterType.YEAR,
                      nameCourse: courseQuery.data?.name,
                    },
                  }}
                  disabled={isStatisticsDisabled}
                />
              </OverviewList>
            </Section>
          </>
        ) : (
          <QueryStateView
            states={states}
            skeleton={
              <SkeletonDetail
                cards={[88, 104, 120]}
                label={t('states.courseInfo.loading')}
              />
            }
            errorState={{ title: t('states.courseInfo.failedTitle') }}
          >
            {null}
          </QueryStateView>
        )}
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({
  palettes,
  spacing,
  colors,
  fontWeights,
  shapes,
}: Theme) =>
  StyleSheet.create({
    metricsCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[4],
      marginTop: 0,
      marginBottom: spacing[7],
    },
    periodMetric: {
      marginRight: spacing[2],
    },
    periodDropdownIcon: {
      color: palettes.secondary['500'],
    },
    dotIcon: {
      marginBottom: spacing[2],
      color: palettes.rose['600'],
    },
    dayColumn: {
      width: '15%',
      maxWidth: 200,
    },
    secondaryDay: {
      textTransform: 'capitalize',
      fontWeight: fontWeights.medium,
    },
    dayBox: {
      display: 'flex',
      alignItems: 'center',
      paddingVertical: spacing[2],
    },
    nextLecBox: {
      display: 'flex',
      backgroundColor: colors.heading,
      borderRadius: shapes.lg,
      marginLeft: spacing[1],
      marginTop: spacing[2],
    },
    nextLec: {
      color: colors.surface,
    },
    nextLectureBox: {
      gap: spacing[4],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
    },
  });
