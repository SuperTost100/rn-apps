import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  BackHandler,
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
} from 'react-native';

import { faSearch } from '@fortawesome/free-solid-svg-icons';
import {
  useIsOnline,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  CardRow,
  List,
  RefreshControl,
  RegionStateBlock,
  SectionHeader,
  SkeletonRows,
  StateBlock,
  Text,
  TextButton,
  Theme,
  TranslucentTextField,
  useStylesheet,
} from '@polito/lib/ui';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { useNotifications } from '../../../core/hooks/useNotifications';
import { useOnLeaveScreen } from '../../../core/hooks/useOnLeaveScreen';
import {
  CourseSectionEnum,
  getCourseKey,
  useGetCourseFiles,
} from '../../../core/queries/courseHooks';
import { AppPreferences } from '../../../core/types/preferences';
import { stripIdInParentheses } from '../../../utils/files';
import { CourseFileRow } from '../components/CourseFileRow';
import { CourseFolderRow } from '../components/CourseFolderRow';
import { FileSortSheet } from '../components/FileSortSheet';
import { FilesToolbar, FilesView } from '../components/FilesToolbar';
import { SelectionActionBar } from '../components/SelectionActionBar';
import { useSetCourseHeader } from '../contexts/CourseHeaderContext';
import {
  useCourseFileActions,
  useDownloadedFileIds,
  useFileSort,
} from '../hooks/useCourseFiles';
import { FileStackParamList } from '../navigation/FileNavigator';
import {
  FileEntry,
  FolderEntry,
  allSelected,
  filesIn,
  findFolder,
  folderStats,
  isFolder,
  latestFiles,
  searchFiles,
  selectableIds,
  selectedFiles,
  sortEntries,
  toggleId,
} from '../utils/fileTree';

type Props = NativeStackScreenProps<
  FileStackParamList,
  'CourseFiles' | 'CourseFolder'
>;

/** How many files "Latest" shows */
const LATEST_COUNT = 4;

/**
 * The Files tab of a course, and each folder in it: a search over the whole
 * course, one toolbar row (view, order, Select), "Latest" and the folders
 * and files, or every file in one list. "Select" turns the rows into
 * checkboxes, with the count in the header and a bar to download or remove
 * what is selected.
 */
