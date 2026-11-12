import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { PillButton, PillButtonProps } from './PillButton';
import { Row } from './Row';
import { Text } from './Text';

/** 14 px at 150% */
export const CHIP_MAX_FONT = 21;

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
        {/* Over the map the chips stop growing at 150%, so the row keeps a
            few in view; a long label still fits and the row scrolls */}
        <Text variant="label" style={{ color }} maxFontSize={CHIP_MAX_FONT}>
          {children}
        </Text>
      </Row>
    </PillButton>
  );
};
