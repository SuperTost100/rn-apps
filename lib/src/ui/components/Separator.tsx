import { View } from 'react-native';

import { useTheme } from '../hooks/useTheme';

/** The orange mark above section titles: 32 by 4 */
const MARK_WIDTH = 32;
const MARK_HEIGHT = 4;

/**
 * An aesthetic separator for section titles
 */
export const Separator = () => {
  const { colors, spacing } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: MARK_WIDTH,
        height: MARK_HEIGHT,
        borderRadius: 1,
        marginBottom: spacing[2],
        backgroundColor: colors.accent,
      }}
    />
  );
};
