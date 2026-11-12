import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  APP_TIMEZONE,
  useOfflineDisabled,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import { useGetPerson } from '@polito/lib/features/people';
import {
  BottomBarSpacer,
  Card,
  List,
  ListItem,
  OutlineIcon,
  QueryStateView,
  RefreshControl,
  SectionHeader,
  SkeletonRows,
  StatusChip,
  TextButton,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { useFocusEffect } from '@react-navigation/native';

import { DateTime } from 'luxon';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useGetCourseLectures } from '../../../core/queries/courseHooks';
import { AppPreferences } from '../../../core/types/preferences';
import { useMinuteClock } from '../../agenda/hooks/useMinuteClock';
import { CourseLectureRow } from '../components/CourseLectureRow';
import { useCourseContext } from '../contexts/CourseContext';
import { useCourseNextLectures } from '../hooks/useCourseNextLectures';
import {
  CourseLecture,
  CourseLectureSection,
} from '../types/CourseLectureSections';
import { isLiveVC } from '../utils/lectures';

/** How many coming lectures the tab lists */
const NEXT_LECTURES = 4;
/** Rows a section of another year or course shows before "Show all" */
const FOLDED_ROWS = 3;

/**
 * The course's Lectures tab: the next lectures in the timetable, then the
 * recordings the teacher published, a section per kind as today (virtual
 * classrooms with their live classes, video lectures, other years and
 * related courses), each in a card
 */
export const CourseLecturesScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const courseId = useCourseContext();
  const now = useMinuteClock();
  const courseLecturesQuery = useGetCourseLectures(courseId);
  const next = useCourseNextLectures(courseId, NEXT_LECTURES);
  const { clearNotificationScope } = useNotifications();
  const sections = courseLecturesQuery.data ?? [];
  const states = useQueryStates(courseLecturesQuery.queries, {
    isEmpty: () => sections.length === 0 && next.entries.length === 0,
  });
  // Sections of other years and courses start folded
  const [unfolded, setUnfolded] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      clearNotificationScope([
        'teaching',
        'courses',
        courseId.toString(),
        'lectures',
      ]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const nextBlock = next.isLoading ? (
    <SkeletonRows count={2} leading="tile" trailing="none" />
  ) : next.entries.length ? (
    <Card>
      <List>
        {next.entries.map(entry => (
          <CourseLectureRow key={entry.item.key} entry={entry} now={now} />
        ))}
      </List>
    </Card>
  ) : null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          manual
          queries={[...courseLecturesQuery.queries, ...next.queries]}
        />
      }
    >
      <View style={styles.first}>
        <QueryStateView
          states={states}
          skeleton={
            <View>
              <SkeletonRows count={2} leading="tile" trailing="none" />
              <View style={styles.section}>
                <SkeletonRows
                  count={4}
                  leading="icon"
                  label={t('states.lectures.loading')}
                />
              </View>
            </View>
          }
          emptyState={{
            title: t('states.lectures.emptyTitle'),
            text: t('course.lectures.emptyText'),
          }}
          errorState={{ title: t('states.lectures.failedTitle') }}
        >
          {nextBlock && (
            <View>
              <SectionHeader title={t('course.lectures.next')} />
              {nextBlock}
            </View>
          )}
          {sections.map((section, index) => {
            const isRelated = section.courseId !== courseId;
            const key = `${section.courseId}-${section.type}-${index}`;
            const folded =
              isRelated && !unfolded[key] && section.data.length > FOLDED_ROWS;
            const rows = folded
              ? section.data.slice(0, FOLDED_ROWS)
              : section.data;
            return (
              <View
                key={key}
                style={(index > 0 || !!nextBlock) && styles.section}
              >
                <SectionHeader title={section.title} />
                <Card>
                  <List>
                    {rows.map(lecture => (
                      <LectureRow
                        key={lecture.id}
                        section={section}
                        lecture={lecture}
                      />
                    ))}
                  </List>
                  {folded && (
                    <TextButton
                      style={styles.showAll}
                      onPress={() =>
                        setUnfolded(prev => ({ ...prev, [key]: true }))
                      }
                    >
                      {t('course.lectures.showAll', {
                        count: section.data.length,
                      })}
                    </TextButton>
                  )}
                </Card>
              </View>
            );
          })}
        </QueryStateView>
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

interface LectureRowProps {
  section: CourseLectureSection;
  lecture: CourseLecture;
}

/**
 * A recording or a live class: an icon per kind, the title, the day, the
 * length and the teacher. It opens the player or the live class, which
 * need a connection.
 */
const LectureRow = ({ section, lecture }: LectureRowProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = usePreferencesContext<AppPreferences>();
  const isDisabled = useOfflineDisabled();
  const { data: teacher } = useGetPerson(lecture.teacherId);
  const isVideo = section.type === 'VideoLecture';
  const isLive = !isVideo && isLiveVC(lecture);
  const duration = 'duration' in lecture ? lecture.duration : undefined;
  const day = DateTime.fromJSDate(lecture.createdAt, { zone: APP_TIMEZONE })
    .setLocale(language)
    .toFormat('ccc d LLL yyyy');
  const teacherName = teacher
    ? `${teacher.firstName} ${teacher.lastName}`
    : undefined;
  const kind = isVideo
    ? t('course.lectures.videoLecture')
    : isLive
      ? t('course.lectures.liveClass')
      : t('course.lectures.recording');

  return (
    <ListItem
      title={lecture.title}
      titleProps={{ numberOfLines: 2 }}
      subtitle={[day, duration, teacherName].filter(Boolean).join(' · ')}
      leadingItem={
        <OutlineIcon
          name={isVideo ? 'video' : isLive ? 'live' : 'monitor'}
          color={isLive ? colors.nowText : colors.secondaryText}
        />
      }
      chip={
        isLive ? (
          <StatusChip label={t('course.lectures.live')} tone="warning" />
        ) : undefined
      }
      chipLabel={isLive ? t('course.lectures.live') : undefined}
      accessibilityLabel={[kind, lecture.title, day, duration, teacherName]
        .filter(Boolean)
        .join(', ')}
      linkTo={{
        screen: isVideo ? 'CourseVideolecture' : 'CourseVirtualClassroom',
        params: {
          courseId: section.courseId,
          lectureId: lecture.id,
          teacherId: lecture.teacherId,
        },
      }}
      // Recordings and live classes stream: they need the network
      disabled={isDisabled}
      accessibilityHint={isDisabled ? t('states.needsConnection') : undefined}
    />
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    // The first block sits 16 px under the tab row
    first: {
      marginTop: spacing[4],
    },
    section: {
      marginTop: layout.sectionGap,
    },
    showAll: {
      alignSelf: 'flex-start',
      marginLeft: layout.cardPadding - spacing[3],
      marginRight: 0,
    },
  });
