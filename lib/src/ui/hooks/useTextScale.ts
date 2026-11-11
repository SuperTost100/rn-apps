import { useMemo } from 'react';

import { usePreferencesContext } from '../../core/contexts/PreferencesContext';
import { textScaleFromPercent } from '../utils/text-scale';

/**
 * The in-app text size from Settings, for layouts that change with it.
 * Text applies the scale by itself: use this only to switch layouts.
 */
export const useTextScale = () => {
  const { accessibility } = usePreferencesContext();
  const percent = accessibility?.fontSize ?? 100;
  return useMemo(
    () => ({
      /** 100 to 200 */
      percent,
      /** percent / 100 */
      scale: textScaleFromPercent(percent),
      /** 150% and above: layouts move to their large-text form */
      isLarge: percent >= 150,
      /** 200% */
      isLargest: percent >= 200,
    }),
    [percent],
  );
};
