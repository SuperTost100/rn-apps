import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  getHtmlTextContent,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  List,
  ListItem,
  OutlineIcon,
  QueryStateView,
  RefreshControl,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useOnLeaveScreen } from '../../../core/hooks/useOnLeaveScreen';
import {
  useGetCourseNotices,
  useGetCourses,
} from '../../../core/queries/courseHooks';
import { AppPreferences } from '../../../core/types/preferences';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { useCourseContext } from '../contexts/CourseContext';
import { uniqueShortcodeOf } from '../utils/courses';
import { useNoticeWhen } from '../utils/noticeWhen';

/**
 * The course's announcements in one card, newest first: the megaphone, the
 * text's start as the title on up to two lines, and when it was posted.
 * Unread ones have a bold title and the unread dot.
 */
export const CourseNoticesScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const courseId = useCourseContext();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeachingStackParamList>>();
  const noticesQuery = useGetCourseNotices(courseId);
  const { data: courses } = useGetCourses();
  const states = useQueryStates(noticesQuery);
  const { getUnreadsCount, clearNotificationScope } = useNotifications();
  const { language } = usePreferencesContext<AppPreferences>();
  const when = useNoticeWhen(language);

  const notices = useMemo(
    () =>
      [...(noticesQuery.data ?? [])]
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .map(notice => ({
          ...notice,
          // Paragraphs and list items end with a space, so words of two
          // blocks do not run together
          text: getHtmlTextContent(
            notice.content.replace(/<\/(p|li|div|h\d)>|<br\s*\/?>/gi, ' $&'),
          )
            .replace(/\s+/g, ' ')
            .trim(),
        })),
    [noticesQuery.data],
  );
  const scope = useMemo(
    () => ['teaching', 'courses', `${courseId}`, 'notices'] as const,
    [courseId],
  );

  useOnLeaveScreen(() => {
    clearNotificationScope(scope);
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl manual queries={[noticesQuery]} />}
    >
      <View style={styles.first}>
        <QueryStateView
          states={states}
          skeleton={{
            count: 5,
            leading: 'icon',
            trailing: 'none',
            titleLines: 2,
            label: t('states.notices.loading'),
          }}
          emptyState={{
            title: t('states.notices.emptyTitle'),
            text: t('course.announcements.emptyText'),
            action: {
              label: t('navigation.courseSettings'),
              onPress: () =>
                navigation.navigate('CoursePreferences', {
                  courseId,
                  uniqueShortcode: uniqueShortcodeOf(courseId, courses),
                }),
            },
          }}
          errorState={{
            title: t('states.notices.failedTitle'),
            text: t('states.notices.failedText'),
          }}
        >
          <Card>
            <List>
              {notices.map(notice => {
                const unread = !!getUnreadsCount([...scope, `${notice.id}`]);
                const posted = when(notice.publishedAt);
                return (
                  <ListItem
                    key={notice.id}
                    title={notice.text}
                    subtitle={posted}
                    unread={unread}
                    leadingItem={
                      <OutlineIcon
                        name="megaphone"
                        color={unread ? colors.title : colors.secondaryText}
                      />
                    }
                    accessibilityLabel={[
                      unread ? t('primitives.unread') : undefined,
                      notice.text.slice(0, 160),
                      posted,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    linkTo={{
                      screen: 'Notice',
                      params: { noticeId: notice.id, courseId },
                    }}
                  />
                );
              })}
            </List>
          </Card>
        </QueryStateView>
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    // The first card sits 16 px under the tab row (8 here, 8 its own)
    first: {
      marginTop: spacing[2],
    },
  });
