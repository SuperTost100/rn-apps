import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { IndentedDivider } from './IndentedDivider';

interface Props {
  index: number;
  count: number;
  /** The rows have a leading column: dividers start at their text */
  indented?: boolean;
}

/**
 * One row of a card drawn by a FlatList or SectionList, for lists too long
 * to render at once: the first row has the card's top corners and the space
 * above a card, the last one its bottom corners and the space below, and a
 * divider runs between rows as in List. In dark mode the hairline border
 * goes round the whole card. Light mode has no shadow here, because a
 * shadow per row would show at every join: a hairline in the divider colour
 * draws the card's edge instead, where a Card has its soft shadow.
 */
export const CardRow = ({
  index,
  count,
  indented = true,
  children,
}: PropsWithChildren<Props>) => {
  const { colors, shapes, layout, controls, spacing } = useTheme();
  const first = index === 0;
  const last = index === count - 1;
  const lightMode = colors.cardBorder === 'transparent';
  const border = StyleSheet.hairlineWidth;
  return (
    <View
      style={{
        marginHorizontal: layout.gutter,
        marginTop: first ? spacing[2] : 0,
        marginBottom: last ? spacing[2] : 0,
        backgroundColor: colors.surface,
        borderColor: lightMode ? colors.divider : colors.cardBorder,
        borderLeftWidth: border,
        borderRightWidth: border,
        borderTopWidth: first ? border : 0,
        borderBottomWidth: last ? border : 0,
        borderTopLeftRadius: first ? shapes.lg : 0,
        borderTopRightRadius: first ? shapes.lg : 0,
        borderBottomLeftRadius: last ? shapes.lg : 0,
        borderBottomRightRadius: last ? shapes.lg : 0,
        overflow: 'hidden',
      }}
    >
      {!first && (
        <IndentedDivider
          indent={
            indented
              ? layout.cardPadding + controls.leadingSize + layout.leadingGap
              : layout.cardPadding
          }
        />
      )}
      {children}
    </View>
  );
};
