import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useStylesheet } from '../hooks/useStylesheet';
import { Theme } from '../types/Theme';
import { Text } from './Text';

export interface KeyValueItem {
  label: string;
  /** Pairs without a value are left out */
  value?: string | number | null;
}

interface Props {
  items: KeyValueItem[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Labels with their values, one under the other, e.g. "Contract" and
 * "Tirocinio". Screen readers read each pair as one element.
 */
export const KeyValueList = ({ items, style }: Props) => {
  const styles = useStylesheet(createStyles);
  const shown = items.filter(
    item =>
      item.value !== undefined && item.value !== null && item.value !== '',
  );
  if (!shown.length) return null;

  return (
    <View style={[styles.list, style]}>
      {shown.map(({ label, value }) => (
        <View
          key={label}
          accessible
          accessibilityLabel={`${label}: ${value}`}
          style={styles.pair}
        >
          <Text variant="secondaryText">{label}</Text>
          <Text variant="title">{String(value)}</Text>
        </View>
      ))}
    </View>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    list: {
      gap: spacing[3],
    },
    pair: {
      gap: spacing[1],
    },
  });
