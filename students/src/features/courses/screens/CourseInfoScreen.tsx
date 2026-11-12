import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { faAngleDown, faCircle } from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  useOpenInAppLink,
  useQueryStates,
} from '@polito/lib/core';
import { useGetPersons } from '@polito/lib/features/people';
import {
  BottomBarSpacer,
  Card,
  Icon,
  List,
  ListItem,
  OutlineIcon,
  OverviewList,
  PersonListItem,
  QueryStateView,
  RefreshControl,
  SectionHeader,
  SkeletonDetail,
  SkeletonRows,
  StateBlock,
  StatefulMenuView,
  Text,
  TextButton,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { Person } from '@polito/student-api-client';
import { MenuAction } from '@react-native-menu/menu';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DateTime } from 'luxon';

import { useNotifications } from '../../../core/hooks/useNotifications';
import {
  useGetCourse,
  useGetCourseEditions,
  useGetCourseExams,
  useGetCourses,
} from '../../../core/queries/courseHooks';
import { useMinuteClock } from '../../agenda/hooks/useMinuteClock';
import { ExamListItem } from '../../teaching/components/ExamListItem';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { CourseLectureRow } from '../components/CourseLectureRow';
import { CourseStatisticsFilterType } from '../components/CourseStatisticsFilters.tsx';
import { useCourseContext } from '../contexts/CourseContext';
import { useCourseNextLectures } from '../hooks/useCourseNextLectures';
import { CourseTabsParamList } from '../navigation/CourseNavigator';
import { formatAcademicYear, uniqueShortcodeOf } from '../utils/courses';

type StaffMember = Person & { courseRole: 'roleHolder' | 'roleCollaborator' };

/** How many coming lectures "Course in agenda" lists */
const NEXT_LECTURES = 2;

/**
 * The course's Info tab: code, credits and period (with the switch to other
 * editions), the next lectures, staff, exam calls, useful links, the guide
 * and statistics, and a labelled way to the course settings
 */
