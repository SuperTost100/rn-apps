import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import {
  faAngleDown,
  faBriefcase,
  faFlaskVial,
  faMicroscope,
  faPersonChalkboard,
} from '@fortawesome/free-solid-svg-icons';
import { useOfflineDisabled } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  GlobalStyles,
  Grid,
  Icon,
  ListItem,
  Metric,
  OutlineIcon,
  OverviewList,
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
import { MenuAction } from '@react-native-menu/menu';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGetOfferingCourse } from '~/core/queries/offeringHooks.ts';

import { CourseStatisticsFilterType } from '../../courses/components/CourseStatisticsFilters.tsx';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { StaffListItem } from '../components/StaffListItem';

type Props = NativeStackScreenProps<ServiceStackParamList, 'DegreeCourse'>;
export const DegreeCourseScreen = ({ route }: Props) => {
  const { courseShortcode, year: initialYear } = route.params;
  const styles = useStylesheet(createStyles);
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [currentYear, setCurrentYear] = useState(initialYear);

  const isOffline = useOfflineDisabled();

  const courseQuery = useGetOfferingCourse({
    courseShortcode,
    year: selectedYear,
  });
  const { colors, spacing } = useTheme();
  const offeringCourse = courseQuery.data;

  const moreStaffCount = useMemo(() => {
    if (!offeringCourse) return undefined;
    return offeringCourse.staff.length > 3
      ? offeringCourse.staff.length - 3
      : undefined;
  }, [offeringCourse]);

  useEffect(() => {
    if (!offeringCourse) return;
    setCurrentYear(offeringCourse.year);
  }, [offeringCourse]);

  const yearOptions = useMemo(() => {
    if (
      !offeringCourse?.editions ||
      isOffline ||
      !currentYear ||
      offeringCourse.editions.length < 2
    )
      return [];
    return offeringCourse.editions?.map(
      edition =>
        ({
          id: edition.toString(),
          title: edition,
          state: edition === currentYear ? 'on' : undefined,
        }) as MenuAction,
    );
  }, [currentYear, isOffline, offeringCourse]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[courseQuery]} manual />}
    >
      <SafeAreaView>
        <QueryStateView
          queries={courseQuery}
          isEmpty={() => false}
          skeleton={<SkeletonDetail cards={[96, 160, 120]} />}
          errorState={{ title: t('states.offering.failedCourseTitle') }}
        >
          <View style={styles.titleBlock}>
            <Text variant="cardTitle" accessibilityRole="header">
              {offeringCourse?.name}
            </Text>
            <Text variant="secondaryText">{offeringCourse?.shortcode}</Text>
          </View>
          <Card style={styles.metricsCard}>
            <Row justify="space-between">
              <Grid>
                <View
                  style={GlobalStyles.grow}
                  importantForAccessibility="yes"
                  accessibilityRole="button"
                  accessible={true}
                >
                  <StatefulMenuView
                    actions={yearOptions}
                    onPressAction={async ({ nativeEvent: { event } }) => {
                      setSelectedYear(() => event);
                      await courseQuery.refetch();
                    }}
                  >
                    <Row justify="flex-start" align="center">
                      <Metric
                        title={t('degreeCourseScreen.period')}
                        value={`${offeringCourse?.teachingPeriod ?? '--'} - ${
                          currentYear ?? '--'
                        }`}
                        accessibilityLabel={`${t(
                          'degreeCourseScreen.period',
                        )}: ${offeringCourse?.teachingPeriod ?? '--'} - ${
                          currentYear ?? '--'
                        }`}
                      />
                      {yearOptions.length > 0 && (
                        <Icon
                          icon={faAngleDown}
                          color={colors.link}
                          size={14}
                          style={{
                            marginLeft: spacing[2],
                            marginTop: spacing[4],
                          }}
                        />
                      )}
                    </Row>
                  </StatefulMenuView>
                </View>

                <Metric
                  title={t('courseInfoTab.creditsLabel')}
                  value={t('common.creditsWithUnit', {
                    credits: offeringCourse?.cfu,
                  })}
                  accessibilityLabel={`${t('courseInfoTab.creditsLabel')}: ${
                    offeringCourse?.cfu
                  }`}
                  style={GlobalStyles.grow}
                />
              </Grid>
            </Row>
          </Card>
          {!!offeringCourse?.hours &&
            !!(
              offeringCourse.hours.lecture ||
              offeringCourse.hours.classroomExercise ||
              offeringCourse.hours.labExercise ||
              offeringCourse.hours.tutoring
            ) && (
              <OverviewList style={styles.nextCard}>
                {!!offeringCourse.hours.lecture && (
                  <ListItem
                    inverted
                    title={t('degreeCourseScreen.hours', {
                      hours: offeringCourse.hours.lecture.toString(),
                    })}
                    subtitle={t('degreeCourseScreen.lecture')}
                    leadingItem={<Icon size={20} icon={faBriefcase} />}
                  />
                )}
                {!!offeringCourse?.hours?.classroomExercise && (
                  <ListItem
                    inverted
                    title={t('degreeCourseScreen.hours', {
                      hours: offeringCourse.hours.classroomExercise.toString(),
                    })}
                    subtitle={t('degreeCourseScreen.classroomExercise')}
                    leadingItem={<Icon size={20} icon={faMicroscope} />}
                  />
                )}
                {!!offeringCourse?.hours?.labExercise && (
                  <ListItem
                    inverted
                    title={t('degreeCourseScreen.hours', {
                      hours: offeringCourse?.hours?.labExercise?.toString(),
                    })}
                    subtitle={t('degreeCourseScreen.labExercise')}
                    leadingItem={<Icon size={20} icon={faFlaskVial} />}
                  />
                )}
                {!!offeringCourse?.hours?.tutoring && (
                  <ListItem
                    inverted
                    title={t('degreeCourseScreen.hours', {
                      hours: offeringCourse.hours.tutoring.toString(),
                    })}
                    subtitle={t('degreeCourseScreen.tutoring')}
                    leadingItem={<Icon size={20} icon={faPersonChalkboard} />}
                  />
                )}
              </OverviewList>
            )}

          <Section style={styles.section}>
            <SectionHeader
              title={t('degreeCourseScreen.staff')}
              linkToMoreCount={moreStaffCount}
              linkTo={
                moreStaffCount && offeringCourse
                  ? {
                      screen: 'Staff',
                      params: {
                        courseShortcode: offeringCourse.shortcode,
                        year: selectedYear,
                        staff: offeringCourse.staff,
                      },
                    }
                  : undefined
              }
            />
            <OverviewList emptyStateText={t('degreeCourseScreen.noStaff')}>
              {offeringCourse?.staff?.slice(0, 3).map(item => (
                <StaffListItem
                  key={`${item.id}${item.courseId}`}
                  staff={item}
                />
              ))}
            </OverviewList>
          </Section>
          <Section>
            <SectionHeader title={t('common.other')} />
            <OverviewList>
              {offeringCourse && (
                <ListItem
                  title={t('degreeCourseScreen.statistics')}
                  subtitle={t('degreeCourseScreen.statisticsSubtitle')}
                  linkTo={{
                    screen: 'CourseStatistics',
                    params: {
                      courseShortcode: offeringCourse.shortcode,
                      filter: CourseStatisticsFilterType.DEFAULT,
                      nameCourse: offeringCourse.name,
                    },
                  }}
                  leadingItem={
                    <OutlineIcon name="chart" color={colors.secondaryText} />
                  }
                />
              )}
              <ListItem
                leadingItem={
                  <OutlineIcon name="bookopen" color={colors.secondaryText} />
                }
                title={t('courseGuideScreen.title')}
                linkTo={{
                  screen: 'DegreeCourseGuide',
                  params: {
                    courseShortcode: offeringCourse?.shortcode,
                    year: selectedYear,
                  },
                }}
              />
            </OverviewList>
          </Section>
          <BottomBarSpacer />
        </QueryStateView>
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    titleBlock: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      gap: spacing[1],
    },
    // 16 px under the title
    metricsCard: {
      marginTop: spacing[4],
      padding: layout.cardPadding,
    },
    nextCard: {
      marginTop: spacing[2],
    },
    section: {
      marginTop: layout.sectionGap - spacing[2],
    },
  });
