import { useTranslation } from 'react-i18next';

import { TeachingNavigatorID } from '@polito/lib/core';
import {
  PlacesNavigator,
  type PlacesStackParamList,
} from '@polito/lib/features/places';
import {
  offlineScreenLayout,
  useInnerHeaderOptions,
  useInnerTitleOptions,
  useTabRootHeaderOptions,
  withoutHeaderHairline,
} from '@polito/lib/ui';
import { ExamGrade } from '@polito/student-api-client';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { UnreadMessagesModal } from '~/features/user/screens/UnreadMessagesModal';

import {
  SharedScreens,
  SharedScreensParamList,
} from '../../../shared/navigation/SharedScreens';
import {
  CourseSharedScreens,
  CourseSharedScreensParamList,
} from '../../courses/navigation/CourseSharedScreens';
import { CoursesScreen } from '../../courses/screens/CoursesScreen';
import { CpdSurveysScreen } from '../../surveys/screens/CpdSurveysScreen';
import { TranscriptTopTabsNavigator } from '../../transcript/navigation/TranscriptTopTabsNavigator';
import { ProvisionalGradeScreen } from '../../transcript/screens/ProvisionalGradeScreen';
import { RecordedGradeScreen } from '../../transcript/screens/RecordedGradeScreen';
import { ExamQuestionScreen } from '../screens/ExamQuestionScreen';
import { ExamRequestScreen } from '../screens/ExamRequestScreen';
import { ExamRescheduleScreen } from '../screens/ExamRescheduleScreen';
import { ExamScreen } from '../screens/ExamScreen';
import { ExamsScreen } from '../screens/ExamsScreen';
import { GraduationCodeScreen } from '../screens/GraduationCodeScreen';
import { TeachingScreen } from '../screens/TeachingScreen';

export type TeachingStackParamList = CourseSharedScreensParamList &
  SharedScreensParamList & {
    Home: undefined;
    Courses: undefined;
    Exams: undefined;
    Exam: { id: number };
    ExamQuestion: { id: number };
    ExamRequest: { id: number };
    ExamReschedule: { id: number };
    MessagesModal: undefined;
    Transcript: undefined;
    ProvisionalGrade: { id: number };
    RecordedGrade: { grade: ExamGrade };
    PlacesTeachingStack: NavigatorScreenParams<PlacesStackParamList>;
    CpdSurveys: { categoryId: string; typeId: string; typeName: string };
    GraduationCode: { id: string };
  };

const Stack = createNativeStackNavigator<
  TeachingStackParamList,
  typeof TeachingNavigatorID
>();

export const TeachingNavigator = () => {
  const { t } = useTranslation();
  const rootOptions = useTabRootHeaderOptions();
  const placesHeaderOptions = { inner: useInnerTitleOptions() };

  return (
    <Stack.Navigator
      screenLayout={offlineScreenLayout}
      id={TeachingNavigatorID}
      screenOptions={useInnerHeaderOptions()}
    >
      <Stack.Screen
        name="Home"
        component={TeachingScreen}
        options={{
          ...rootOptions,
          headerTitle: t('teachingScreen.title'),
        }}
      />
      <Stack.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          headerTitle: t('coursesScreen.title'),
        }}
      />
      <Stack.Screen
        name="Exams"
        component={ExamsScreen}
        options={{
          headerTitle: t('common.examCall_plural'),
        }}
      />
      <Stack.Screen
        name="Exam"
        component={ExamScreen}
        getId={({ params }) => `${params.id}`}
        options={{
          headerTitle: t('common.examCall'),
        }}
      />
      <Stack.Screen
        name="ExamQuestion"
        component={ExamQuestionScreen}
        getId={({ params }) => `${params.id}`}
        options={{
          headerTitle: t('common.examCall'),
        }}
      />
      <Stack.Screen
        name="ExamRequest"
        component={ExamRequestScreen}
        getId={({ params }) => `${params.id}`}
        options={{
          headerTitle: t('common.examCall'),
        }}
      />
      <Stack.Screen
        name="ExamReschedule"
        component={ExamRescheduleScreen}
        getId={({ params }) => `${params.id}`}
        options={{
          headerTitle: t('examRescheduleScreen.screenTitle'),
        }}
      />
      <Stack.Screen
        name="Transcript"
        component={TranscriptTopTabsNavigator}
        options={{
          headerTitle: t('common.transcript'),
          ...withoutHeaderHairline,
        }}
      />
      <Stack.Screen
        name="ProvisionalGrade"
        component={ProvisionalGradeScreen}
        options={{
          headerTitle: t('transcriptGradeScreen.title'),
        }}
      />
      <Stack.Screen
        name="RecordedGrade"
        component={RecordedGradeScreen}
        options={{
          headerTitle: t('recordedGradeScreen.recordedGradeTitle'),
        }}
      />
      <Stack.Screen
        name="PlacesTeachingStack"
        options={{
          title: t('placeScreen.title'),
          headerShown: false,
        }}
      >
        {() => (
          <PlacesNavigator
            unreadMessagesModal={UnreadMessagesModal}
            headerOptions={placesHeaderOptions}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="CpdSurveys"
        component={CpdSurveysScreen}
        options={{
          title: t('teachingScreen.cpdTitle'),
        }}
      />
      <Stack.Screen
        name="GraduationCode"
        component={GraduationCodeScreen}
        options={{
          headerShown: false,
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      {CourseSharedScreens()}
      {SharedScreens()}
    </Stack.Navigator>
  );
};
