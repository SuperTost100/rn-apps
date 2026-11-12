import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import {
  AppHeaderBackButton,
  OutlineIcon,
  Text,
  TextButton,
  Theme,
  TopTabBar,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useGetCourses } from '../../../core/queries/courseHooks';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { CourseContext } from '../contexts/CourseContext';
import {
  CourseHeaderContext,
  CourseHeaderOverride,
  SetCourseHeader,
} from '../contexts/CourseHeaderContext';
import { CourseAssignmentsScreen } from '../screens/CourseAssignmentsScreen';
import { CourseInfoScreen } from '../screens/CourseInfoScreen';
import { CourseLecturesScreen } from '../screens/CourseLecturesScreen';
import { CourseNoticesScreen } from '../screens/CourseNoticesScreen';
import { FileNavigator } from './FileNavigator';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Course'>;

export interface CourseTabsParamList extends TeachingStackParamList {
  CourseInfoScreen: { lockEdition?: boolean } | undefined;
  CourseNoticesScreen: undefined;
  CourseFilesScreen: undefined;
  CourseLecturesScreen: undefined;
  CourseAssignmentsScreen: undefined;
}

type CourseTab = Extract<
  keyof CourseTabsParamList,
  | 'CourseInfoScreen'
  | 'CourseNoticesScreen'
  | 'CourseFilesScreen'
  | 'CourseLecturesScreen'
  | 'CourseAssignmentsScreen'
>;

/**
 * The tab each course was last left on, for this session: a course opens on
 * Info the first time and on the tab used last afterwards
 */
const lastTabByCourse = new Map<number, CourseTab>();

const TopTabs = createMaterialTopTabNavigator<CourseTabsParamList>();

