import { createContext, useContext } from 'react';

/**
 * What a course tab asks of the course header, which belongs to the screen
 * around the tabs:
 * - `selection`: the Files selection mode, with the count as the title and
 *   Cancel in place of the back arrow
 * - `back`: the back arrow returns inside the tab first (from a folder to the
 *   folder above it) instead of leaving the course
 */
export type CourseHeaderOverride =
  | { kind: 'selection'; title: string; onCancel: () => void }
  | { kind: 'back'; onBack: () => void; label: string };

/**
 * Sets the override for the screen `owner` (its route key). Clearing only
 * clears the owner's own override, so a screen that loses focus after the
 * next one took the header does not undo it.
 */
export type SetCourseHeader = (
  owner: string,
  override: CourseHeaderOverride | null,
) => void;

export const CourseHeaderContext = createContext<SetCourseHeader | undefined>(
  undefined,
);

export const useSetCourseHeader = (): SetCourseHeader => {
  const setter = useContext(CourseHeaderContext);
  return setter ?? (() => {});
};
