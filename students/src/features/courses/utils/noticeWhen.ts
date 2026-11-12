import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { APP_TIMEZONE } from '@polito/lib/core';

import { DateTime } from 'luxon';

/**
 * When an announcement was posted: "Today, 18:12", "Yesterday, 18:12",
 * "Thu 5 Nov, 09:40", with the year when it is not this year
 */
export const useNoticeWhen = (language: string) => {
  const { t } = useTranslation();
  return useCallback(
    (date: Date) => {
      const at = DateTime.fromJSDate(date, { zone: APP_TIMEZONE }).setLocale(
        language,
      );
      const today = DateTime.now().setZone(APP_TIMEZONE).startOf('day');
      const time = at.toFormat('HH:mm');
      const day = at.startOf('day');
      if (day.equals(today)) return t('course.announcements.today', { time });
      if (day.equals(today.minus({ days: 1 })))
        return t('course.announcements.yesterday', { time });
      return at.toFormat(
        at.year === today.year ? 'ccc d LLL, HH:mm' : 'ccc d LLL yyyy, HH:mm',
      );
    },
    [language, t],
  );
};