export const CourseNavigator = ({ route, navigation }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { getUnreadsCount } = useNotifications();

  const {
    id,
    title,
    uniqueShortcode: paramUniqueShortcode,
    lockEdition,
  } = route.params;
  const coursesQuery = useGetCourses();
  // Set by a tab: the Files selection mode, or the way back from a folder
  const [headerState, setHeaderState] = useState<{
    owner: string;
    override: CourseHeaderOverride;
  } | null>(null);
  const headerOverride = headerState?.override ?? null;
  const setHeaderOverride = useCallback<SetCourseHeader>(
    (owner, override) =>
      setHeaderState(prev =>
        override ? { owner, override } : prev?.owner === owner ? null : prev,
      ),
    [],
  );

  useEffect(() => {
    const courses = coursesQuery.data ?? [];
    const isEdition = (editions: { id: number | string }[]) =>
      editions.some(e => +e.id === id);
    const course = courses.find(
      c => c.id === id || isEdition(c.previousEditions),
    );
    const parentCourse = courses.find(c =>
      c.modules?.some(m => m.id === id || isEdition(m.previousEditions)),
    );
    const module = parentCourse?.modules?.find(
      m => m.id === id || isEdition(m.previousEditions),
    );

    let correctUniqueShortcode =
      course?.uniqueShortcode || paramUniqueShortcode || '';
    if (parentCourse) {
      const moduleIndex =
        parentCourse.modules?.findIndex(m => m.id === id) ?? -1;
      if (moduleIndex >= 0) {
        correctUniqueShortcode = `${parentCourse.uniqueShortcode}${moduleIndex + 1}`;
      }
    }

    // The header carries the name of the course, or of the module
    const displayTitle = module?.name ?? course?.name ?? title;

    const gear = ({ tintColor }: { tintColor?: string }) => (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('navigation.courseSettings')}
        style={styles.gear}
        onPress={() => {
          navigation.navigate('CoursePreferences', {
            courseId: id,
            uniqueShortcode: correctUniqueShortcode,
          });
        }}
      >
        <OutlineIcon name="gear" color={tintColor ?? colors.title} />
      </TouchableOpacity>
    );

    if (headerOverride?.kind === 'selection') {
      // The count is the title, the course name stays under it, and Cancel
      // takes the place of the back arrow and the gear
      navigation.setOptions({
        title: headerOverride.title,
        headerLeft: () => null,
        headerTitle: () => (
          <View>
            <Text
              variant="cardTitle"
              accessibilityRole="header"
              numberOfLines={2}
              style={{ color: colors.title }}
            >
              {headerOverride.title}
            </Text>
            <Text variant="secondaryText" numberOfLines={1}>
              {displayTitle}
            </Text>
          </View>
        ),
        headerRight: () => (
          <TextButton onPress={headerOverride.onCancel}>
            {t('common.cancel')}
          </TextButton>
        ),
        gestureEnabled: false,
      });
      return;
    }

    navigation.setOptions({
      title: displayTitle ?? '',
      headerTitle: undefined,
      headerLeft:
        headerOverride?.kind === 'back'
          ? ({ tintColor }) => (
              <AppHeaderBackButton
                tintColor={tintColor}
                onPress={headerOverride.onBack}
                accessibilityLabel={headerOverride.label}
                style={styles.back}
              />
            )
          : undefined,
      headerRight: gear,
      gestureEnabled: true,
    });
  }, [
    coursesQuery.data,
    colors.title,
    headerOverride,
    id,
    navigation,
    styles.back,
    styles.gear,
    t,
    title,
    paramUniqueShortcode,
  ]);
  return (
    <CourseContext.Provider value={id}>
      <CourseHeaderContext.Provider value={setHeaderOverride}>
        <TopTabs.Navigator
          tabBar={props => <TopTabBar {...props} />}
          initialRouteName={lastTabByCourse.get(id) ?? 'CourseInfoScreen'}
          // Back leaves the course from any tab, instead of stopping on Info
          // first, which would also reset the tab the course reopens on
          backBehavior="none"
          screenListeners={({ route: tab }) => ({
            focus: () => lastTabByCourse.set(id, tab.name as CourseTab),
          })}
        >
          <TopTabs.Screen
            name="CourseInfoScreen"
            component={CourseInfoScreen}
            initialParams={{ lockEdition }}
            options={{
              title: t('courseInfoTab.title'),
            }}
          />
          <TopTabs.Screen
            name="CourseNoticesScreen"
            component={CourseNoticesScreen}
            options={{
              title: t('courseNoticesTab.title'),
              tabBarBadge: () => {
                const count = getUnreadsCount([
                  'teaching',
                  'courses',
                  id.toString(),
                  'notices',
                ]);
                return count && count > 0 ? <Text>{count}</Text> : <Text />;
              },
            }}
          />
          <TopTabs.Screen
            name="CourseFilesScreen"
            component={FileNavigator}
            options={{
              title: t('courseFilesTab.title'),
              tabBarBadge: () => {
                const count = getUnreadsCount([
                  'teaching',
                  'courses',
                  id.toString(),
                  'files',
                ]);
                return count && count > 0 ? <Text>{count}</Text> : <Text />;
              },
            }}
          />
          <TopTabs.Screen
            name="CourseLecturesScreen"
            component={CourseLecturesScreen}
            options={{
              title: t('courseLecturesTab.title'),
              tabBarBadge: () => {
                const count = getUnreadsCount([
                  'teaching',
                  'courses',
                  id.toString(),
                  'lectures',
                ]);
                return count && count > 0 ? <Text>{count}</Text> : <Text />;
              },
            }}
          />
          <TopTabs.Screen
            name="CourseAssignmentsScreen"
            component={CourseAssignmentsScreen}
            options={{
              title: t('courseAssignmentsTab.title'),
            }}
          />
        </TopTabs.Navigator>
      </CourseHeaderContext.Provider>
    </CourseContext.Provider>
  );
};

const createStyles = ({ controls, spacing }: Theme) =>
  StyleSheet.create({
    // As the header's own back arrow: on the gutter, the target past it
    back: {
      marginLeft: -spacing[3],
      marginVertical: 0,
    },
    gear: {
      width: controls.touchTarget,
      height: controls.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
