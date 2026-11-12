import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';

import {
  useFeedbackContext,
  useOfflineDisabled,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  CourseTile,
  InfoMessage,
  List,
  ListItem,
  OutlineIcon,
  OutlineIconName,
  OverviewList,
  QueryStateView,
  RefreshControl,
  SectionHeader,
  SkeletonRows,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { useGetCourses } from '~/core/queries/courseHooks';
import { AppPreferences } from '~/core/types/preferences';

import {
  useGetNotificationPreferences,
  useUpdateNotificationPreference,
} from '../../../core/queries/studentHooks';
import { SettingSwitchRow } from '../../courses/components/SettingSwitchRow';
import {
  NOTIFICATION_ROWS,
  useCourseNotifications,
} from '../../courses/hooks/useCourseNotifications';

type GlobalKey = 'tickets' | 'bookings';
const GLOBAL_ROWS: { key: GlobalKey; icon: OutlineIconName }[] = [
  { key: 'tickets', icon: 'chat' },
  { key: 'bookings', icon: 'door' },
];

/** How long "Saved" stays on a row */
const SAVED_MS = 2000;

/** A course or module the student follows, with a page of its own */
interface FollowedCourse {
  id: number;
  name: string;
  uniqueShortcode: string;
}

/**
 * The global switches the API has for things outside courses: ticket
 * replies and bookings. Saved as they change, with "Saved", and put back
 * with a message when the server refuses.
 */
const GeneralCard = () => {
  const { t } = useTranslation();
  const { setFeedback } = useFeedbackContext();
  const isOffline = useOfflineDisabled();
  const query = useGetNotificationPreferences();
  const { mutateAsync } = useUpdateNotificationPreference();
  const [overrides, setOverrides] = useState<
    Partial<Record<GlobalKey, boolean>>
  >({});
  const [savedKey, setSavedKey] = useState<GlobalKey | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const server = query.data;
  // An override goes once the server says the same
  useEffect(() => {
    if (!server) return;
    setOverrides(prev => {
      const next = { ...prev };
      let changed = false;
      (Object.keys(prev) as GlobalKey[]).forEach(key => {
        if (server[key] === prev[key]) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [server]);

  const titles: Record<GlobalKey, string> = {
    tickets: t('common.ticket_plural'),
    bookings: t('common.booking_plural'),
  };

  const change = (key: GlobalKey, value: boolean) => {
    const before = { ...overrides };
    setOverrides(prev => ({ ...prev, [key]: value }));
    mutateAsync({ notificationType: key, targetValue: value })
      .then(() => {
        clearTimeout(savedTimer.current);
        setSavedKey(key);
        AccessibilityInfo.announceForAccessibility(t('course.settings.saved'));
        savedTimer.current = setTimeout(() => setSavedKey(null), SAVED_MS);
      })
      .catch(() => {
        setOverrides(before);
        const text = t('course.settings.saveFailed', { name: titles[key] });
        setFeedback({ text, isError: true });
        AccessibilityInfo.announceForAccessibility(text);
      });
  };

  return (
    <OverviewList
      queries={query}
      isEmpty={() => false}
      skeleton={{ count: 2, leading: 'icon', trailing: 'value' }}
      errorState={{ title: t('states.notifications.failedTitle') }}
    >
      {GLOBAL_ROWS.map(row => (
        <SettingSwitchRow
          key={row.key}
          icon={row.icon}
          title={titles[row.key]}
          subtitle={t(`profile.notifications.${row.key}Text`)}
          value={!!(overrides[row.key] ?? server?.[row.key])}
          disabled={!server || isOffline}
          saved={savedKey === row.key}
          onChange={value => change(row.key, value)}
        />
      ))}
    </OverviewList>
  );
};

/**
 * One course: its tile and name, then its three switches, from the same
 * query and with the same saving as the course's own settings, so a change
 * here shows there and the reverse. While its switches load, three skeleton
 * rows hold their place.
 */
const CourseCard = ({ course }: { course: FollowedCourse }) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const isOffline = useOfflineDisabled();
  const { courses: coursesPrefs } = usePreferencesContext<AppPreferences>();
  const prefs = coursesPrefs[course.uniqueShortcode];
  const { query, values, savedKey, titles, setNotifications } =
    useCourseNotifications(course.id, row =>
      row
        ? t('profile.notifications.saveFailed', {
            name: titles[row],
            course: course.name,
          })
        : t('course.settings.saveFailedAll'),
    );

  // The card shows a failed course itself, so no alert pops up for it
  const states = useQueryStates(query);

  return (
    <Card accessibilityRole="none">
      <List>
        <ListItem
          title={
            <Text
              variant="title"
              weight="semibold"
              accessibilityRole="header"
              style={styles.courseName}
            >
              {course.name}
            </Text>
          }
          leadingItem={<CourseTile color={prefs?.color} icon={prefs?.icon} />}
        />
        {query.data ? (
          NOTIFICATION_ROWS.map(row => (
            <SettingSwitchRow
              key={row.key}
              icon={row.icon}
              title={titles[row.key]}
              accessibilityLabel={`${titles[row.key]}, ${course.name}`}
              value={!!values[row.key]}
              disabled={isOffline}
              saved={savedKey === row.key}
              onChange={value =>
                setNotifications({ [row.key]: value }, row.key)
              }
            />
          ))
        ) : states.status === 'error' ? (
          <ListItem
            title={t('profile.notifications.courseFailed')}
            subtitle={t('profile.notifications.tryAgain')}
            leadingItem={<OutlineIcon name="alert" color={colors.dangerText} />}
            onPress={states.retry}
            disabled={isOffline}
          />
        ) : (
          <SkeletonRows
            card={false}
            count={3}
            leading="icon"
            trailing="value"
            subtitle={false}
            label={t('common.loading')}
          />
        )}
      </List>
    </Card>
  );
};

/**
 * Notifications: a note on how saving works, the global switches, then
 * every followed course with its three switches. Each course loads its own
 * switches, all at once, with skeleton rows in its card meanwhile.
 */
export const NotificationsScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { courses: coursesPrefs } = usePreferencesContext<AppPreferences>();
  const preferencesQuery = useGetNotificationPreferences();
  const coursesQuery = useGetCourses();

  // Courses and modules with a page, in the order of Teaching, without the
  // ones the student stopped following
  const courses = useMemo<FollowedCourse[]>(() => {
    const list: FollowedCourse[] = [];
    (coursesQuery.data ?? []).forEach(course => {
      if (
        course.uniqueShortcode &&
        coursesPrefs[course.uniqueShortcode]?.isHidden
      ) {
        return;
      }
      if (course.modules?.length) {
        course.modules.forEach((module, index) => {
          const key = `${course.shortcode}${index + 1}`;
          if (module.id && !coursesPrefs[key]?.isHidden) {
            list.push({
              id: module.id,
              name: module.name,
              uniqueShortcode: key,
            });
          }
        });
        return;
      }
      if (course.id && course.uniqueShortcode) {
        list.push({
          id: course.id,
          name: course.name,
          uniqueShortcode: course.uniqueShortcode,
        });
      }
    });
    return list;
  }, [coursesQuery.data, coursesPrefs]);

  const coursesStates = useQueryStates(coursesQuery, {
    isEmpty: () => courses.length === 0,
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl queries={[preferencesQuery, coursesQuery]} manual />
      }
    >
      <InfoMessage style={styles.note} accessibilityRole="text">
        {t('profile.notifications.note')}
      </InfoMessage>

      <View style={styles.section}>
        <SectionHeader title={t('profile.notifications.general')} />
        <GeneralCard />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('notificationsScreen.perCourseTitle')} />
        <QueryStateView
          states={coursesStates}
          skeleton={
            <View>
              {[0, 1].map(i => (
                <Card key={i}>
                  <SkeletonRows
                    card={false}
                    count={4}
                    leading="icon"
                    trailing="value"
                    subtitle={false}
                    label={t('common.loading')}
                  />
                </Card>
              ))}
            </View>
          }
          errorState={{ title: t('profile.notifications.coursesFailed') }}
          emptyState={{
            title: t('profile.notifications.noCourses'),
            text: t('profile.notifications.noCoursesText'),
          }}
        >
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </QueryStateView>
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    note: {
      marginHorizontal: layout.gutter,
      marginTop: spacing[4],
    },
    section: {
      marginTop: layout.sectionGap,
    },
    courseName: {
      flexShrink: 1,
    },
  });
