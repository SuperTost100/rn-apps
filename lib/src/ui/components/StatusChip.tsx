import { ViewProps } from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useTheme } from '../hooks/useTheme';
import { Colors } from '../types/Theme';
import { Badge } from './Badge';

export type StatusChipTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

const toneColors: Record<StatusChipTone, [keyof Colors, keyof Colors]> = {
  neutral: ['neutralChipBg', 'neutralChipText'],
  info: ['infoBg', 'infoText'],
  success: ['successBg', 'successText'],
  warning: ['warningBg', 'warningText'],
  danger: ['dangerBg', 'dangerText'],
};

type Props = ViewProps & {
  /** The state in words: the colour only repeats it */
  label: string;
  tone?: StatusChipTone;
  icon?: IconDefinition;
};

/**
 * A state such as Booked, Open or Closed: a word, with an optional icon, on
 * the tone's tint. Never colour alone.
 */
export const StatusChip = ({
  label,
  tone = 'neutral',
  icon,
  ...rest
}: Props) => {
  const { colors } = useTheme();
  const [bg, fg] = toneColors[tone];
  return (
    <Badge
      text={label}
      icon={icon}
      backgroundColor={colors[bg]}
      foregroundColor={colors[fg]}
      accessibilityLabel={label}
      {...rest}
    />
  );
};
