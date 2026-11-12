import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreferencesContext } from '@polito/lib/core';
import { ListItem, OutlineIcon, useTheme } from '@polito/lib/ui';

import { AppPreferences } from '../../../core/types/preferences';
import { stripIdInParentheses } from '../../../utils/files';
import { FolderEntry, FolderStats, formatSize } from '../utils/fileTree';
import { SelectionBox } from './SelectionBox';

interface Props {
  folder: FolderEntry;
  stats: FolderStats;
  unread?: boolean;
  onOpen?: (folder: FolderEntry) => void;
  /** In selection mode: whether the row is selected */
  selected?: boolean;
  onToggle?: (id: string) => void;
  /** Outside selection mode: starts it with this folder selected */
  onLongPress?: (id: string) => void;
}

/** "9 files, 2 folders · 6.2 MB", or "Empty" */
export const useFolderSummary = () => {
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();
  return (stats: FolderStats) => {
    if (!stats.files && !stats.folders) return t('course.files.emptyFolder');
    const counts = [
      t('course.files.fileCount', { count: stats.files }),
      stats.folders
        ? t('course.files.folderCount', { count: stats.folders })
        : undefined,
    ]
      .filter(Boolean)
      .join(', ');
    return stats.kiloBytes
      ? `${counts} · ${formatSize(stats.kiloBytes, language)}`
      : counts;
  };
};

/**
 * A folder of the course: what it holds and its size. It opens the folder,
 * or in selection mode selects every file in it; a folder without files
 * cannot be selected.
 */
export const CourseFolderRow = memo(
  ({
    folder,
    stats,
    unread = false,
    onOpen,
    selected,
    onToggle,
    onLongPress,
  }: Props) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const summary = useFolderSummary()(stats);
    const name = stripIdInParentheses(folder.name);
    const isSelecting = onToggle !== undefined;
    const canSelect = stats.files > 0;

    return (
      <ListItem
        title={name}
        subtitle={summary}
        unread={unread && !isSelecting}
        leadingItem={<OutlineIcon name="folder" color={colors.accentText} />}
        isAction={!isSelecting}
        onPress={() =>
          isSelecting ? canSelect && onToggle(folder.id) : onOpen?.(folder)
        }
        onLongPress={
          !isSelecting && onLongPress && canSelect
            ? () => onLongPress(folder.id)
            : undefined
        }
        disabled={isSelecting && !canSelect}
        selected={isSelecting ? selected : undefined}
        accessibilityRole={isSelecting ? 'checkbox' : 'button'}
        accessibilityState={isSelecting ? { checked: !!selected } : undefined}
        accessibilityLabel={[
          unread && !isSelecting ? t('primitives.unread') : undefined,
          t('course.files.folderLabel', { name }),
          summary,
        ]
          .filter(Boolean)
          .join(', ')}
      >
        {isSelecting && (
          <SelectionBox checked={!!selected} disabled={!canSelect} />
        )}
      </ListItem>
    );
  },
);
