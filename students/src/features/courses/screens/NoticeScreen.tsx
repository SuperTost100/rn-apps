import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePreferencesContext, useQueryStates } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  QueryStateView,
  RefreshControl,
  SkeletonDetail,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useNotifications } from '../../../core/hooks/useNotifications';
import {
  useGetCourse,
  useGetCourseNotices,
} from '../../../core/queries/courseHooks';
import { AppPreferences } from '../../../core/types/preferences';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { HtmlMessage } from '../../tickets/components/HtmlMessage';
import { useNoticeWhen } from '../utils/noticeWhen';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Notice'>;

/**
 * One announcement: when it was posted and by whom, and its text in a card,
 * with its links. Opening it marks it read through the shared read path.
 */
export const NoticeScreen = ({ route }: Props) => {
  const { noticeId, courseId } = route.params;
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { clearNotificationScope } = useNotifications();
  const { language } = usePreferencesContext<AppPreferences>();
  const when = useNoticeWhen(language);
  const noticesQuery = useGetCourseNotices(courseId);
  const { data: course } = useGetCourse(courseId);
  const states = useQueryStates(noticesQuery, {
    isEmpty: (notices: { id: number }[]) =>
      !notices.some(n => n.id === noticeId),
  });
  const notice = useMemo(
    () => noticesQuery.data?.find(n => n.id === noticeId),
    [noticesQuery.data, noticeId],
  );

  useFocusEffect(
    useCallback(() => {
      clearNotificationScope([
        'teaching',
        'courses',
        `${courseId}`,
        'notices',
        `${noticeId}`,
      ]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[noticesQuery]} manual />}
    >
      <QueryStateView
        states={states}
        skeleton={<SkeletonDetail title={false} cards={[200]} />}
        emptyState={{ title: t('states.notices.goneTitle') }}
        errorState={{
          title: t('states.notices.failedOneTitle'),
          text: t('states.notices.failedText'),
        }}
      >
        {notice && (
          <View>
            <Text variant="secondaryText" style={styles.meta}>
              {[course?.name, when(notice.publishedAt), course?.teacherName]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Card padded>
              <HtmlMessage message={notice.content} />
            </Card>
          </View>
        )}
      </QueryStateView>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    meta: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      paddingBottom: spacing[1],
    },
  });
