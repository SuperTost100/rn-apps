import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import ContextMenu from 'react-native-context-menu-view';

import { faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  useIsOnline,
  usePreferencesContext,
} from '@polito/lib/core';
import {
  Icon,
  IconButton,
  ListItem,
  OutlineIcon,
  Text,
  Theme,
  getIconFromMimeType,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { DateTime } from 'luxon';

import {
  DownloadContext,
  useDownloadsContext,
} from '../../../core/contexts/DownloadsContext';
import { useDownloadFile } from '../../../core/hooks/useDownloadFile';
import { useNotifications } from '../../../core/hooks/useNotifications';
import { AppPreferences } from '../../../core/types/preferences';
import { stripIdInParentheses, wrappableFileName } from '../../../utils/files';
import { UnsupportedFileTypeError } from '../errors/UnsupportedFileTypeError';
import { useCourseFileRequest } from '../hooks/useCourseFiles';
import { FileItem, folderLabel, formatSize } from '../utils/fileTree';
import { SelectionBox } from './SelectionBox';

interface Props {
  courseId: number;
  file: FileItem;
  /** Says which folder the file is in: in Latest, All files and search */
  showFolder?: boolean;
  /** In selection mode: whether the row is selected */
  selected?: boolean;
  onToggle?: (id: string) => void;
  /** Outside selection mode: starts it with this file selected */
  onLongPress?: (id: string) => void;
}

/** "10 Nov", in the app time zone and language */
const useShortDate = () => {
  const { language } = usePreferencesContext<AppPreferences>();
  return useCallback(
    (date: Date) =>
      DateTime.fromJSDate(new Date(date), { zone: APP_TIMEZONE })
        .setLocale(language)
        .toFormat('d LLL'),
    [language],
  );
};

/**
 * A course file: its type icon, the name on up to two lines, the date, size
 * and folder, and a download button. The row shows the download's progress
 * and ends in "Downloaded"; a tap on a downloaded file opens it, and the
 * menu downloads it again or removes it from the phone. In selection mode
 * the row is a checkbox.
 */
export const CourseFileRow = memo(
  ({
    courseId,
    file,
    showFolder = false,
    selected,
    onToggle,
    onLongPress,
  }: Props) => {
    const { t } = useTranslation();
    const { colors, controls, dark } = useTheme();
    const styles = useStylesheet(createStyles);
    const { language } = usePreferencesContext<AppPreferences>();
    const shortDate = useShortDate();
    const isOnline = useIsOnline();
    const { getUnreadsCount } = useNotifications();
    const { downloadQueue } = useDownloadsContext();
    const requestOf = useCourseFileRequest(courseId);
    const { url, path } = requestOf(file);
    const isSelecting = onToggle !== undefined;

    const {
      isDownloaded,
      isCheckingDownloadStatus,
      isOutdated,
      downloadProgress,
      startDownload,
      stopDownload,
      refreshDownload,
      removeDownload,
      openFile,
    } = useDownloadFile(
      url,
      path,
      file.id,
      DownloadContext.Course,
      courseId.toString(),
      file.checksum,
    );

    const name =
      stripIdInParentheses(file.name ?? '') || t('common.unnamedFile');
    const size = file.sizeInKiloBytes
      ? formatSize(file.sizeInKiloBytes, language)
      : undefined;
    const folder = showFolder
      ? (folderLabel(file.location) ?? t('course.files.topFolder'))
      : undefined;
    const isQueued = downloadQueue.activeDownloadIds.has(file.id);
    const isDownloading = downloadProgress != null || isQueued;
    const done = isDownloaded && !isCheckingDownloadStatus && !isDownloading;
    const needsConnection = !done && !isDownloading && !isOnline;
    const percent = Math.round((downloadProgress ?? 0) * 100);
    const unread = !!getUnreadsCount([
      'teaching',
      'courses',
      `${courseId}`,
      'files',
      file.id,
    ]);

    // Screen readers hear the start and the end of a download, not each step
    const wasDownloading = useRef(false);
    useEffect(() => {
      if (isDownloading && !wasDownloading.current) {
        AccessibilityInfo.announceForAccessibility(
          t('course.files.downloadStarted', { name }),
        );
      } else if (!isDownloading && wasDownloading.current && isDownloaded) {
        AccessibilityInfo.announceForAccessibility(
          t('course.files.downloadDone', { name }),
        );
      }
      wasDownloading.current = isDownloading;
    }, [isDownloading, isDownloaded, name, t]);

    const open = useCallback(() => {
      openFile().catch(e => {
        if (e instanceof UnsupportedFileTypeError) {
          Alert.alert(t('common.error'), t('courseFileListItem.openFileError'));
        }
      });
    }, [openFile, t]);

    const onPress = useCallback(() => {
      if (isSelecting) {
        onToggle(file.id);
        return;
      }
      if (isDownloading) return;
      if (done && isOutdated) {
        refreshDownload();
      } else if (done) {
        open();
      } else {
        startDownload();
      }
    }, [
      isSelecting,
      onToggle,
      file.id,
      isDownloading,
      done,
      isOutdated,
      refreshDownload,
      open,
      startDownload,
    ]);

    const subtitleText = useMemo(() => {
      if (isDownloading) {
        return t('course.files.downloading', {
          percent,
          size: size ?? '',
        });
      }
      const parts = done
        ? [
            isOutdated
              ? t('course.files.newVersion')
              : t('course.files.downloaded'),
            size,
            folder,
          ]
        : [shortDate(file.createdAt), size, folder];
      return parts.filter(Boolean).join(' · ');
    }, [
      isDownloading,
      done,
      isOutdated,
      percent,
      size,
      folder,
      shortDate,
      file.createdAt,
      t,
    ]);

    const subtitle = (
      <View>
        <Text
          variant="secondaryText"
          style={done && !isOutdated && styles.downloadedText}
        >
          {subtitleText}
        </Text>
        {isDownloading && (
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${Math.max(percent, 2)}%` }]} />
          </View>
        )}
      </View>
    );

    const label = [
      unread ? t('primitives.unread') : undefined,
      isSelecting
        ? [name, size, done ? t('course.files.downloaded') : undefined]
            .filter(Boolean)
            .join(', ')
        : isDownloading
          ? t('course.files.downloadingLabel', { name, percent })
          : done
            ? t('course.files.openLabel', { name })
            : needsConnection
              ? t('course.files.needsConnectionLabel', { name, size })
              : t('course.files.downloadLabel', { name, size }),
      folder ? t('course.files.inFolder', { folder }) : undefined,
    ]
      .filter(Boolean)
      .join(', ');

    const iconColor = colors.secondaryText;
    let trailing;
    if (isSelecting) {
      trailing = undefined;
    } else if (isDownloading) {
      trailing = (
        <IconButton
          icon={faXmark}
          size={controls.iconSize - 4}
          color={iconColor}
          accessibilityLabel={t('course.files.stopLabel', { name })}
          onPress={stopDownload}
          noPadding
        />
      );
    } else if (done) {
      trailing = (
        <ContextMenu
          dropdownMenuMode
          title={name}
          actions={[
            {
              title: t('course.files.open'),
              titleColor: dark ? colors.white : colors.black,
            },
            {
              title: t('course.files.downloadAgain'),
              titleColor: dark ? colors.white : colors.black,
            },
            {
              title: t('course.files.removeDownload'),
              destructive: true,
              titleColor: dark ? colors.white : colors.black,
            },
          ]}
          onPress={({ nativeEvent: { index } }) => {
            if (index === 0) open();
            else if (index === 1) refreshDownload();
            else if (index === 2) removeDownload();
          }}
        >
          {/* A touchable without onPress keeps the tap from the row */}
          <TouchableOpacity
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel={t('course.files.optionsLabel', { name })}
          >
            <OutlineIcon
              name={isOutdated ? 'download' : 'check-circle'}
              color={isOutdated ? colors.link : colors.successText}
            />
          </TouchableOpacity>
        </ContextMenu>
      );
    } else if (needsConnection) {
      trailing = (
        <View
          style={styles.menuButton}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <OutlineIcon name="cloud-off" color={iconColor} />
        </View>
      );
    } else {
      trailing = (
        <TouchableOpacity
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel={t('course.files.downloadLabel', { name, size })}
          onPress={onPress}
        >
          <OutlineIcon name="download" color={colors.link} />
        </TouchableOpacity>
      );
    }

    return (
      <ListItem
        title={wrappableFileName(name)}
        subtitle={subtitle}
        unread={unread}
        leadingItem={
          <Icon
            icon={getIconFromMimeType(file.mimeType)}
            size={controls.iconSize}
            color={iconColor}
          />
        }
        trailingItem={trailing}
        onPress={onPress}
        onLongPress={
          !isSelecting && onLongPress ? () => onLongPress(file.id) : undefined
        }
        disabled={!isSelecting && needsConnection}
        selected={isSelecting ? selected : undefined}
        accessibilityRole={isSelecting ? 'checkbox' : 'button'}
        accessibilityState={
          isSelecting ? { checked: !!selected } : { busy: isDownloading }
        }
        accessibilityLabel={label}
        accessibilityHint={
          needsConnection && !isSelecting
            ? t('states.needsConnection')
            : undefined
        }
      >
        {isSelecting && <SelectionBox checked={!!selected} />}
      </ListItem>
    );
  },
);

const createStyles = ({ colors, controls, shapes, spacing }: Theme) =>
  StyleSheet.create({
    downloadedText: {
      color: colors.successText,
    },
    track: {
      height: 4,
      borderRadius: shapes.pill,
      backgroundColor: colors.surfaceSunken,
      marginTop: spacing[1.5],
      overflow: 'hidden',
    },
    bar: {
      height: 4,
      borderRadius: shapes.pill,
      backgroundColor: colors.primary,
    },
    menuButton: {
      width: controls.touchTarget,
      height: controls.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -spacing[3],
    },
  });
