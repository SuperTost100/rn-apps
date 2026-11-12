/**
 * The course's file tree as the Files tab shows it: folders, sorting,
 * search, folder figures and what a selection stands for. Plain functions
 * without React or native modules, so they can be checked on their own.
 */
import type {
  CourseDirectoryContentWithLocations,
  CourseFileOverviewWithLocation,
} from '../../../core/types/files';

export type FileEntry = CourseDirectoryContentWithLocations;
export type FolderEntry = Extract<FileEntry, { type: 'directory' }>;
export type FileItem = CourseFileOverviewWithLocation;

export type FileSortOrder = 'newest' | 'oldest' | 'az' | 'za' | 'downloaded';

export const FILE_SORT_ORDERS: FileSortOrder[] = [
  'newest',
  'oldest',
  'az',
  'za',
  'downloaded',
];

export const DEFAULT_FILE_SORT: FileSortOrder = 'newest';

export const isFileSortOrder = (value: unknown): value is FileSortOrder =>
  FILE_SORT_ORDERS.includes(value as FileSortOrder);

/** The orders the Files tab kept before, mapped to the new ones */
export const LEGACY_SORT_KEYS: Record<string, FileSortOrder> = {
  nameAZ: 'az',
  nameZA: 'za',
  downloadStatus: 'downloaded',
  newest: 'newest',
  oldest: 'oldest',
};

export const isFolder = (entry: FileEntry): entry is FolderEntry =>
  entry.type === 'directory';

