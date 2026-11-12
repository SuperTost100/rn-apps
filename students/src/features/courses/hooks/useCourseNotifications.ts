import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo } from 'react-native';

import { useFeedbackContext } from '@polito/lib/core';
import type { OutlineIconName } from '@polito/lib/ui';

import {
  useGetCourse,
  useUpdateCoursePreferences,
} from '~/core/queries/courseHooks';

export type NotificationKey = 'notices' | 'files' | 'lectures';

export const NOTIFICATION_ROWS: {
  key: NotificationKey;
  icon: OutlineIconName;
}[] = [
  { key: 'notices', icon: 'megaphone' },
  { key: 'files', icon: 'file' },
  { key: 'lectures', icon: 'video' },
];

/** How long "Saved" stays on a row */
const SAVED_MS = 2000;

/**
 * The three notification switches of a course, read from the course query
 * that course settings and Profile, Notifications both use. A change shows
 * at once, says Saved on its row, and goes back with a message when the
 * server refuses it. A saved change refetches the course, so the other
 * screen shows it too.
 *
 * `failureText` names what could not be saved; by default it names the
 * switch, as course settings does.
 */
export const useCourseNotifications = (
  courseId: number,
  failureText?: (row: NotificationKey | null) => string,
) => {
  const { t } = useTranslation();
  const { setFeedback } = useFeedbackContext();
  const query = useGetCourse(courseId);
  const { mutateAsync } = useUpdateCoursePreferences(courseId);

  const [overrides, setOverrides] = useState<
    Partial<Record<NotificationKey, boolean>>
  >({});
  const [savedKey, setSavedKey] = useState<NotificationKey | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const serverValues = query.data?.notifications;
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
    mutateAsync({ notifications: changes })
      .then(() => {
        if (!savedRow) return;
        clearTimeout(savedTimer.current);
        setSavedKey(savedRow);
        AccessibilityInfo.announceForAccessibility(t('course.settings.saved'));
        savedTimer.current = setTimeout(() => setSavedKey(null), SAVED_MS);
      })
      .catch(() => {
        setOverrides(before);
        const text = failureText
          ? failureText(savedRow)
          : savedRow
            ? t('course.settings.saveFailed', { name: titles[savedRow] })
            : t('course.settings.saveFailedAll');
        setFeedback({ text, isError: true });
        AccessibilityInfo.announceForAccessibility(text);
      });
  };

  return { query, values, savedKey, titles, setNotifications };
};
