import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';

import { useFeedbackContext, usePreferencesContext } from '@polito/lib/core';
import { courseColors, courseIcons } from '@polito/lib/features/courses';
import {
  BottomBarSpacer,
  Card,
  CourseTile,
  List,
  ListItem,
  OutlineIcon,
  RefreshControl,
  SectionHeader,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import {
  DownloadContext,
  useDownloadsContext,
} from '~/core/contexts/DownloadsContext';
import { getFileDatabase } from '~/core/database/FileDatabase';
import {
  CourseSectionEnum,
  getCourseKey,
  useGetCourse,
  useUpdateCoursePreferences,
} from '~/core/queries/courseHooks';
import { AppPreferences } from '~/core/types/preferences';

import { useConfirmationDialog } from '../../../core/hooks/useConfirmationDialog';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import {
  CourseColourSheet,
  CourseIconSheet,
  iconLabel,
  useColourName,
} from '../components/CourseLookSheets';
import { SettingSwitchRow } from '../components/SettingSwitchRow';
import { CourseContext, useCourseContext } from '../contexts/CourseContext';
import { formatSize } from '../utils/fileTree';

type NotificationKey = 'notices' | 'files' | 'lectures';
const NOTIFICATION_ROWS: {
  key: NotificationKey;
  icon: 'megaphone' | 'file' | 'video';
}[] = [
  { key: 'notices', icon: 'megaphone' },
  { key: 'files', icon: 'file' },
  { key: 'lectures', icon: 'video' },
];

/** How long "Saved" stays on a row */
const SAVED_MS = 2000;

/**
 * The downloaded files of the course: how much room they take, and a row
 * that removes them from the phone after asking
 */
const CourseFilesStorageRow = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { setFeedback } = useFeedbackContext();
  const { language } = usePreferencesContext<AppPreferences>();
  const {
    downloads,
    updateDownload,
    getCourseFolderPath,
    deleteLocalPath,
    removeFileFromStorage,
    cacheSizeVersion,
    refreshCacheVersion,
    isAnyDownloadInProgress,
  } = useDownloadsContext();
  const queryClient = useQueryClient();
  const courseId = useCourseContext();
  const { data: course } = useGetCourse(courseId);
  const courseFilesCache = getCourseFolderPath(courseId, course?.name);
  const [cacheSize, setCacheSize] = useState<number | undefined>(undefined);
  const confirm = useConfirmationDialog({
    title: t('course.settings.removeFilesTitle'),
    message: t('course.settings.removeFilesText'),
  });
  const fileDatabaseRef = useRef(getFileDatabase());
  const ctx = DownloadContext.Course;
  const ctxId = courseId.toString();

  const refreshSize = useCallback(() => {
    fileDatabaseRef.current
      .getTotalSizeByContext(ctx, ctxId)
      .then(setCacheSize)
      .catch(() => setCacheSize(undefined));
  }, [ctx, ctxId]);

  useEffect(() => {
    refreshSize();
  }, [cacheSizeVersion, refreshSize]);

  useFocusEffect(
    useCallback(() => {
      refreshSize();
    }, [refreshSize]),
  );

  const removeAll = useCallback(async () => {
    if (!courseFilesCache || !(await confirm())) return;
    try {
      Object.keys(downloads).forEach(key => {
        if (key.includes(courseFilesCache)) {
          updateDownload(key, { isDownloaded: false, phase: undefined });
        }
      });
      const files = await fileDatabaseRef.current.getFilesByContext(ctx, ctxId);
      await Promise.all(
        files.map(f => removeFileFromStorage(f.path).catch(() => {})),
      );
      await fileDatabaseRef.current.deleteFilesByContext(ctx, ctxId);
      await deleteLocalPath(courseFilesCache).catch(() => {});
      refreshCacheVersion();
      setFeedback({
        text: t('course.settings.filesRemoved'),
        isPersistent: false,
      });
      refreshSize();
      queryClient.invalidateQueries({
        queryKey: getCourseKey(courseId, CourseSectionEnum.Files),
      });
    } catch {
      setFeedback({
        text: t('course.settings.removeFilesFailed'),
        isError: true,
      });
    }
  }, [
    courseFilesCache,
    confirm,
    downloads,
    updateDownload,
    ctx,
    ctxId,
    setFeedback,
    t,
    refreshSize,
    queryClient,
    courseId,
    deleteLocalPath,
    removeFileFromStorage,
    refreshCacheVersion,
  ]);

  const isEmpty = cacheSize !== undefined && cacheSize === 0;
  return (
    <ListItem
      isAction={!isEmpty}
      title={t('course.settings.downloadedFiles')}
      subtitle={
        cacheSize === undefined
          ? t('course.settings.downloadedUnknown')
          : isEmpty
            ? t('course.settings.downloadedNone')
            : t('course.settings.downloadedSize', {
                size: formatSize(cacheSize, language),
              })
      }
      disabled={isEmpty || isAnyDownloadInProgress}
      leadingItem={<OutlineIcon name="hdd" color={colors.secondaryText} />}
      onPress={removeAll}
      accessibilityHint={isEmpty ? undefined : t('course.settings.removeHint')}
    />
  );
};

