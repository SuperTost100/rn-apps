import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import {
  AppHeader,
  createHeaderCloseButton,
  withoutHeaderHairline,
} from '@polito/lib/ui';
import { ParamListBase } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CourseAssignmentPdfCreationScreen } from '../screens/CourseAssignmentPdfCreationScreen';
import { CourseAssignmentUploadConfirmationScreen } from '../screens/CourseAssignmentUploadConfirmationScreen';
import { CourseAssignmentUploadScreen } from '../screens/CourseAssignmentUploadScreen';
import { CourseColorPickerScreen } from '../screens/CourseColorPickerScreen';
import { CourseDirectoryScreen } from '../screens/CourseDirectoryScreen';
import { CourseFileMultiSelectScreen } from '../screens/CourseFileMultiSelectScreen';
import { CourseGuideScreen } from '../screens/CourseGuideScreen';
import { CourseHideEventScreen } from '../screens/CourseHideEventScreen';
import { CourseIconPickerScreen } from '../screens/CourseIconPickerScreen';
import { CourseNoAssignmentScreen } from '../screens/CourseNoAssignmentScreen';
import { CoursePreferencesScreen } from '../screens/CoursePreferencesScreen';
import { CourseVideolectureScreen } from '../screens/CourseVideolectureScreen';
import { CourseVirtualClassroomScreen } from '../screens/CourseVirtualClassroomScreen';
import { NoticeScreen } from '../screens/NoticeScreen';
import { Assignment } from '../types/Assignment';
import { CourseNavigator } from './CourseNavigator';

export interface CourseSharedScreensParamList extends ParamListBase {
  Course: {
    id: number;
    animated?: boolean;
    title?: string;
    uniqueShortcode?: string;
    lockEdition?: boolean;
  };
  CourseNoAssignment: {
    uniqueShortcode: string;
    courseName: string;
    shortcode: string;
    cfu?: number;
    year?: string;
    parentCourseName?: string;
  };
  Notice: { noticeId: number; courseId: number };
  CoursePreferences: { courseId: number; uniqueShortcode: string };
  CourseGuide: { courseId: number };
  CourseDirectory: {
    courseId: number;
    directoryId?: string;
    directoryName?: string;
    skipInitialDownloadCheck?: boolean;
  };
  CourseVideolecture: {
    courseId: number;
    lectureId: number;
    teacherId: number;
  };
  CourseVirtualClassroom: {
    courseId: number;
    lectureId: number;
    teacherId: number;
  };
  CourseAssignmentPdfCreation: { courseId: number; firstImageUri: string };
  CourseAssignmentUpload: { courseId: number };
  CourseAssignmentUploadConfirmation: { courseId: number; file: Assignment };
  CourseIconPicker: { courseId: number; uniqueShortcode: string };
  CourseColorPicker: { courseId: number; uniqueShortcode: string };
  CourseHideEvent: { courseId: number; uniqueShortcode: string };
  CourseFileMultiSelect: {
    courseId: number;
    mode: 'directory' | 'recent';
    directoryId?: string;
    directoryName?: string;
    initialSelectedIds?: string[];
  };
}

const Stack = createNativeStackNavigator<CourseSharedScreensParamList>();

