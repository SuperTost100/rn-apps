import { useTranslation } from 'react-i18next';

import { AgendaNavigatorID } from '@polito/lib/core';
import {
  PlacesNavigator,
  type PlacesStackParamList,
} from '@polito/lib/features/places';
import {
  offlineScreenLayout,
  useInnerHeaderOptions,
  useInnerTitleOptions,
  useTabRootHeaderOptions,
} from '@polito/lib/ui';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AgendaPreferencesScreen } from '~/features/agenda/screens/AgendaPreferencesScreen.tsx';
import { HiddenEventsScreen } from '~/features/agenda/screens/HiddenEventsScreen.tsx';
import { UnreadMessagesModal } from '~/features/user/screens/UnreadMessagesModal';
import {
  SharedScreens,
  SharedScreensParamList,
} from '~/shared/navigation/SharedScreens.tsx';

import { BookingSeatScreen } from '../../bookings/screens/BookingSeatScreen';
import {
  CourseSharedScreens,
  CourseSharedScreensParamList,
} from '../../courses/navigation/CourseSharedScreens';
import { ExamQuestionScreen } from '../../teaching/screens/ExamQuestionScreen';
import { ExamRequestScreen } from '../../teaching/screens/ExamRequestScreen';
import { ExamRescheduleScreen } from '../../teaching/screens/ExamRescheduleScreen';
import { ExamScreen } from '../../teaching/screens/ExamScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { DeadlineScreen } from '../screens/DeadlineScreen';
import { LectureScreen } from '../screens/LectureScreen';
import { DeadlineItem, LectureItem } from '../types/AgendaItem';

export type AgendaStackParamList = CourseSharedScreensParamList &
  SharedScreensParamList & {
    /**
     * `date` (yyyy-MM-dd) shows that day; `requestedAt` makes the same day
     * apply again when it is asked for a second time
     */
    Agenda: { date?: string; requestedAt?: number } | undefined;
    Lecture: { item: LectureItem };
    Exam: { id: number; dateChangeSent?: boolean };
    ExamQuestion: { id: number };
    ExamRequest: { id: number };
    ExamReschedule: { id: number };
    Deadline: { item: DeadlineItem };
    Booking: { id: number };
    BookingSeat: {
      bookingId: number;
      topicId: string;
      slotId: string;
      seatId: number;
    };
    PlacesAgendaStack: NavigatorScreenParams<PlacesStackParamList>;
    AgendaPreferences: undefined;
    HiddenEvents: undefined;
  };

const Stack = createNativeStackNavigator<
  AgendaStackParamList,
  typeof AgendaNavigatorID
>();

export const AgendaNavigator = () => {
  const { t } = useTranslation();
  const rootOptions = useTabRootHeaderOptions();
  const placesHeaderOptions = { inner: useInnerTitleOptions() };

  return (
    <Stack.Navigator
      screenLayout={offlineScreenLayout}
      id={AgendaNavigatorID}
      screenOptions={useInnerHeaderOptions()}
      initialRouteName="Agenda"
    >
      <Stack.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          ...rootOptions,
          headerTitle: t('agendaScreen.title'),
        }}
      />
      <Stack.Screen
        name="Lecture"
        component={LectureScreen}
        getId={({ params }) => `${params.item.courseId}${params.item.id}`}
        options={({ route }) => ({
          headerTitle: route.params.item.title,
        })}
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
          headerTitle: t('examQuestionScreen.headerTitle'),
        }}
      />
      <Stack.Screen
        name="ExamRequest"
        component={ExamRequestScreen}
        getId={({ params }) => `${params.id}`}
        options={{
          headerTitle: t('examRequestScreen.headerTitle'),
        }}
      />
      <Stack.Screen
        name="ExamReschedule"
        component={ExamRescheduleScreen}
        getId={({ params }) => `${params.id}`}
        options={{
          headerTitle: t('examRescheduleScreen.headerTitle'),
        }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        getId={({ params }) => `${params.id}`}
        options={{
          headerTitle: t('common.booking'),
        }}
      />
      <Stack.Screen
        name="BookingSeat"
        component={BookingSeatScreen}
        options={{
          headerTitle: t('common.seat'),
        }}
      />
      <Stack.Screen
        name="Deadline"
        component={DeadlineScreen}
        getId={({ params }) => `${params.item.id}`}
        options={({ route }) => ({
          headerTitle: route.params.item.title,
        })}
      />
      <Stack.Screen
        name="PlacesAgendaStack"
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
        name="AgendaPreferences"
        component={AgendaPreferencesScreen}
        options={{
          title: t('common.preferencesAgenda'),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="HiddenEvents"
        component={HiddenEventsScreen}
        options={{
          title: t('common.hiddenEvents'),
          headerShown: true,
        }}
      />
      {CourseSharedScreens()}
      {SharedScreens()}
    </Stack.Navigator>
  );
};
