import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView } from 'react-native';

import { APP_TIMEZONE, usePreferencesContext } from '@polito/lib/core';
import { useGetPerson } from '@polito/lib/features/people';
import {
  BottomBarSpacer,
  GlobalStyles,
  OverviewList,
  PersonListItem,
  RefreshControl,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DateTime } from 'luxon';

import { EventDetails } from '../../../core/components/EventDetails';
import { VideoPlayer } from '../../../core/components/VideoPlayer';
import { useGetCourseVideolectures } from '../../../core/queries/courseHooks';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';

type Props = NativeStackScreenProps<
  TeachingStackParamList,
  'CourseVideolecture'
>;

export const CourseVideolectureScreen = ({ route }: Props) => {
  const { courseId, lectureId, teacherId } = route.params;
  const { t } = useTranslation();
  const { language } = usePreferencesContext();
  const videolecturesQuery = useGetCourseVideolectures(courseId);
  const teacherQuery = useGetPerson(teacherId);

  const lecture = useMemo(() => {
    return videolecturesQuery.data?.find(l => l.id === lectureId);
  }, [lectureId, videolecturesQuery.data]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl queries={[teacherQuery, videolecturesQuery]} manual />
      }
      contentContainerStyle={GlobalStyles.fillHeight}
    >
      <SafeAreaView>
        <VideoPlayer
          source={{ uri: lecture?.videoUrl }}
          poster={lecture?.coverUrl}
        />
        <EventDetails
          title={lecture?.title ?? ''}
          type={t('common.videoLecture')}
          time={
            // Written like the dates on the lecture rows and the lecture page
            lecture?.createdAt
              ? DateTime.fromJSDate(lecture.createdAt, { zone: APP_TIMEZONE })
                  .setLocale(language)
                  .toFormat('ccc, d LLL yyyy')
              : undefined
          }
        />
        <OverviewList loading={teacherQuery.isLoading}>
          {teacherQuery.data && (
            <PersonListItem
              person={teacherQuery.data}
              subtitle={t('common.teacher')}
            />
          )}
        </OverviewList>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};
