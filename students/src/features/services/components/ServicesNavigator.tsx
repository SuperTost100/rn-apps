import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import {
  ContactsScreen as LibContactsScreen,
  studentsUsefulContactsList,
} from '@polito/lib/features/people';
import {
  PlacesNavigator,
  type PlacesStackParamList,
} from '@polito/lib/features/places';
import {
  AppHeader,
  createHeaderCloseButton,
  offlineScreenLayout,
  useInnerHeaderOptions,
  useInnerTitleOptions,
  useTabRootHeaderOptions,
  withoutHeaderHairline,
} from '@polito/lib/ui';
import { TicketFAQ } from '@polito/student-api-client';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { UnreadMessagesModal } from '~/features/user/screens/UnreadMessagesModal';

import {
  SharedScreens,
  SharedScreensParamList,
} from '../../../shared/navigation/SharedScreens';
import { BookingScreen } from '../../agenda/screens/BookingScreen';
import { BookingSeatScreen } from '../../bookings/screens/BookingSeatScreen';
import { BookingSeatSelectionScreen } from '../../bookings/screens/BookingSeatSelectionScreen';
import { BookingSlotScreen } from '../../bookings/screens/BookingSlotScreen';
import { BookingSlotsLegendScreen } from '../../bookings/screens/BookingSlotsLegendScreen';
import { BookingTopicScreen } from '../../bookings/screens/BookingTopicScreen';
import { GuideScreen } from '../../guides/screens/GuideScreen';
import { GuidesScreen } from '../../guides/screens/GuidesScreen';
import { DegreeTopTabsNavigator } from '../../offering/navigation/DegreeTopTabsNavigator';
import { OfferingTopTabsNavigator } from '../../offering/navigation/OfferingTopTabsNavigator';
import { SurveyListScreen } from '../../surveys/screens/SurveyListScreen';
import { SurveysScreen } from '../../surveys/screens/SurveysScreen';
import { CreateTicketScreen } from '../../tickets/screens/CreateTicketScreen';
import { TicketAutoResolvedScreen } from '../../tickets/screens/TicketAutoResolvedScreen';
import { TicketFaqScreen } from '../../tickets/screens/TicketFaqScreen';
import { TicketFaqsScreen } from '../../tickets/screens/TicketFaqsScreen';
import { TicketInfoScreen } from '../../tickets/screens/TicketInfoScreen';
import { TicketResolvedScreen } from '../../tickets/screens/TicketResolvedScreen';
import { TicketScreen } from '../../tickets/screens/TicketScreen';
import { TicketsScreen } from '../../tickets/screens/TicketsScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { JobOfferScreen } from '../screens/JobOfferScreen';
import { JobOffersScreen } from '../screens/JobOffersScreen';
import { NewsItemScreen } from '../screens/NewsItemScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { ServicesScreen } from '../screens/ServicesScreen';

export type OfferingStackParamList = SharedScreensParamList & {
  Offering: undefined;
  Degree: { id: string; year?: string };
};

export type ServiceStackParamList = OfferingStackParamList & {
  Services: undefined;
  Tickets: { newId?: number } | undefined;
  Ticket: { id: number };
  TicketInfo: { id: number };
  TicketResolved: { ticketId: number; markAsResolved?: boolean };
  TicketAutoResolved: { ticketId: number };
  CreateTicket: {
    topicId?: number;
    subtopicId?: number;
  };
  TicketFaqs: undefined;
  TicketFaq: { faq: TicketFAQ };
  JobOffers: undefined;
  JobOffer: {
    id: number;
  };
  News: undefined;
  NewsItem: { id: number };
  Contacts: undefined;
  /** newId: the booking just made, highlighted in the list */
  Bookings: { newId?: number } | undefined;
  Booking: { id: number };
  BookingTopic: undefined;
  BookingSlot: { topicId: string; topicName: string };
  BookingSlotsLegend: undefined;
  BookingSeatSelection: {
    slotId: string;
    topicId: string;
    startHour: string;
    endHour: string;
    day: string;
    hasSeatSelection: boolean | undefined;
    /** ISO start of the slot, for the confirmation message */
    startsAt?: string;
  };
  BookingSeat: {
    bookingId: number;
    topicId: string;
    slotId: string;
    seatId: number;
  };
  Guides: undefined;
  Guide: { id: string };
  Surveys: undefined;
  SurveyList: { isCompiled: boolean };
  PlacesAgendaStack: NavigatorScreenParams<PlacesStackParamList>;
};

const Stack = createNativeStackNavigator<ServiceStackParamList>();

