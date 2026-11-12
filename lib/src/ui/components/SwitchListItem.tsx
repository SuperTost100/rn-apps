import { ListItem, ListItemProps } from './ListItem';
import { Switch } from './Switch';

interface Props extends ListItemProps {
  title: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
}

/**
 * A row with a switch. The whole row toggles and is one switch for screen
 * readers, with its checked state; the switch itself is hidden from them.
 */
export const SwitchListItem = ({
  title,
  value,
  onChange,
  disabled,
  subtitle,
  accessibilityLabel,
  ...rest
}: Props) => {
  const toggle = () => onChange?.(!value);
  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value, disabled: !!disabled }}
      accessibilityLabel={
        accessibilityLabel ??
        [title, typeof subtitle === 'string' ? subtitle : undefined]
          .filter(Boolean)
          .join(', ')
      }
      trailingItem={
        <Switch
          value={value ?? false}
          disabled={disabled}
          onValueChange={toggle}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      }
      disabled={disabled}
      {...rest}
    />
  );
};
