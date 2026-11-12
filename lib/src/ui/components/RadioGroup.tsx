import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Option } from '../types/Input';
import { Theme } from '../types/Theme';
import { Col } from './Col';
import { Icon } from './Icon';
import { ListItem } from './ListItem';
import { Row } from './Row';
import { Text } from './Text';

interface Props<T> {
  options: Option<T>[];
  value: T;
  setValue: (value: T) => void;
  showError?: boolean;
  /** Read by screen readers as the name of the group */
  accessibilityLabel?: string;
}

/** The radio circle: 24 px, a 2 px edge, a 10 px dot when selected */
const RADIO_SIZE = 24;
const DOT_SIZE = 10;

/**
 * Rows with a radio at the end. Each row is a radio for screen readers,
 * with its checked state.
 */
export const RadioGroup = <T,>({
  options,
  value,
  setValue,
  showError,
  accessibilityLabel,
}: Props<T>) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const hasError = !!showError && value === undefined;

  return (
    <Col accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((radioDefinition, index) => {
        const isSelected = radioDefinition.value === value;

        return (
          <ListItem
            key={index}
            onPress={() => setValue(radioDefinition.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={radioDefinition.label}
            titleProps={{ numberOfLines: 0 }}
            trailingItem={
              <View
                style={[
                  styles.radio,
                  isSelected && styles.radioSelected,
                  hasError && styles.radioError,
                ]}
              >
                {isSelected && <View style={styles.radioSelectedInner} />}
              </View>
            }
            title={radioDefinition.label}
          />
        );
      })}
      {hasError && (
        <Row align="center" gap={1} style={styles.groupErrorFeedback}>
          <Icon
            icon={faCircleExclamation}
            size={14}
            color={colors.dangerText}
          />
          <Text variant="secondaryText" style={{ color: colors.dangerText }}>
            {t('common.selectAnOption')}
          </Text>
        </Row>
      )}
    </Col>
  );
};

const createStyles = ({ colors, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    radio: {
      width: RADIO_SIZE,
      height: RADIO_SIZE,
      borderRadius: shapes.pill,
      backgroundColor: colors.surface,
      borderColor: colors.controlBorder,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioSelectedInner: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: shapes.pill,
      backgroundColor: colors.primary,
    },
    radioError: {
      borderColor: colors.dangerText,
    },
    groupErrorFeedback: {
      paddingHorizontal: layout.cardPadding,
      paddingTop: spacing[3],
    },
  });
