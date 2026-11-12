import { Text, useTheme } from '@polito/lib/ui';
import { Symbol } from '@polito/student-api-client';

import { symbolTone } from '../utils/symbolTone';

type Props = {
  status: Symbol;
};

/**
 * The career status as a word ("Iscritto"), in the theme colour of its role:
 * the API colour only picks the role, so the word reads in light and dark
 */
export const CareerStatus = ({ status }: Props) => {
  const { colors } = useTheme();
  const color = {
    neutral: colors.secondaryText,
    info: colors.infoText,
    success: colors.successText,
    warning: colors.warningText,
    danger: colors.dangerText,
  }[symbolTone(status)];

  if (!status.label) return null;
  return (
    <Text variant="secondaryText" weight="semibold" style={{ color }}>
      {status.label}
    </Text>
  );
};
