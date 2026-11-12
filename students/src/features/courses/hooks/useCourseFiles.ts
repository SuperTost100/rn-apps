import { useCallback, useEffect, useMemo, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DownloadContext,
  useDownloadsContext,
} from '../../../core/contexts/DownloadsContext';
import { getFileDatabase } from '../../../core/database/FileDatabase';
import { useDownloadQueue } from '../../../core/hooks/useDownloadQueue';
import { useGetCourse } from '../../../core/queries/courseHooks';
import { buildCourseFileUrl } from '../../../utils/files';
import {
  DEFAULT_FILE_SORT,
  FileItem,
  FileSortOrder,
  LEGACY_SORT_KEYS,
  isFileSortOrder,
} from '../utils/fileTree';

/**
 * Where a course file comes from and where it goes on the phone. The key is
 * the one the download machinery files its state under.
 */
export const useCourseFileRequest = (courseId: number) => {
  const { getCourseFilePath } = useDownloadsContext();
  const { data: course } = useGetCourse(courseId);
  const courseName = course?.name;
  return useCallback(
    (file: FileItem) => {
      const url = buildCourseFileUrl(courseId, file.id);
      const path = getCourseFilePath({
        courseId,
        courseName,
        location: file.location,
        fileId: file.id,
        fileName: file.name ?? '',
        mimeType: file.mimeType,
      });
      return { url, path, key: `${url}:${path}` };
    },
    [courseId, courseName, getCourseFilePath],
  );
};

/**
 * The files of the course that are on the phone. A file a row has already
 * checked (on disk, or just downloaded or removed) uses that state; the
 * others use the downloads database, read again whenever downloads change.
 */
export const useDownloadedFileIds = (courseId: number, files: FileItem[]) => {
  const { downloads, cacheSizeVersion } = useDownloadsContext();
  const requestOf = useCourseFileRequest(courseId);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    getFileDatabase()
      .getFilesByContext(DownloadContext.Course, String(courseId))
      .then(records => {
        if (!cancelled) setSavedIds(new Set(records.map(r => r.id)));
      })
      .catch(() => {
        if (!cancelled) setSavedIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, cacheSizeVersion]);

  return useMemo(() => {
    const ids = new Set<string>();
    files.forEach(file => {
      const state = downloads[requestOf(file).key];
      if (state ? state.isDownloaded : savedIds.has(file.id)) ids.add(file.id);
    });
    return ids;
  }, [files, downloads, requestOf, savedIds]);
};

/**
 * Downloading and removing several files at once, through the download
 * queue: it downloads a few at a time, survives leaving the screen and
 * reports progress and the result in the snackbar.
 */
export const useCourseFileActions = (courseId: number) => {
  const requestOf = useCourseFileRequest(courseId);
  const { addFilesAndStart, removeFiles } = useDownloadQueue(
    courseId,
    DownloadContext.Course,
  );
  const {
    updateDownload,
    removeFileFromStorage,
    setRemovalInProgress,
    refreshCacheVersion,
  } = useDownloadsContext();

  const download = useCallback(
    (files: FileItem[]) => {
      addFilesAndStart(
        files.map(file => {
          const { url, path } = requestOf(file);
          return {
            id: file.id,
            name: file.name ?? '',
            url,
            filePath: path,
            sizeInKiloBytes: file.sizeInKiloBytes,
          };
        }),
      );
    },
    [addFilesAndStart, requestOf],
  );

  const removeDownloads = useCallback(
    async (files: FileItem[]) => {
      if (!files.length) return;
      setRemovalInProgress(true);
      const fileDatabase = getFileDatabase();
      try {
        const records = await fileDatabase.getFilesByContext(
          DownloadContext.Course,
          String(courseId),
        );
        const recordsById = new Map(records.map(r => [r.id, r]));
        await Promise.all(
          files.map(async file => {
            const { path, key } = requestOf(file);
            const savedPath = recordsById.get(file.id)?.path ?? path;
            try {
              await removeFileFromStorage(savedPath);
            } catch (error) {
              console.error(`Error removing file ${savedPath}:`, error);
            }
            try {
              await fileDatabase.deleteFile(file.id);
            } catch (error) {
              console.error(`Error deleting file metadata ${file.id}:`, error);
            }
            updateDownload(key, {
              jobId: undefined,
              isDownloaded: false,
              downloadProgress: undefined,
            });
          }),
        );
        refreshCacheVersion();
        removeFiles(files.map(f => f.id));
      } finally {
        setRemovalInProgress(false);
      }
    },
    [
      courseId,
      requestOf,
      removeFileFromStorage,
      updateDownload,
      refreshCacheVersion,
      removeFiles,
      setRemovalInProgress,
    ],
  );

  return { download, removeDownloads };
};

// The key the Files tab kept its order under, so the choice carries over
const sortKeyOf = (courseId: number) => `@files_sort_${courseId}_files`;
const sortCache = new Map<number, FileSortOrder>();

const parseSort = (stored: string | null): FileSortOrder | undefined => {
  if (!stored) return undefined;
  if (isFileSortOrder(stored)) return stored;
  return LEGACY_SORT_KEYS[stored];
};

/** The order of the course's files, remembered per course */
export const useFileSort = (courseId: number) => {
  const [order, setOrderState] = useState<FileSortOrder>(
    () => sortCache.get(courseId) ?? DEFAULT_FILE_SORT,
  );

  useEffect(() => {
    if (sortCache.has(courseId)) return;
    let cancelled = false;
    AsyncStorage.getItem(sortKeyOf(courseId))
      .then(stored => {
        const parsed = parseSort(stored);
        if (parsed && !cancelled) {
          sortCache.set(courseId, parsed);
          setOrderState(parsed);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const setOrder = useCallback(
    (next: FileSortOrder) => {
      sortCache.set(courseId, next);
      setOrderState(next);
      // shortcut: a failed write keeps the order for this session only, move
      // it to the preferences context if it must survive storage errors
      AsyncStorage.setItem(sortKeyOf(courseId), next).catch(() => {});
    },
    [courseId],
  );

  return [order, setOrder] as const;
};
