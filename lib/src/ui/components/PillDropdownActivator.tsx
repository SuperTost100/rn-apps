import { useTheme } from '../hooks/useTheme';
import { DropdownActivator } from './DropdownActivator';
import { PillButton, PillButtonProps } from './PillButton';
import { Text } from './Text';

export type PillDropdownActivatorProps = PillButtonProps;

/**
 * A filter chip that opens a menu
 */
export const PillDropdownActivator = ({
  children,
  ...props
}: PillDropdownActivatorProps) => {
  const { colors } = useTheme();
  const filled = props.selected ?? (props.variant ?? 'primary') === 'primary';
  const color = filled ? colors.onSelectedChip : colors.title;
  return (
    <PillButton {...props}>
      <DropdownActivator color={color}>
        {typeof children === 'string' ? (
          <Text variant="label" style={{ color }}>
            {children}
          </Text>
        ) : (
          children
        )}
      </DropdownActivator>
    </PillButton>
  );
};