export const CourseFilesScreen = ({ route, navigation }: Props) => {
  const { courseId } = route.params;
  const folderId =
    'folderId' in route.params ? route.params.folderId : undefined;
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();
  const setCourseHeader = useSetCourseHeader();
  const isFocused = useIsFocused();
  const { getUnreadsCount, clearNotificationScope } = useNotifications();
  const { filesScreen, updatePreference } =
    usePreferencesContext<AppPreferences>();

  const filesQuery = useGetCourseFiles(courseId);
  const tree = useMemo(() => filesQuery.data ?? [], [filesQuery.data]);
  const states = useQueryStates(filesQuery, {
    isEmpty: (entries: FileEntry[]) => entries.length === 0,
  });
  const isReady = states.status === 'ready';

  const folderHit = useMemo(
    () => (folderId ? findFolder(tree, folderId) : null),
    [tree, folderId],
  );
  const view: FilesView =
    !folderId && filesScreen === 'filesView' ? 'all' : 'folders';
  const [sort, setSort] = useFileSort(courseId);
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<Set<string> | null>(null);
  const [barHeight, setBarHeight] = useState(0);

  const allFiles = useMemo(() => filesIn(tree), [tree]);
  const downloaded = useDownloadedFileIds(courseId, allFiles);
  const isDownloaded = useCallback(
    (id: string) => downloaded.has(id),
    [downloaded],
  );
  const { download, removeDownloads } = useCourseFileActions(courseId);

  // The rows of the list, before the search
  const entries: FileEntry[] = useMemo(() => {
    if (folderId) return folderHit?.folder.files ?? [];
    return view === 'all' ? allFiles : tree;
  }, [folderId, folderHit, view, allFiles, tree]);
  const sorted = useMemo(
    () => sortEntries(entries, sort, isDownloaded),
    [entries, sort, isDownloaded],
  );
  const searchResults = useMemo(
    () =>
      search.trim()
        ? sortEntries(searchFiles(tree, search), sort, isDownloaded)
        : null,
    [search, tree, sort, isDownloaded],
  );
  const latest = useMemo(
    () =>
      !folderId && view === 'folders' ? latestFiles(tree, LATEST_COUNT) : [],
    [folderId, view, tree],
  );

  useFocusEffect(
    useCallback(() => {
      if (folderId) return;
      queryClient.invalidateQueries({
        queryKey: getCourseKey(courseId, CourseSectionEnum.Files),
      });
    }, [folderId, courseId, queryClient]),
  );

  useOnLeaveScreen(() => {
    if (!folderId) {
      clearNotificationScope(['teaching', 'courses', `${courseId}`, 'files']);
    }
  });

  // --- Selection mode ---

  const isSelecting = selection !== null;
  const chosen = useMemo(
    () => (selection ? selectedFiles(tree, selection) : []),
    [selection, tree],
  );
  const toDownload = chosen.filter(f => !downloaded.has(f.id));
  const toRemove = chosen.filter(f => downloaded.has(f.id));
  const selectionTitle = selection
    ? t('course.files.selectedTitle', {
        count: selection.size,
        files: t('course.files.fileCount', { count: chosen.length }),
      })
    : '';

  const startSelection = useCallback(
    (firstId?: string) => {
      setSearch('');
      setSelection(new Set(firstId ? [firstId] : []));
      AccessibilityInfo.announceForAccessibility(
        t('course.files.selectionStarted'),
      );
    },
    [t],
  );
  const endSelection = useCallback(
    (announce = true) => {
      setSelection(null);
      if (announce) {
        AccessibilityInfo.announceForAccessibility(
          t('course.files.selectionEnded'),
        );
      }
    },
    [t],
  );
  const toggle = useCallback((id: string) => {
    setSelection(prev => (prev ? toggleId(prev, id) : prev));
  }, []);

  // The course header: the count in selection mode, and inside a folder a
  // back arrow that goes up one folder
  const owner = route.key;
  useEffect(() => {
    if (!isFocused) {
      setCourseHeader(owner, null);
    } else if (isSelecting) {
      setCourseHeader(owner, {
        kind: 'selection',
        title: selectionTitle,
        onCancel: () => endSelection(),
      });
    } else if (folderId) {
      setCourseHeader(owner, {
        kind: 'back',
        onBack: () => navigation.goBack(),
        label: t('course.files.backLabel'),
      });
    } else {
      setCourseHeader(owner, null);
    }
  }, [
    isFocused,
    isSelecting,
    selectionTitle,
    folderId,
    owner,
    navigation,
    endSelection,
    setCourseHeader,
    t,
  ]);
  useEffect(() => () => setCourseHeader(owner, null), [owner, setCourseHeader]);

  // Screen readers hear the count each time it changes
  const lastTitle = useRef('');
  useEffect(() => {
    if (selectionTitle && lastTitle.current) {
      AccessibilityInfo.announceForAccessibility(selectionTitle);
    }
    lastTitle.current = selectionTitle;
  }, [selectionTitle]);

  // Leaving the tab or the folder ends the selection; back ends it first
  useFocusEffect(
    useCallback(() => {
      if (!isSelecting) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        endSelection();
        return true;
      });
      return () => {
        sub.remove();
      };
    }, [isSelecting, endSelection]),
  );
  useEffect(() => {
    if (!isFocused) setSelection(null);
  }, [isFocused]);

  const visibleIds = useMemo(() => selectableIds(sorted), [sorted]);
  const everythingSelected = selection ? allSelected(sorted, selection) : false;
  const toggleAll = () => {
    const next = everythingSelected ? new Set<string>() : new Set(visibleIds);
    setSelection(next);
  };

  const onDownloadSelected = () => {
    download(toDownload);
    endSelection(false);
  };
  const onRemoveSelected = () => {
    const files = toRemove;
    endSelection(false);
    removeDownloads(files);
  };

  // --- Rows ---

  const openFolder = useCallback(
    (folder: FolderEntry) => {
      setSearch('');
      navigation.push('CourseFolder', { courseId, folderId: folder.id });
    },
    [navigation, courseId],
  );

  const folderUnread = (folder: FolderEntry) =>
    filesIn(folder.files ?? []).some(
      f =>
        !!getUnreadsCount([
          'teaching',
          'courses',
          `${courseId}`,
          'files',
          f.id,
        ]),
    );

  const renderEntry = (entry: FileEntry, showFolder: boolean) =>
    isFolder(entry) ? (
      <CourseFolderRow
        key={entry.id}
        folder={entry}
        stats={folderStats(entry, isDownloaded)}
        unread={folderUnread(entry)}
        onOpen={openFolder}
        selected={selection?.has(entry.id)}
        onToggle={isSelecting ? toggle : undefined}
        onLongPress={startSelection}
      />
    ) : (
      <CourseFileRow
        key={entry.id}
        courseId={courseId}
        file={entry}
        showFolder={showFolder}
        selected={selection?.has(entry.id)}
        onToggle={isSelecting ? toggle : undefined}
        onLongPress={startSelection}
      />
    );

  const listCard = (list: FileEntry[], showFolder: boolean) => (
    <Card>
      <List>{list.map(e => renderEntry(e, showFolder))}</List>
    </Card>
  );

  // --- Layout ---

  const showControls = states.status === 'loading' || states.status === 'ready';
  const crumbs = folderHit ? (
    <View
      style={styles.crumbs}
      accessibilityRole="toolbar"
      accessibilityLabel={t('course.files.pathLabel')}
    >
      <TextButton
        style={styles.crumbButton}
        onPress={() => navigation.popToTop()}
      >
        {t('course.files.title')}
      </TextButton>
      {folderHit.path.map((p, i) => {
        const last = i === folderHit.path.length - 1;
        const name = stripIdInParentheses(p.name);
        return (
          <View key={p.id} style={styles.crumb}>
            <Text variant="secondaryText" aria-hidden>
              /
            </Text>
            {last ? (
              <Text
                variant="secondaryText"
                style={styles.crumbCurrent}
                accessibilityLabel={t('course.files.currentFolder', { name })}
              >
                {name}
              </Text>
            ) : (
              <TextButton
                style={styles.crumbButton}
                onPress={() =>
                  navigation.popTo('CourseFolder', {
                    courseId,
                    folderId: p.id,
                  })
                }
              >
                {name}
              </TextButton>
            )}
          </View>
        );
      })}
    </View>
  ) : null;

  let body;
  if (states.status === 'loading') {
    body = (
      <SkeletonRows
        count={6}
        leading="icon"
        trailing="none"
        label={t('states.files.loading')}
        style={styles.firstBlock}
      />
    );
  } else if (!isReady) {
    body = (
      <RegionStateBlock
        states={states}
        style={styles.firstCard}
        emptyState={{
          title: t('states.files.emptyTitle'),
          text: t('course.files.emptyText'),
        }}
        errorState={{
          title: t('states.files.failedTitle'),
          text: t('states.files.failedText'),
        }}
      />
    );
  } else if (folderId && !folderHit) {
    body = (
      <StateBlock
        card
        style={styles.firstCard}
        title={t('course.files.folderGoneTitle')}
        text={t('course.files.folderGoneText')}
        action={{
          label: t('course.files.backToFiles'),
          onPress: () => navigation.popToTop(),
        }}
      />
    );
  } else if (searchResults) {
    body = searchResults.length ? (
      <Text
        variant="secondaryText"
        style={styles.resultCount}
        accessibilityLiveRegion="polite"
      >
        {t('course.files.matches', {
          count: searchResults.length,
          search: search.trim(),
        })}
      </Text>
    ) : (
      <StateBlock
        card
        style={styles.firstCard}
        title={t('states.files.noMatchTitle', { search: search.trim() })}
        text={t('course.files.noMatchText')}
        action={{
          label: t('states.files.clearSearch'),
          onPress: () => setSearch(''),
        }}
      />
    );
  } else if (folderId) {
    body = sorted.length ? null : (
      <StateBlock
        card
        title={t('states.files.emptyFolderTitle')}
        text={t('states.files.emptyFolderText')}
      />
    );
  } else {
    body = (
      <>
        {latest.length > 0 && !isSelecting && (
          <View style={styles.section}>
            <SectionHeader title={t('course.files.latest')} />
            {listCard(latest, true)}
          </View>
        )}
        <View style={[styles.section, isSelecting && styles.firstBlock]}>
          {!isSelecting && (
            <SectionHeader
              title={
                view === 'all'
                  ? t('course.files.allFiles')
                  : t('course.files.foldersAndFiles')
              }
            />
          )}
        </View>
      </>
    );
  }

  // The long list (all files, a folder, search results) is virtualised: a
  // course can have hundreds of files. Everything above it is the header.
  let rows: FileEntry[] = [];
  let rowsShowFolder = false;
  if (states.status !== 'loading' && isReady) {
    if (searchResults) {
      rows = searchResults;
      rowsShowFolder = true;
    } else if (folderId) {
      rows = folderHit ? sorted : [];
    } else {
      rows = sorted;
      rowsShowFolder = view === 'all';
    }
  }
  const renderRow: ListRenderItem<FileEntry> = ({ item, index }) => (
    <CardRow index={index} count={rows.length}>
      {renderEntry(item, rowsShowFolder)}
    </CardRow>
  );

  const header = (
    <>
      {showControls && !isSelecting && (
        <View style={styles.search}>
          <TranslucentTextField
            autoCorrect={false}
            leadingIcon={faSearch}
            value={search}
            onChangeText={setSearch}
            label={t('course.files.search')}
            editable={isReady}
            isClearable={!!search}
            onClear={() => setSearch('')}
            onClearLabel={t('contactsScreen.clearSearch')}
            style={styles.searchField}
          />
        </View>
      )}
      {showControls && !search.trim() && (
        <>
          {isSelecting ? (
            <View style={styles.selectionRow}>
              <Text variant="secondaryText" style={styles.selectionHint}>
                {t('course.files.selectionHint')}
              </Text>
              <TextButton onPress={toggleAll}>
                {everythingSelected
                  ? t('course.files.clearSelection')
                  : t('course.files.selectAll')}
              </TextButton>
            </View>
          ) : (
            <FilesToolbar
              view={folderId ? undefined : view}
              onChangeView={v =>
                updatePreference(
                  'filesScreen',
                  v === 'all' ? 'filesView' : 'directoryView',
                )
              }
              sort={sort}
              onPressSort={() => setSortOpen(true)}
              onPressSelect={() => startSelection()}
              disabled={!isReady || visibleIds.length === 0}
            />
          )}
          {!isOnline && isReady && !isSelecting && (
            <Text variant="secondaryText" style={styles.offlineNote}>
              {t('course.files.offlineNote')}
            </Text>
          )}
        </>
      )}
      {crumbs}
      {body}
    </>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={item => String(item.id)}
        renderItem={renderRow}
        extraData={[selection, isSelecting, rowsShowFolder]}
        ListHeaderComponent={header}
        ListFooterComponent={
          <>
            <View style={{ height: isSelecting ? barHeight : 0 }} />
            <BottomBarSpacer />
          </>
        }
        initialNumToRender={15}
        windowSize={11}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl manual queries={[filesQuery]} />}
      />
      {isSelecting && (
        <SelectionActionBar
          toDownload={toDownload.length}
          toRemove={toRemove.length}
          isOffline={!isOnline}
          onDownload={onDownloadSelected}
          onRemove={onRemoveSelected}
          onHeight={setBarHeight}
        />
      )}
      <FileSortSheet
        visible={sortOpen}
        value={sort}
        onChange={order => {
          setSort(order);
          AccessibilityInfo.announceForAccessibility(
            t('course.files.sortedBy', {
              order: t(`course.files.sort.${order}`),
            }),
          );
        }}
        onClose={() => setSortOpen(false)}
      />
    </View>
  );
};

const createStyles = ({ colors, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    // The first block sits 16 px under the tab row
    // The field keeps a 12 px margin of its own
    search: {
      paddingHorizontal: layout.gutter - spacing[3],
      paddingTop: spacing[4],
    },
    searchField: {
      borderRadius: shapes.lg,
    },
    firstBlock: {
      marginTop: spacing[2],
    },
    firstCard: {
      marginTop: spacing[4],
    },
    section: {
      marginTop: spacing[6],
    },
    selectionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: spacing[3],
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[2],
    },
    selectionHint: {
      flexShrink: 1,
      paddingVertical: spacing[2],
    },
    offlineNote: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[2],
    },
    // The first crumb's label sits on the gutter
    crumbs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      paddingHorizontal: layout.gutter - spacing[1],
      marginTop: spacing[2],
    },
    crumb: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },
    crumbButton: {
      paddingHorizontal: spacing[1],
      marginRight: 0,
    },
    crumbCurrent: {
      color: colors.title,
      paddingHorizontal: spacing[1],
    },
    resultCount: {
      paddingHorizontal: layout.gutter,
      marginTop: spacing[4],
    },
  });
