import { FileNavigatorID } from '@polito/lib/core';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useCourseContext } from '../contexts/CourseContext';
import { CourseFilesScreen } from '../screens/CourseFilesScreen';

export type FileStackParamList = {
  CourseFiles: {
    courseId: number;
  };
  CourseFolder: {
    courseId: number;
    folderId: string;
  };
};

const Stack = createNativeStackNavigator<
  FileStackParamList,
  typeof FileNavigatorID
>();

/**
 * The Files tab: the course's files, and a screen per folder pushed on top,
 * under the course header and tabs
 */
export const FileNavigator = () => {
  const courseId = useCourseContext();

  return (
    <Stack.Navigator
      id={FileNavigatorID}
      screenOptions={{ headerShown: false }}
      initialRouteName="CourseFiles"
    >
      <Stack.Screen
        name="CourseFiles"
        component={CourseFilesScreen}
        initialParams={{ courseId }}
        options={{ animation: 'none' }}
      />
      <Stack.Screen
        name="CourseFolder"
        component={CourseFilesScreen}
        getId={({ params }) => params.folderId}
      />
    </Stack.Navigator>
  );
};
