import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { Row, RowProps } from './Row';

export type DropdownActivatorProps = RowProps & {
  /** Colour of the chevron, e.g. on a selected chip */
  color?: string;
};

/**
 * Content followed by a small chevron, for anything that opens a menu
 */
export const DropdownActivator = ({
  children,
  color,
  ...props
}: DropdownActivatorProps) => {
  const { colors } = useTheme();
  return (
    <Row gap={2} align="center" {...props}>
      {children}
      <Icon
        icon={faChevronDown}
        size={12}
        color={color ?? colors.secondaryText}
      />
    </Row>
  );
};
