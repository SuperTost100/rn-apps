import {
  ActivityIndicatorProps,
  ActivityIndicator as RNActivityIndicator,
} from 'react-native';

import { useTheme } from '../hooks/useTheme';

/**
 * The platform spinner in the secondary text colour, which keeps 3:1 on the
 * page and on cards in both themes
 */
export const ActivityIndicator = (props: ActivityIndicatorProps) => {
  const { colors } = useTheme();

  return <RNActivityIndicator color={colors.secondaryText} {...props} />;
};
