import { usePreferencesContext } from '@polito/lib/core';
import { useTheme } from '@polito/lib/ui';

import { AppPreferences } from '~/core/types/preferences';

import { CourseIcon } from './CourseIcon';

interface Props {
  uniqueShortcode: string;
}

export const CourseIndicator = ({ uniqueShortcode }: Props) => {
  const { colors } = useTheme();
  const prefs = usePreferencesContext<AppPreferences>();
  const coursePrefs = prefs.courses[uniqueShortcode];

  if (!coursePrefs) {
    return <CourseIcon color={colors.primary} />;
  }

  return (
    <CourseIcon
      color={coursePrefs.color}
      icon={coursePrefs.icon}
      isHidden={coursePrefs.isHidden}
    />
  );
};
