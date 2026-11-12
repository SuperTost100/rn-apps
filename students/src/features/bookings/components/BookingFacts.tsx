import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Text, Theme, useStylesheet } from '@polito/lib/ui';

export interface BookingFact {
  label: string;
  value: string;
}

interface Props {
  facts: BookingFact[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Labels and values, one under the other: What, When, Where. Each pair is
 * read as one item by screen readers
 */
export const BookingFacts = ({ facts, style }: Props) => {
  const styles = useStylesheet(createStyles);
  return (
    <View style={[styles.container, style]}>
      {facts.map(fact => (
        <View
          key={fact.label}
          accessible
          accessibilityLabel={`${fact.label}: ${fact.value}`}
        >
          <Text variant="secondaryText">{fact.label}</Text>
          <Text variant="prose" style={styles.value}>
            {fact.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing[3],
    },
    value: {
      fontVariant: ['tabular-nums'],
    },
  });