const timeOf = (date: Date | string | undefined | null) => {
  if (!date) return 0;
  const ms = new Date(date).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

/** Every file in these entries and in the folders inside them */
export const filesIn = (entries: readonly FileEntry[]): FileItem[] => {
  const out: FileItem[] = [];
  const walk = (list: readonly FileEntry[]) =>
    list.forEach(entry => {
      if (isFolder(entry)) walk(entry.files ?? []);
      else out.push(entry);
    });
  walk(entries);
  return out;
};

/** A folder anywhere in the tree, with the folders that lead to it */
export const findFolder = (
  entries: readonly FileEntry[],
  id: string,
): { folder: FolderEntry; path: FolderEntry[] } | null => {
  for (const entry of entries) {
    if (!isFolder(entry)) continue;
    if (entry.id === id) return { folder: entry, path: [entry] };
    const inner = findFolder(entry.files ?? [], id);
    if (inner) return { folder: inner.folder, path: [entry, ...inner.path] };
  }
  return null;
};

/** Any entry of the tree by id */
export const findEntry = (
  entries: readonly FileEntry[],
  id: string,
): FileEntry | null => {
  for (const entry of entries) {
    if (entry.id === id) return entry;
    if (isFolder(entry)) {
      const inner = findEntry(entry.files ?? [], id);
      if (inner) return inner;
    }
  }
  return null;
};

export interface FolderStats {
  /** Files inside, at any depth */
  files: number;
  /** Folders directly inside */
  folders: number;
  kiloBytes: number;
  /** The newest file inside, in ms: 0 for a folder without files */
  latest: number;
  /** Files inside that are on the phone */
  downloaded: number;
}

export const folderStats = (
  folder: FolderEntry,
  isDownloaded: (fileId: string) => boolean = () => false,
): FolderStats => {
  const files = filesIn(folder.files ?? []);
  return {
    files: files.length,
    folders: (folder.files ?? []).filter(isFolder).length,
    kiloBytes: files.reduce((sum, f) => sum + (f.sizeInKiloBytes ?? 0), 0),
    latest: files.reduce((max, f) => Math.max(max, timeOf(f.createdAt)), 0),
    downloaded: files.filter(f => isDownloaded(f.id)).length,
  };
};

const compareNames = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/**
 * Folders first, then files, each in the chosen order. A folder's date is
 * its newest file's, and in "Downloaded first" it counts the files of it on
 * the phone. Ties fall back to the name, so the order never jumps.
 */
export const sortEntries = <T extends FileEntry>(
  entries: readonly T[],
  order: FileSortOrder,
  isDownloaded: (fileId: string) => boolean = () => false,
): T[] => {
  const stats = new Map<string, FolderStats>();
  const statsOf = (folder: FolderEntry) => {
    let s = stats.get(folder.id);
    if (!s) {
      s = folderStats(folder, isDownloaded);
      stats.set(folder.id, s);
    }
    return s;
  };
  const dateOf = (e: FileEntry) =>
    isFolder(e) ? statsOf(e).latest : timeOf(e.createdAt);
  const downloadedOf = (e: FileEntry) =>
    isFolder(e) ? statsOf(e).downloaded : Number(isDownloaded(e.id));
  const byName = (a: FileEntry, b: FileEntry) => compareNames(a.name, b.name);
  const compare: Record<FileSortOrder, (a: FileEntry, b: FileEntry) => number> =
    {
      newest: (a, b) => dateOf(b) - dateOf(a) || byName(a, b),
      oldest: (a, b) => dateOf(a) - dateOf(b) || byName(a, b),
      az: byName,
      za: (a, b) => byName(b, a),
      downloaded: (a, b) =>
        downloadedOf(b) - downloadedOf(a) ||
        dateOf(b) - dateOf(a) ||
        byName(a, b),
    };
  const cmp = compare[order];
  return [
    ...entries.filter(isFolder).sort(cmp),
    ...entries.filter(e => !isFolder(e)).sort(cmp),
  ];
};

/** The newest files of the course, for "Latest" */
export const latestFiles = (
  entries: readonly FileEntry[],
  count = 4,
): FileItem[] =>
  [...filesIn(entries)]
    .sort(
      (a, b) =>
        timeOf(b.createdAt) - timeOf(a.createdAt) ||
        compareNames(a.name, b.name),
    )
    .slice(0, count);

/** Lower case without accents, so "perche" finds "perché" */
const fold = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Files of the whole course whose name contains the search, in any folder */
export const searchFiles = (
  entries: readonly FileEntry[],
  search: string,
): FileItem[] => {
  const q = fold(search.trim());
  if (!q) return [];
  return filesIn(entries).filter(f => fold(f.name ?? '').includes(q));
};

/** Rows that can be selected: files, and folders with at least one file */
export const selectableIds = (entries: readonly FileEntry[]): string[] =>
  entries
    .filter(e => !isFolder(e) || filesIn(e.files ?? []).length > 0)
    .map(e => e.id);

/**
 * The files a selection stands for: the selected files and every file in the
 * selected folders, each once, in tree order. Ids are looked up anywhere in
 * the tree, so a file selected on its own inside a selected folder counts once.
 */
export const selectedFiles = (
  tree: readonly FileEntry[],
  ids: Iterable<string>,
): FileItem[] => {
  const wanted = new Set(ids);
  const out = new Map<string, FileItem>();
  const walk = (list: readonly FileEntry[], inSelected: boolean) =>
    list.forEach(entry => {
      const selected = inSelected || wanted.has(entry.id);
      if (isFolder(entry)) walk(entry.files ?? [], selected);
      else if (selected) out.set(entry.id, entry);
    });
  walk(tree, false);
  return [...out.values()];
};

/** Whether every selectable row of the list is selected */
export const allSelected = (
  entries: readonly FileEntry[],
  ids: ReadonlySet<string>,
) => {
  const selectable = selectableIds(entries);
  return selectable.length > 0 && selectable.every(id => ids.has(id));
};

/** Adds the id when missing, removes it when there */
export const toggleId = (ids: ReadonlySet<string>, id: string) => {
  const next = new Set(ids);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

/** "Esercitazioni / Testi" for "/Esercitazioni/Testi"; null in the top folder */
export const folderLabel = (location: string | undefined | null) => {
  const parts = (location ?? '').split('/').filter(Boolean);
  return parts.length ? parts.join(' / ') : null;
};

/** "2 KB", "120 KB", "2.3 MB", "403 MB", in the language's number format */
export const formatSize = (kiloBytes: number, language = 'en') => {
  const fmt = (n: number, digits: number) =>
    n.toLocaleString(language, { maximumFractionDigits: digits });
  if (kiloBytes < 1000) {
    // A file under 1 KB still reads "1 KB", never "0 KB"
    const kb = kiloBytes > 0 ? Math.max(1, Math.round(kiloBytes)) : 0;
    return `${fmt(kb, 0)} KB`;
  }
  const mb = kiloBytes / 1000;
  if (mb < 1000) return `${fmt(mb, mb < 10 ? 1 : 0)} MB`;
  const gb = mb / 1000;
  return `${fmt(gb, gb < 10 ? 1 : 0)} GB`;
};
