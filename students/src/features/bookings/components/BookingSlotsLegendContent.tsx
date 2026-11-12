import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { StatusChip, Theme, useStylesheet } from '@polito/lib/ui';

import { SlotStatus, slotStatusTones } from '../../../utils/bookings';

interface Props {
  style?: StyleProp<ViewStyle>;
}

/**
 * The slot states as chips with their words, in the colours the grid uses.
 * Shown on the slot screen, so nothing depends on colour alone
 */
export const BookingSlotsLegendContent = ({ style }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const statuses = Object.keys(slotStatusTones) as SlotStatus[];
  const labels = statuses.map(status => t(`bookings.status.${status}`));

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityLabel={`${t('common.legend')}: ${labels.join(', ')}`}
    >
      {statuses.map((status, index) => (
        <StatusChip
          key={status}
          label={labels[index]}
          tone={slotStatusTones[status]}
          style={status === 'concluded' ? styles.past : undefined}
        />
      ))}
    </View>
  );
};

const createStyles = ({ colors, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
    // A past slot has no tint in the grid: the chip shows its outline
    past: {
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
  });