type Props = NativeStackScreenProps<
  TeachingStackParamList,
  'CoursePreferences'
>;

/**
 * Course settings: the three notification switches (saved as they change,
 * with "Saved", and put back with a message when saving fails), the colour
 * and icon of the course, whether it shows on Teaching and in the agenda,
 * its hidden agenda events, and its downloaded files
 */
export const CoursePreferencesScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { setFeedback } = useFeedbackContext();
  const colourName = useColourName();
  const { courseId, uniqueShortcode } = route.params;
  const courseQuery = useGetCourse(courseId);
  const { mutateAsync: updateCoursePreferences } =
    useUpdateCoursePreferences(courseId);
  const { courses: coursesPrefs, updatePreference } =
    usePreferencesContext<AppPreferences>();
  const coursePrefs = coursesPrefs[uniqueShortcode];
  const [sheet, setSheet] = useState<'colour' | 'icon' | null>(null);

  const defaultPrefs = {
    color: courseColors[0].color,
    isHidden: false,
    isHiddenInAgenda: false,
  };
  const color = coursePrefs?.color || defaultPrefs.color;
  const icon =
    coursePrefs?.icon && coursePrefs.icon in courseIcons
      ? coursePrefs.icon
      : undefined;

  const savePrefs = (changes: Partial<typeof defaultPrefs> & object) =>
    updatePreference('courses', {
      ...coursesPrefs,
      [uniqueShortcode]: { ...defaultPrefs, ...coursePrefs, ...changes },
    });

  // --- Notifications: optimistic, with the saved state and a rollback ---

  const [overrides, setOverrides] = useState<
    Partial<Record<NotificationKey, boolean>>
  >({});
  const [savedKey, setSavedKey] = useState<NotificationKey | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(savedTimer.current), []);
  const serverValues = courseQuery.data?.notifications;
  const values = useMemo(
    () => ({ ...serverValues, ...overrides }),
    [serverValues, overrides],
  );

  // An override goes once the server says the same
  useEffect(() => {
    if (!serverValues) return;
    setOverrides(prev => {
      const next = { ...prev };
      let changed = false;
      (Object.keys(prev) as NotificationKey[]).forEach(key => {
        if (serverValues[key] === prev[key]) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [serverValues]);

  const titles: Record<NotificationKey, string> = {
    notices: t('course.settings.announcements'),
    files: t('course.settings.files'),
    lectures: t('course.settings.lectures'),
  };

  const setNotifications = (
    changes: Partial<Record<NotificationKey, boolean>>,
    savedRow: NotificationKey | null,
  ) => {
    const before = { ...overrides };
    setOverrides(prev => ({ ...prev, ...changes }));
    updateCoursePreferences({ notifications: changes })
      .then(() => {
        if (!savedRow) return;
        clearTimeout(savedTimer.current);
        setSavedKey(savedRow);
        AccessibilityInfo.announceForAccessibility(t('course.settings.saved'));
        savedTimer.current = setTimeout(() => setSavedKey(null), SAVED_MS);
      })
      .catch(() => {
        setOverrides(before);
        const text = savedRow
          ? t('course.settings.saveFailed', { name: titles[savedRow] })
          : t('course.settings.saveFailedAll');
        setFeedback({ text, isError: true });
        AccessibilityInfo.announceForAccessibility(text);
      });
  };

  return (
    <CourseContext.Provider value={courseId}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl queries={[courseQuery]} manual />}
      >
        <View style={styles.first}>
          <SectionHeader title={t('course.settings.notifications')} />
          <Card>
            <List>
              {NOTIFICATION_ROWS.map(row => (
                <SettingSwitchRow
                  key={row.key}
                  icon={row.icon}
                  title={titles[row.key]}
                  subtitle={t(`course.settings.${row.key}Text`)}
                  value={!!values[row.key]}
                  disabled={!courseQuery.data}
                  saved={savedKey === row.key}
                  onChange={value =>
                    setNotifications({ [row.key]: value }, row.key)
                  }
                />
              ))}
            </List>
          </Card>
          <Text variant="secondaryText" style={styles.note}>
            {t('course.settings.notificationsNote')}
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('course.settings.display')} />
          <Card>
            <List>
              <ListItem
                title={t('course.settings.colour')}
                subtitle={t('course.settings.colourText', {
                  name: colourName(color),
                })}
                leadingItem={<CourseTile color={color} icon={icon} />}
                isAction
                onPress={() => setSheet('colour')}
                accessibilityHint={t('course.settings.opensSheet')}
              />
              <ListItem
                title={t('course.settings.icon')}
                subtitle={t('course.settings.iconText', {
                  name: icon
                    ? iconLabel(icon)
                    : t('course.settings.defaultIconName'),
                })}
                leadingItem={<CourseTile color={color} icon={icon} />}
                isAction
                onPress={() => setSheet('icon')}
                accessibilityHint={t('course.settings.opensSheet')}
              />
              <SettingSwitchRow
                icon="book"
                title={t('course.settings.show')}
                subtitle={t('course.settings.showText')}
                value={!coursePrefs?.isHidden}
                disabled={!coursePrefs}
                onChange={value => {
                  savePrefs({ isHidden: !value });
                  // Following a course again turns its notifications on, and
                  // stopping turns them off, as the app did before
                  setNotifications(
                    { notices: value, lectures: value, files: value },
                    null,
                  );
                }}
              />
            </List>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('course.settings.agenda')} />
          <Card>
            <List>
              <SettingSwitchRow
                icon="eyeoff"
                title={t('course.settings.hideInAgenda')}
                subtitle={t('course.settings.hideInAgendaText')}
                value={
                  !!(coursePrefs?.isHiddenInAgenda || coursePrefs?.isHidden)
                }
                disabled={!coursePrefs || !!coursePrefs.isHidden}
                onChange={value => savePrefs({ isHiddenInAgenda: value })}
              />
              <ListItem
                title={t('common.hiddenEvents')}
                subtitle={t('course.settings.hiddenEventsText')}
                leadingItem={
                  <OutlineIcon name="clock" color={colors.secondaryText} />
                }
                isAction
                onPress={() =>
                  navigation.navigate('CourseHideEvent', {
                    courseId,
                    uniqueShortcode,
                  })
                }
                disabled={
                  !coursePrefs?.itemsToHideInAgenda?.length &&
                  !coursePrefs?.singleItemsToHideInAgenda?.length
                }
              />
            </List>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('course.settings.filesSection')} />
          <Card>
            <CourseFilesStorageRow />
          </Card>
        </View>
        <BottomBarSpacer />
      </ScrollView>
      <CourseColourSheet
        visible={sheet === 'colour'}
        color={color}
        icon={icon}
        onPick={next => {
          savePrefs({ color: next });
          setSheet(null);
          AccessibilityInfo.announceForAccessibility(
            t('course.settings.colourSet', { name: colourName(next) }),
          );
        }}
        onCustom={() => {
          setSheet(null);
          navigation.navigate('CourseColorPicker', {
            courseId,
            uniqueShortcode,
          });
        }}
        onClose={() => setSheet(null)}
      />
      <CourseIconSheet
        visible={sheet === 'icon'}
        color={color}
        icon={icon}
        onPick={next => {
          updatePreference('courses', {
            ...coursesPrefs,
            [uniqueShortcode]: { ...defaultPrefs, ...coursePrefs, icon: next },
          } as AppPreferences['courses']);
          setSheet(null);
          AccessibilityInfo.announceForAccessibility(
            t('course.settings.iconSet', {
              name: next
                ? iconLabel(next)
                : t('course.settings.defaultIconName'),
            }),
          );
        }}
        onClose={() => setSheet(null)}
      />
    </CourseContext.Provider>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    first: {
      marginTop: spacing[4],
    },
    section: {
      marginTop: layout.sectionGap,
    },
    note: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[2],
    },
  });
