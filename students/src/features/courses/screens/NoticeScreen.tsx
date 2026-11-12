import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView } from 'react-native';

import { linkUrls, sanitizeHtml, useQueryStates } from '@polito/lib/core';
import {
  BottomBarSpacer,
  QueryStateView,
  RefreshControl,
  SkeletonDetail,
  useTheme,
} from '@polito/lib/ui';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useGetCourseNotices } from '../../../core/queries/courseHooks';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { HtmlMessage } from '../../tickets/components/HtmlMessage';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Notice'>;

export const NoticeScreen = ({ route }: Props) => {
  const { noticeId, courseId } = route.params;
  const { spacing } = useTheme();
  const { clearNotificationScope } = useNotifications();
  const noticesQuery = useGetCourseNotices(courseId);
  const { t } = useTranslation();
  const states = useQueryStates(noticesQuery, {
    isEmpty: (notices: { id: number }[]) =>
      !notices.some(n => n.id === noticeId),
  });

  const message = useMemo(
    () =>
      linkUrls(
        sanitizeHtml(
          noticesQuery.data?.find(notice => notice.id === noticeId)?.content ??
            '',
        ),
      ),
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
      <SafeAreaView>
        <QueryStateView
          states={states}
          skeleton={<SkeletonDetail title={false} cards={[200]} />}
          emptyState={{ title: t('states.notices.goneTitle') }}
          errorState={{
            title: t('states.notices.failedOneTitle'),
            text: t('states.notices.failedText'),
          }}
        >
          <HtmlMessage
            message={message}
            baseStyle={{
              paddingTop: 0,
              paddingHorizontal: spacing[5],
            }}
          />
        </QueryStateView>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};