export const ServicesNavigator = () => {
  const { t } = useTranslation();
  const rootOptions = useTabRootHeaderOptions();
  const placesHeaderOptions = { inner: useInnerTitleOptions() };
  const ContactsScreen = () => (
    <LibContactsScreen
      usefulContacts={studentsUsefulContactsList}
      showPreferredContacts={false}
    />
  );

  return (
    <Stack.Navigator
      screenLayout={offlineScreenLayout}
      screenOptions={useInnerHeaderOptions()}
    >
      <Stack.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          ...rootOptions,
          headerTitle: t('servicesScreen.title'),
        }}
      />
      <Stack.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{
          headerTitle: t('ticketsScreen.title'),
        }}
      />
      <Stack.Screen
        name="Ticket"
        component={TicketScreen}
        getId={({ params: { id } }) => id.toString()}
        options={{
          headerTitle: '',
          // The subject may take two lines: the header is drawn in JS
          header: props => (
            <AppHeader {...props} variant="inner" titleLines={2} />
          ),
        }}
      />
      <Stack.Screen
        name="TicketInfo"
        component={TicketInfoScreen}
        getId={({ params: { id } }) => id.toString()}
        options={{
          headerTitle: '',
          headerBackTitle: t('ticketScreen.title'),
        }}
      />
      <Stack.Screen
        name="TicketResolved"
        component={TicketResolvedScreen}
        options={({ route }) => ({
          headerTitle: `${t('ticketScreen.title')} ${route.params.ticketId}`,
        })}
      />
      <Stack.Screen
        name="TicketAutoResolved"
        component={TicketAutoResolvedScreen}
        options={{
          headerTitle: '',
        }}
      />
      <Stack.Screen
        name="CreateTicket"
        component={CreateTicketScreen}
        options={{
          headerTitle: t('createTicketScreen.title'),
        }}
      />
      <Stack.Screen
        name="TicketFaqs"
        component={TicketFaqsScreen}
        options={{
          headerTitle: t('ticketFaqsScreen.title'),
        }}
      />
      <Stack.Screen
        name="TicketFaq"
        component={TicketFaqScreen}
        options={{
          headerTitle: t('ticketFaqScreen.title'),
        }}
      />
      <Stack.Screen
        name="JobOffers"
        component={JobOffersScreen}
        options={{
          headerTitle: t('jobOffersScreen.title'),
        }}
      />
      <Stack.Screen
        name="JobOffer"
        component={JobOfferScreen}
        getId={({ params: { id } }) => id.toString()}
        options={{
          headerTitle: t('jobOfferScreen.title'),
        }}
      />
      <Stack.Screen
        name="News"
        component={NewsScreen}
        options={{
          headerTitle: t('serviceInfo.news.title'),
        }}
      />
      <Stack.Screen
        name="NewsItem"
        component={NewsItemScreen}
        getId={({ params: { id } }) => id.toString()}
        options={{
          headerTitle: t('newsScreen.title'),
        }}
      />
      <Stack.Screen
        name="Offering"
        component={OfferingTopTabsNavigator}
        options={{
          headerTitle: t('serviceInfo.catalogue.title'),
          ...withoutHeaderHairline,
        }}
      />
      <Stack.Screen
        name="Degree"
        component={DegreeTopTabsNavigator}
        getId={({ params: { id, year } }) => id + (year ?? '0')}
        options={{
          headerTitle: t('degreeScreen.title'),
          ...withoutHeaderHairline,
        }}
      />
      <Stack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          headerTitle: t('contactsScreen.title'),
        }}
      />
      <Stack.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          headerTitle: t('bookingsScreen.title'),
        }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        getId={({ params: { id } }) => id.toString()}
        options={{
          headerTitle: t('common.booking'),
        }}
      />
      <Stack.Screen
        name="BookingTopic"
        component={BookingTopicScreen}
        options={{
          headerTitle: t('bookingsScreen.newBooking'),
        }}
      />
      <Stack.Screen
        name="BookingSlot"
        component={BookingSlotScreen}
        options={({ route }) => ({
          headerTitle: route.params.topicName,
        })}
      />
      <Stack.Screen
        name="BookingSlotsLegend"
        component={BookingSlotsLegendScreen}
        options={({ navigation }) => ({
          presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal',
          ...(Platform.OS === 'ios'
            ? {
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
              }
            : {}),
          headerTitle: t('common.legend'),
          headerRight: createHeaderCloseButton(navigation),
        })}
      />
      <Stack.Screen
        name="BookingSeatSelection"
        component={BookingSeatSelectionScreen}
        options={{
          headerTitle: t('bookingSeatScreen.title'),
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
        name="Guides"
        component={GuidesScreen}
        options={{
          headerTitle: t('guidesScreen.title'),
        }}
      />
      <Stack.Screen
        name="Guide"
        component={GuideScreen}
        options={{
          headerTitle: t('guideScreen.title'),
        }}
      />
      <Stack.Screen
        name="Surveys"
        component={SurveysScreen}
        options={{
          headerTitle: t('surveysScreen.title'),
        }}
      />
      <Stack.Screen
        name="SurveyList"
        component={SurveyListScreen}
        options={{
          headerTitle: t('surveysScreen.compiledTitle'),
        }}
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
      {SharedScreens()}
    </Stack.Navigator>
  );
};
