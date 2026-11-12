import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  ListRenderItemInfo,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { usePreferencesContext } from '@polito/lib/core';
import { useGetPerson } from '@polito/lib/features/people';
import { resolvePlaceId } from '@polito/lib/features/places';
import {
  BottomBarSpacer,
  CourseTile,
  CtaButton,
  CtaButtonContainer,
  CtaButtonSpacer,
  GlobalStyles,
  Icon,
  ListItem,
  OverviewList,
  PersonListItem,
  Swiper,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { VirtualClassroomRecording } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppPreferences } from '~/core/types/preferences.ts';

import { VideoPlayer } from '../../../core/components/VideoPlayer';
import { useGetCourseVirtualClassrooms } from '../../../core/queries/courseHooks';
import { isRecordedVC } from '../../courses/utils/lectures';
import { AgendaStackParamList } from '../components/AgendaNavigator';
import { EventHead } from '../components/EventHead';
import { useAgendaDialog } from '../hooks/useAgendaDialog';
import { cleanupPastSingleEvents } from '../utils/hiddenEvents';
import { placesStack } from '../utils/placesStack';

type Props = NativeStackScreenProps<AgendaStackParamList, 'Lecture'>;

export const LectureScreen = ({ route, navigation }: Props) => {
  const { item: lecture } = route.params;
  const associatedVirtualClassrooms = lecture.virtualClassrooms;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const teacherQuery = useGetPerson(lecture.teacherId);
  const { data: virtualClassrooms } = useGetCourseVirtualClassrooms(
    lecture.courseId,
  );
  const {
    courses: coursesPrefs,
    updatePreference,
    language,
  } = usePreferencesContext<AppPreferences>();
  const agendaDialog = useAgendaDialog();

  const coursePrefs = useMemo(() => {
    if (!lecture?.uniqueShortcode) {
      return null;
    }
    return coursesPrefs[lecture?.uniqueShortcode];
  }, [lecture?.uniqueShortcode, coursesPrefs]);
  const [currentIndex, setCurrentVideoIndex] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>();

  const handleSetCurrentPageIndex = (newIndex: number) => {
    setCurrentVideoIndex(newIndex);
  };

  const toggleFullScreen = (value: boolean) => {
    setIsFullScreen(value);
  };

  const [width, setWidth] = useState(Dimensions.get('screen').width);
  const [height, setHeight] = useState(Dimensions.get('screen').height);
  useEffect(() => {
    const updateDimensions = () => {
      const { width: newWidth, height: newHeight } = Dimensions.get('screen');
      setWidth(newWidth);
      setHeight(newHeight);
    };
    const subscription = Dimensions.addEventListener(
      'change',
      updateDimensions,
    );
    return () => subscription.remove();
  }, []);

  const renderItem = ({
    item,
    index,
  }: ListRenderItemInfo<VirtualClassroomRecording>) => {
    return (
      <View
        style={{
          width: isFullScreen ? width : Dimensions.get('window').width,
          height: isFullScreen ? height : undefined,
          display: isFullScreen && index !== currentIndex ? 'none' : 'flex',
        }}
      >
        <VideoPlayer
          source={{ uri: item.videoUrl }}
          poster={item.coverUrl ?? undefined}
          toggleFullScreen={toggleFullScreen}
          currentIndex={currentIndex}
          index={index}
        />
      </View>
    );
  };

  const [playingVC, setPlayingVC] = useState<VirtualClassroomRecording[]>([]);

  useEffect(() => {
    if (!associatedVirtualClassrooms || !virtualClassrooms) return;

    setCurrentVideoTitle(associatedVirtualClassrooms[currentIndex]?.title);
    setPlayingVC(
      associatedVirtualClassrooms
        .map(vc => {
          const apiVC = virtualClassrooms.find(vcs => vcs.id === vc.id);

          return apiVC as VirtualClassroomRecording;
        })
        .filter(vc => vc && vc?.videoUrl),
    );
  }, [associatedVirtualClassrooms, currentIndex, virtualClassrooms]);

  const changeEventVisibility = () => {
    if (!lecture.uniqueShortcode || !coursePrefs) {
      return;
    }

    const cleanedSingleEvents = cleanupPastSingleEvents(
      coursePrefs.singleItemsToHideInAgenda,
    );

    updatePreference('courses', {
      ...coursesPrefs,
      [lecture?.uniqueShortcode]: {
        ...coursePrefs,
        itemsToHideInAgenda: [
          ...(coursePrefs.itemsToHideInAgenda || []),
          {
            start: lecture.fromTime,
            end: lecture.toTime,
            day: lecture.start.weekday,
            room: lecture.place ? resolvePlaceId(lecture.place) : '',
          },
        ],
        singleItemsToHideInAgenda: cleanedSingleEvents,
      },
    });
    navigation.pop();
  };

  const changeSingleEventVisibility = () => {
    if (!lecture.uniqueShortcode || !coursePrefs) {
      return;
    }

    const cleanedSingleEvents = cleanupPastSingleEvents(
      coursePrefs.singleItemsToHideInAgenda,
    );

    updatePreference('courses', {
      ...coursesPrefs,
      [lecture?.uniqueShortcode]: {
        ...coursePrefs,
        singleItemsToHideInAgenda: [
          ...cleanedSingleEvents,
          {
            start: lecture.fromTime,
            end: lecture.toTime,
            day: lecture.start.toString(),
            room: lecture.place ? resolvePlaceId(lecture.place) : '',
          },
        ],
      },
    });
    navigation.pop();
  };

  const hideEvent = () => {
    agendaDialog.hideEvent(
      () => changeSingleEventVisibility(),
      () => changeEventVisibility(),
    );
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={GlobalStyles.fillHeight}
        scrollEnabled={!isFullScreen}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {playingVC &&
            playingVC.length === 1 &&
            playingVC[0] &&
            isRecordedVC(playingVC[0]) && (
              <VideoPlayer
                source={{ uri: playingVC[0].videoUrl }}
                toggleFullScreen={toggleFullScreen}
                poster={playingVC[0].coverUrl ?? undefined}
              />
            )}
          {playingVC && playingVC.length > 1 && (
            <View
              style={{
                height: isFullScreen ? '100%' : 'auto',
                width: isFullScreen ? '100%' : 'auto',
              }}
            >
              <Swiper
                isFullScreen={isFullScreen}
                items={playingVC}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                onIndexChanged={handleSetCurrentPageIndex}
              />
            </View>
          )}

          {/* playingVC && isLiveVC(playingVC[0]) && (
          // TODO: handle live VC
            <View />
            <CtaButton title={t('courseVirtualClassroomScreen.liveCta')} action={Linking.openURL(lecture.)}/>
          ) */}
          <EventHead
            caption={lecture.description || t('common.lecture')}
            subtitle={currentVideoTitle}
            date={lecture.start.setLocale(language).toFormat('ccc, d LLL yyyy')}
            time={`${lecture.fromTime} - ${lecture.toTime}`}
          />
          <OverviewList indented style={styles.list}>
            {lecture?.place && (
              <ListItem
                leadingItem={
                  <Icon
                    icon={faLocationDot}
                    size={24}
                    color={colors.secondaryText}
                  />
                }
                title={lecture.place.name || '-'}
                subtitle={t('lectureScreen.roomSubtitle')}
                accessibilityLabel={t('lectureScreen.roomLabel', {
                  room: lecture.place.name,
                })}
                isAction
                onPress={() => {
                  navigation.navigate(placesStack(navigation), {
                    screen: 'Place',
                    params: {
                      placeId: resolvePlaceId(lecture.place!),
                      isCrossNavigation: true,
                    },
                  });
                }}
              />
            )}
            {teacherQuery.data && (
              <PersonListItem
                person={teacherQuery.data}
                subtitle={t('common.teacher')}
              />
            )}
            <ListItem
              title={t('lectureScreen.openCourse')}
              subtitle={t('lectureScreen.openCourseSubtitle')}
              accessibilityLabel={t('lectureScreen.openCourseLabel', {
                course: lecture.title,
              })}
              leadingItem={
                <CourseTile color={lecture.color} icon={lecture.icon} />
              }
              linkTo={{
                screen: 'Course',
                params: { id: lecture.courseId },
              }}
            />
          </OverviewList>
          <CtaButtonSpacer />
          <BottomBarSpacer />
        </SafeAreaView>
      </ScrollView>
      <CtaButtonContainer absolute>
        <CtaButton
          title={t('lectureScreen.hideEventButtonTitle')}
          action={hideEvent}
          variant="outlined"
          destructive
          absolute={false}
          containerStyle={{
            paddingVertical: 0,
            display: isFullScreen ? 'none' : undefined,
          }}
        />
      </CtaButtonContainer>
    </>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    list: {
      marginTop: spacing[4],
    },
  });
