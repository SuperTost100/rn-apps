import { StyleSheet, View } from 'react-native';

import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Icon, Theme, useStylesheet, useTheme } from '@polito/lib/ui';

/** The box at the start of a row in selection mode: 24 px, 3:1 edge */
const BOX_SIZE = 24;

interface Props {
  checked: boolean;
  disabled?: boolean;
}

/**
 * The checkbox drawn in a selectable row. The row itself is the checkbox for
 * screen readers, so this is decoration.
 */
export const SelectionBox = ({ checked, disabled = false }: Props) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.box,
        checked && styles.checked,
        disabled && styles.disabled,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {checked && <Icon icon={faCheck} size={14} color={colors.onPrimary} />}
    </View>
  );
};

const createStyles = ({ colors, layout, shapes }: Theme) =>
  StyleSheet.create({
    box: {
      width: BOX_SIZE,
      height: BOX_SIZE,
      borderRadius: shapes.sm,
      borderWidth: 2,
      borderColor: colors.controlBorder,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: layout.leadingGap,
    },
    checked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    disabled: {
      opacity: 0.4,
    },
  });