export const CourseInfoScreen = () => {
  const { t } = useTranslation();
  const courseId = useCourseContext();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { getUnreadsCount, getUnreadsCountPerCourse } = useNotifications();
  const { data: editions } = useGetCourseEditions(courseId);
  const courseQuery = useGetCourse(courseId);
  const states = useQueryStates(courseQuery);
  const coursesQuery = useGetCourses();
  const now = useMinuteClock();
  const nextLectures = useCourseNextLectures(courseId, NEXT_LECTURES);
  const openInAppLink = useOpenInAppLink();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeachingStackParamList>>();
  const courseExamsQuery = useGetCourseExams(
    courseId,
    courseQuery.data?.shortcode,
  );
  const { queries: staffQueries, isLoading: isStaffLoading } = useGetPersons(
    courseQuery.data?.staff.map(s => s.id),
  );
  const { params } =
    useRoute<RouteProp<CourseTabsParamList, 'CourseInfoScreen'>>();
  const lockEdition = params?.lockEdition ?? false;
  const course = courseQuery.data;

  const unreadsCurrentYear = getUnreadsCount([
    'teaching',
    'courses',
    `${courseId}`,
  ]);
  const unreadsPrevEditions =
    (getUnreadsCountPerCourse(null, editions) ?? 0) - (unreadsCurrentYear ?? 0);

  const parentCourse = useMemo(
    () =>
      coursesQuery.data?.find(c =>
        c.modules?.some(
          m =>
            m.id === courseId ||
            m.previousEditions.some(e => +e.id === courseId),
        ),
      ),
    [coursesQuery.data, courseId],
  );

  const editionActions = useMemo(() => {
    if (!editions || lockEdition) return [];
    return editions.map(e => {
      const count = getUnreadsCount(['teaching', 'courses', `${e.id}`]);
      return {
        id: `${e.id}`,
        title: e.year.toString(),
        state: courseId === +e.id ? 'on' : undefined,
        image: count
          ? Platform.select({ ios: 'circle.fill', android: 'circle' })
          : undefined,
        imageColor: count ? colors.badge : undefined,
      } as MenuAction;
    });
  }, [editions, lockEdition, courseId, colors.badge, getUnreadsCount]);
  const canSwitchEdition = editionActions.length > 0;

  const staff = useMemo(() => {
    if (!course || isStaffLoading) return [];
    const members: StaffMember[] = [];
    staffQueries.forEach((query, index) => {
      if (!query.data) return;
      members.push({
        ...query.data,
        courseRole:
          course.staff[index].role === 'Titolare'
            ? 'roleHolder'
            : 'roleCollaborator',
      });
    });
    return members;
  }, [course, isStaffLoading, staffQueries]);

  const openAgenda = () => {
    const first = nextLectures.entries[0]?.item.start;
    const date = (first ?? DateTime.now().setZone(APP_TIMEZONE)).toISODate();
    navigation.navigate('AgendaTab' as any, {
      screen: 'Agenda',
      params: { date, requestedAt: Date.now() },
      pop: true,
    });
  };

  const openSettings = () =>
    navigation.navigate('CoursePreferences', {
      courseId,
      uniqueShortcode: uniqueShortcodeOf(courseId, coursesQuery.data),
    });

  const period = `${course?.teachingPeriod ?? '--'} - ${course?.year ?? '--'}`;
  const periodBlock = (
    <View style={styles.fact}>
      <Text variant="secondaryText">{t('common.period')}</Text>
      <View style={styles.factValue}>
        <Text variant="title" weight="bold">
          {period}
        </Text>
        {canSwitchEdition && (
          <Icon icon={faAngleDown} size={14} color={colors.link} />
        )}
        {canSwitchEdition && unreadsPrevEditions > 0 && (
          <Icon icon={faCircle} size={8} color={colors.badge} />
        )}
      </View>
    </View>
  );

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
      {states.status === 'ready' && course ? (
        <>
          <Card padded style={styles.headCard}>
            <Text variant="cardTitle" style={styles.title}>
              {course.name}
            </Text>
            <Text variant="secondaryText">
              {[
                course.shortcode,
                t('course.info.credits', { count: course.cfu }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {parentCourse && (
              <Text variant="secondaryText">
                {t('course.info.moduleOf', { name: parentCourse.name })}
              </Text>
            )}
            <View style={styles.facts}>
              {canSwitchEdition ? (
                <StatefulMenuView
                  actions={editionActions}
                  onPressAction={({ nativeEvent: { event } }) => {
                    navigation.replace('Course', {
                      id: +event,
                      animated: false,
                    });
                  }}
                >
                  <View
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={t('course.info.periodLabel', {
                      period,
                    })}
                    accessibilityHint={t('course.info.editionsHint')}
                  >
                    {periodBlock}
                  </View>
                </StatefulMenuView>
              ) : (
                <View
                  accessible
                  accessibilityLabel={t('course.info.periodText', { period })}
                >
                  {periodBlock}
                </View>
              )}
              {!!course.year && (
                <View style={styles.fact} accessible>
                  <Text variant="secondaryText">
                    {t('course.info.academicYear')}
                  </Text>
                  <Text variant="title" weight="bold">
                    {formatAcademicYear(course.year)}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          <View style={styles.section}>
            <SectionHeader
              title={t('course.info.inAgenda')}
              trailingItem={
                <TextButton onPress={openAgenda} style={styles.headerLink}>
                  {t('course.info.openAgenda')}
                </TextButton>
              }
            />
            {nextLectures.isLoading ? (
              <SkeletonRows count={1} leading="tile" trailing="none" />
            ) : nextLectures.entries.length ? (
              <Card>
                <List>
                  {nextLectures.entries.map(entry => (
                    <CourseLectureRow
                      key={entry.item.key}
                      entry={entry}
                      now={now}
                    />
                  ))}
                </List>
              </Card>
            ) : (
              <StateBlock
                card
                title={t('course.info.noLecturesTitle')}
                text={t('course.info.noLecturesText')}
              />
            )}
          </View>

          {course.staff.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={t('courseInfoTab.staffSectionTitle')} />
              <OverviewList
                indented
                loading={isStaffLoading}
                skeleton={{
                  count: course.staff.length,
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
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title={t('course.info.examCalls')} />
            <OverviewList
              queries={courseExamsQuery}
              indented
              skeleton={{ count: 1, leading: 'tile', trailing: 'chip' }}
              emptyState={{
                title: t('course.info.noExamCallsTitle'),
                text: t('course.info.noExamCallsText'),
              }}
              errorState={{ title: t('states.exams.failedTitle') }}
            >
              {courseExamsQuery.data?.map(exam => (
                <ExamListItem
                  key={`${exam.id}${exam.moduleNumber}`}
                  exam={exam}
                />
              ))}
            </OverviewList>
          </View>

          {course.links.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={t('courseInfoTab.linksSectionTitle')} />
              <Card>
                <List>
                  {course.links.map((link, index) => (
                    <ListItem
                      key={index}
                      leadingItem={
                        <OutlineIcon name="link" color={colors.secondaryText} />
                      }
                      title={
                        link.description ?? t('courseInfoTab.linkDefaultTitle')
                      }
                      subtitle={link.url}
                      accessibilityHint={t('course.info.opensInBrowser')}
                      onPress={() => openInAppLink(link.url)}
                    />
                  ))}
                </List>
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title={t('courseInfoTab.moreSectionTitle')} />
            <Card>
              <List>
                <ListItem
                  leadingItem={
                    <OutlineIcon name="bookopen" color={colors.secondaryText} />
                  }
                  title={t('courseGuideScreen.title')}
                  subtitle={t('course.info.guideText')}
                  linkTo={{ screen: 'CourseGuide', params: { courseId } }}
                />
                <ListItem
                  leadingItem={
                    <OutlineIcon name="chart" color={colors.secondaryText} />
                  }
                  title={t('courseStatisticsScreen.title')}
                  subtitle={t('course.info.statisticsText')}
                  linkTo={{
                    screen: 'CourseStatistics',
                    params: {
                      courseShortcode: course.shortcode,
                      year: course.year,
                      teacherId: course.teacherId,
                      filter: CourseStatisticsFilterType.YEAR,
                      nameCourse: course.name,
                    },
                  }}
                  disabled={!course.shortcode}
                />
              </List>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionHeader title={t('course.info.settingsSection')} />
            <Card>
              <ListItem
                leadingItem={
                  <OutlineIcon name="gear" color={colors.secondaryText} />
                }
                title={t('navigation.courseSettings')}
                subtitle={t('course.info.settingsText')}
                isAction
                onPress={openSettings}
              />
            </Card>
          </View>
        </>
      ) : (
        <View style={styles.firstBlock}>
          <QueryStateView
            states={states}
            skeleton={
              <SkeletonDetail
                cards={[120, 88, 160]}
                label={t('states.courseInfo.loading')}
              />
            }
            errorState={{ title: t('states.courseInfo.failedTitle') }}
          >
            {null}
          </QueryStateView>
        </View>
      )}
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    // The first card sits 16 px under the tab row
    headCard: {
      marginTop: spacing[4],
      gap: spacing[1],
    },
    firstBlock: {
      marginTop: spacing[2],
    },
    title: {
      marginBottom: spacing[1],
    },
    facts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[6],
      marginTop: spacing[3],
    },
    fact: {
      gap: spacing[0.5],
    },
    factValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    section: {
      marginTop: layout.sectionGap,
    },
    headerLink: {
      marginBottom: -spacing[3],
    },
  });
