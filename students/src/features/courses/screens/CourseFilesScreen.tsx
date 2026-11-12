import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, StyleSheet, View } from 'react-native';

import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { usePreferencesContext, useQueryStates } from '@polito/lib/core';
import {
  BottomBarSpacer,
  GlobalStyles,
  IndentedDivider,
  RefreshControl,
  RegionStateBlock,
  Row,
  SkeletonRows,
  StateBlock,
  Theme,
  TranslucentTextField,
  useSafeAreaSpacing,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import {
  CourseDirectory,
  CourseFileOverview,
} from '@polito/student-api-client';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { useDownloadsContext } from '~/core/contexts/DownloadsContext';
import {
  CourseSectionEnum,
  getCourseKey,
  useGetCourseFilesRecent,
} from '~/core/queries/courseHooks';
import { AppPreferences } from '~/core/types/preferences';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useOnLeaveScreen } from '../../../core/hooks/useOnLeaveScreen';
import { CourseRecentFileListItem } from '../components/CourseRecentFileListItem';
import { FileScreenHeader } from '../components/FileScreenHeader';
import { useFileManagement } from '../hooks/useFileManagement';
import { FileStackParamList } from '../navigation/FileNavigator';

type Props = NativeStackScreenProps<FileStackParamList, 'RecentFiles'>;

const CourseFilesScreenContent = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const courseId = route.params.courseId;
  const multiSelectNav =
    (navigation.getParent()?.getParent() as any) ?? navigation;
  const recentFilesQuery = useGetCourseFilesRecent(courseId);
  const states = useQueryStates(recentFilesQuery);
  // The toolbar stays while loading, so nothing moves when the rows arrive
  const showToolbar = states.status === 'loading' || states.status === 'ready';
  const { paddingHorizontal } = useSafeAreaSpacing();
  const { clearNotificationScope } = useNotifications();
  const { updatePreference } = usePreferencesContext<AppPreferences>();
  const [searchFilter, setSearchFilter] = useState('');
  const styles = useStylesheet(createStyles);
  const onSwipeStart = useCallback(() => setScrollEnabled(false), []);
  const onSwipeEnd = useCallback(() => setScrollEnabled(true), []);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: getCourseKey(courseId, CourseSectionEnum.Files),
      });
    }, [courseId, queryClient]),
  );
  const {
    sortedData,
    activeSort,
    sortOptions,
    onPressSortOption,
    isRemoving,
    isDownloading,
  } = useFileManagement({
    courseId,
    data: recentFilesQuery.data,
    isDirectoryView: false,
  });
  const { downloads } = useDownloadsContext();

  const fileListData = useMemo(() => {
    const base = (sortedData || recentFilesQuery.data) ?? [];
    if (!searchFilter.trim()) return base;
    const q = searchFilter.trim().toLowerCase();
    return base.filter(item => (item.name ?? '').toLowerCase().includes(q));
  }, [sortedData, recentFilesQuery.data, searchFilter]);

  useOnLeaveScreen(() => {
    clearNotificationScope(['teaching', 'courses', `${courseId}`, 'files']);
  });

  const onToggleView = useCallback(() => {
    navigation.replace('DirectoryFiles', { courseId });
    updatePreference('filesScreen', 'directoryView');
  }, [navigation, courseId, updatePreference]);

  const { spacing } = useTheme();

  const footerSpacerHeight = spacing[20];

  return (
    <>
      {showToolbar && (
        <Row align="center" style={[paddingHorizontal, styles.searchBar]}>
          <TranslucentTextField
            autoFocus={searchFilter.length !== 0}
            autoCorrect={false}
            leadingIcon={faSearch}
            value={searchFilter}
            onChangeText={setSearchFilter}
            style={[GlobalStyles.grow, styles.textField]}
            label={t('courseDirectoryScreen.search')}
            editable={true}
            isClearable={!!searchFilter}
            onClear={() => setSearchFilter('')}
            onClearLabel={t('contactsScreen.clearSearch')}
          />
        </Row>
      )}
      {showToolbar && (
        <FileScreenHeader
          activeSort={activeSort}
          sortOptions={sortOptions}
          onPressSortOption={onPressSortOption}
          isDirectoryView={false}
          onToggleView={onToggleView}
          isSelectDisabled={isDownloading || isRemoving}
        />
      )}

      <View style={{ flex: 1 }}>
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          data={fileListData}
          extraData={{ downloads, isRemoving }}
          contentContainerStyle={paddingHorizontal}
          scrollEnabled={scrollEnabled}
          keyExtractor={(item: CourseDirectory | CourseFileOverview) => item.id}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={4}
          renderItem={({ item }) => {
            const fileItem = item as CourseFileOverview;
            return (
              <CourseRecentFileListItem
                item={fileItem}
                onSwipeStart={onSwipeStart}
                onSwipeEnd={onSwipeEnd}
                enableMultiSelect={false}
                disabled={isRemoving}
                onLongPress={() => {
                  if (isDownloading || isRemoving) return;
                  multiSelectNav?.navigate('CourseFileMultiSelect', {
                    courseId,
                    mode: 'recent',
                    initialSelectedIds: [fileItem.id],
                  });
                }}
              />
            );
          }}
          refreshControl={<RefreshControl queries={[recentFilesQuery]} />}
          ItemSeparatorComponent={Platform.select({
            ios: IndentedDivider,
          })}
          ListFooterComponent={
            <>
              <View style={{ height: footerSpacerHeight }} />
              <BottomBarSpacer />
            </>
          }
          ListEmptyComponent={
            states.status === 'loading' ? (
              <SkeletonRows
                card={false}
                count={8}
                leading="icon"
                trailing="none"
                label={t('states.files.loading')}
              />
            ) : states.status === 'ready' && searchFilter.trim() ? (
              <StateBlock
                card
                title={t('states.files.noMatchTitle', {
                  search: searchFilter.trim(),
                })}
                text={t('states.files.noMatchText')}
                action={{
                  label: t('states.files.clearSearch'),
                  onPress: () => setSearchFilter(''),
                }}
              />
            ) : (
              <RegionStateBlock
                states={states}
                emptyState={{
                  title: t('states.files.emptyTitle'),
                  text: t('states.files.emptyText'),
                }}
                errorState={{
                  title: t('states.files.failedTitle'),
                  text: t('states.files.failedText'),
                }}
              />
            )
          }
        />
      </View>
    </>
  );
};

const createStyles = ({ spacing, shapes, colors }: Theme) =>
  StyleSheet.create({
    textField: {
      borderRadius: shapes.lg,
    },
    searchBar: {
      paddingBottom: spacing[2],
      paddingTop: spacing[2],
      backgroundColor: colors.background,
    },
  });

export const CourseFilesScreen = ({ navigation, route }: Props) => {
  return <CourseFilesScreenContent navigation={navigation} route={route} />;
};
