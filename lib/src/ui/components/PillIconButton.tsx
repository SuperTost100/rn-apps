import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { PillButton, PillButtonProps } from './PillButton';
import { Row } from './Row';
import { Text } from './Text';

export interface PillIconButtonProps extends PillButtonProps {
  icon?: IconDefinition;
}

/**
 * A filter chip with a 16 px icon before its label
 */
export const PillIconButton = ({
  children,
  icon,
  ...props
}: PillIconButtonProps) => {
  const { colors } = useTheme();
  const filled = props.selected ?? (props.variant ?? 'primary') === 'primary';
  const color = filled ? colors.onSelectedChip : colors.title;
  return (
    <PillButton {...props}>
      <Row align="center" gap={2}>
        {icon && <Icon icon={icon} color={color} size={16} />}
        <Text variant="label" style={{ color }}>
          {children}
        </Text>
      </Row>
    </PillButton>
  );
};
