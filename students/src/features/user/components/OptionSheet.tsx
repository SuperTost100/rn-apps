import { StyleSheet } from 'react-native';

import {
  BottomModal,
  ModalContent,
  RadioGroup,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

interface Props<T> {
  visible: boolean;
  title: string;
  options: { value: T; label: string }[];
  value: T;
  /** Applied at once: the sheet closes after it */
  onPick: (value: T) => void;
  onClose: () => void;
  /** A line under the options that says what the choice does */
  note?: string;
}

/**
 * A setting's choices as a sheet of radio rows: the current one is marked
 * and read as checked, and a tap applies the choice and closes the sheet
 */
export const OptionSheet = <T,>({
  visible,
  title,
  options,
  value,
  onPick,
  onClose,
  note,
}: Props<T>) => {
  const styles = useStylesheet(createStyles);
  return (
    <BottomModal visible={visible} onClose={onClose}>
      <ModalContent title={title} close={onClose}>
        <RadioGroup
          accessibilityLabel={title}
          options={options}
          value={value}
          setValue={picked => {
            onPick(picked);
            onClose();
          }}
        />
        {note && (
          <Text variant="secondaryText" style={styles.note}>
            {note}
          </Text>
        )}
      </ModalContent>
    </BottomModal>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    note: {
      paddingHorizontal: layout.cardPadding,
      paddingTop: spacing[3],
      paddingBottom: spacing[4],
    },
  });
