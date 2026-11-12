import { PixelRatio, Platform } from 'react-native';

import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { Theme } from '../types/Theme';
import { resolveFontFace } from '../utils/font-face';
import { MAX_COMBINED_TEXT_SCALE } from '../utils/text-scale';
import { useTextScale } from './useTextScale';

/**
 * The title of a native header.
 *
 * `legacy` (the default) keeps the styles the faculty app was built with.
 * `inner` is the redesign's inner header title: 20 px bold on both
 * platforms, grown with the in-app text size. The native header applies the
 * phone's font scale on top, so the size is set to keep the product of the
 * two at most 2.0, as Text does.
 */
export const useTitlesStyles = (
  { dark, colors, fontFamilies, fontWeights }: Theme,
  variant: 'legacy' | 'inner' = 'legacy',
): Partial<NativeStackNavigationOptions> => {
  const { scale } = useTextScale();

  if (variant === 'inner') {
    const osScale = PixelRatio.getFontScale();
    const combined = Math.min(scale * osScale, MAX_COMBINED_TEXT_SCALE);
    return {
      headerTitleStyle: {
        // The Bold file itself: a heavier weight on the SemiBold file is
        // drawn as synthetic bold on Android
        fontFamily: resolveFontFace(
          fontFamilies.heading,
          fontWeights.bold,
          false,
        ).fontFamily,
        fontWeight: fontWeights.bold,
        // The native header takes whole numbers only
        fontSize: Math.round((20 * combined) / osScale),
        color: colors.title,
      },
    };
  }

  return {
    headerTitleStyle: {
      fontFamily: fontFamilies.heading,
      fontSize: Platform.select({ android: 20, ios: 17 }),
      fontWeight: fontWeights.semibold,
      color: colors.title,
    },
    headerLargeTitleStyle: {
      fontFamily: fontFamilies.heading,
      fontWeight: fontWeights.bold as string,
      color: colors.title,
    },
    headerBlurEffect: dark
      ? 'systemUltraThinMaterialDark'
      : 'systemUltraThinMaterialLight',
  };
};