export const CourseSharedScreens = () => {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        name="Course"
        component={CourseNavigator}
        getId={({ params }: { params: any }) => `${params.id}`}
        options={({ route: { params } }: { route: { params: any } }) => ({
          // The course name takes two lines and grows with the text size,
          // which the native header cannot do; the tab row draws the line
          header: props => (
            <AppHeader
              {...props}
              variant="inner"
              titleLines={2}
              hairline={false}
            />
          ),
          ...withoutHeaderHairline,
          animation: (params?.animated ?? true) ? 'default' : 'none',
        })}
      />
      <Stack.Screen
        name="CourseNoAssignment"
        component={CourseNoAssignmentScreen}
        getId={({ params }: { params: any }) => `${params.uniqueShortcode}`}
        options={{
          headerTitle: '',
        }}
      />
      <Stack.Screen
        name="Notice"
        component={NoticeScreen}
        getId={({ params }: { params: any }) =>
          `${params.courseId}${params.noticeId}`
        }
        options={{
          headerBackTitle: t('common.course'),
          headerTitle: t('common.notice'),
        }}
      />
      <Stack.Screen
        name="CoursePreferences"
        component={CoursePreferencesScreen}
        getId={({ params }: { params: any }) => `${params.courseId}`}
        options={{
          title: t('navigation.courseSettings'),
        }}
      />
      <Stack.Screen
        name="CourseIconPicker"
        component={CourseIconPickerScreen}
        getId={({ params }: { params: any }) => `${params.courseId}`}
        options={{
          title: t('courseIconPickerScreen.title'),
          headerSearchBarOptions: {},
        }}
      />
      <Stack.Screen
        name="CourseDirectory"
        component={CourseDirectoryScreen}
        getId={({ params }: { params: any }) => `${params?.directoryId}`}
        options={{}}
      />
      <Stack.Screen
        name="CourseHideEvent"
        component={CourseHideEventScreen}
        getId={({ params }: { params: any }) => `${params.courseId}`}
        options={{
          title: t('common.hiddenEvents'),
        }}
      />
      <Stack.Screen
        name="CourseGuide"
        component={CourseGuideScreen}
        getId={({ params }: { params: any }) => `${params.courseId}`}
        options={{
          headerTitle: t('courseGuideScreen.title'),
          headerBackTitle: t('common.course'),
        }}
      />

      <Stack.Screen
        name="CourseVideolecture"
        component={CourseVideolectureScreen}
        getId={({ params }: { params: any }) =>
          `${params.courseId}${params.lectureId}`
        }
        options={{
          headerBackTitle: t('common.course'),
          title: t('common.videoLecture'),
        }}
      />
      <Stack.Screen
        name="CourseVirtualClassroom"
        component={CourseVirtualClassroomScreen}
        getId={({ params }: { params: any }) =>
          `${params.courseId}${params.lectureId}`
        }
        options={{
          headerBackTitle: t('common.course'),
          title: t('courseVirtualClassroomScreen.title'),
        }}
      />
      <Stack.Screen
        name="CourseAssignmentPdfCreation"
        component={CourseAssignmentPdfCreationScreen}
        getId={({ params }: { params: any }) => `${params.courseId}`}
        options={{
          headerTitle: t('courseAssignmentPdfCreationScreen.title'),
        }}
      />
      <Stack.Screen
        name="CourseAssignmentUpload"
        component={CourseAssignmentUploadScreen}
        getId={({ params }: { params: any }) => `${params.courseId}`}
        options={{
          headerBackTitle: t('common.course'),
          headerTitle: t('courseAssignmentUploadScreen.title'),
        }}
      />
      <Stack.Screen
        name="CourseAssignmentUploadConfirmation"
        component={CourseAssignmentUploadConfirmationScreen}
        getId={({ params }: { params: any }) => `${params.courseId}`}
        options={{
          headerBackTitle: t('courseAssignmentUploadScreen.backTitle'),
          headerTitle: t('courseAssignmentUploadScreen.title'),
        }}
      />
      <Stack.Screen
        name="CourseColorPicker"
        component={CourseColorPickerScreen}
        getId={({ params }) => `${params.courseId}`}
        options={{
          title: t('courseColorPickerScreen.title'),
        }}
      />
      <Stack.Screen
        name="CourseFileMultiSelect"
        component={CourseFileMultiSelectScreen}
        options={({ navigation }) => ({
          presentation: 'modal',
          headerShown: Platform.OS === 'android' ? true : false,
          title: t('courseDirectoryScreen.selectFiles'),
          headerLeft: () => null,
          headerRight:
            Platform.OS === 'android'
              ? () => null
              : createHeaderCloseButton(navigation),
        })}
      />
    </>
  );
};
