import { useMemo } from 'react';
import { View } from 'react-native';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { ListItem } from './ListItem';
import { StatefulMenuView } from './StatefulMenuView';

interface DropdownOption {
  id: string;
  title: string;
  image?: string;
  imageColor?: string;
  state?: 'off' | 'on' | 'mixed' | undefined;
}

interface Props {
  options: DropdownOption[];
  onSelectOption?: (id: string) => void;
  value?: string;
  label: string;
  description?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  hideChevron?: boolean;
}

export const Select = ({
  options,
  accessibilityLabel,
  onSelectOption,
  value,
  label,
  description,
  disabled,
  hideChevron,
}: Props) => {
  const { colors } = useTheme();
  const displayedValue = useMemo(() => {
    return options?.find(opt => opt?.id === value)?.title;
  }, [options, value]);

  // One element for screen readers: the row, named by the label and the
  // chosen value. The menu opens from it.
  const name = accessibilityLabel || label;
  return (
    <View>
      <StatefulMenuView
        style={{ width: '100%' }}
        title={label}
        actions={!disabled ? options : []}
        onPressAction={({ nativeEvent: { event } }) => {
          !disabled && onSelectOption?.(event);
        }}
      >
        <ListItem
          isAction
          disabled={disabled}
          title={displayedValue || label}
          subtitle={description}
          accessibilityRole="button"
          accessibilityLabel={
            displayedValue ? `${name}: ${displayedValue}` : name
          }
          accessibilityHint={description || undefined}
          trailingItem={
            hideChevron ? (
              <View />
            ) : (
              <Icon
                icon={faChevronDown}
                size={14}
                color={colors.secondaryText}
              />
            )
          }
        />
      </StatefulMenuView>
    </View>
  );
};
