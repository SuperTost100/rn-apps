import { View } from 'react-native';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';

/**
 * The chevron that ends a row which opens something. Decorative: the row
 * itself is the button.
 */
/** The mockup's chevron box: its stroke ends on the row's trailing edge */
const CHEVRON_BOX = 20;

export const DisclosureIndicator = () => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        width: CHEVRON_BOX,
        height: CHEVRON_BOX,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Icon icon={faChevronRight} size={14} color={colors.secondaryText} />
    </View>
  );
};
