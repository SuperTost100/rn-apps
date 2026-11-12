import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  Col,
  Icon,
  Row,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

type BookingDetailProps = {
  icon: IconProp;
  label: string;
  value?: string;
  emptyText?: string;
};

export const BookingField = ({
  icon,
  label,
  value,
  emptyText,
}: BookingDetailProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  return (
    <Col flex={1} style={styles.container} accessible>
      <Row align="center">
        <Icon icon={icon} color={colors.secondaryText} size={16} />
        <Text variant="secondaryText" style={styles.text}>
          {label}
        </Text>
      </Row>
      <Row mt={0.5}>
        {value ? (
          <Text style={StyleSheet.compose(styles.value, styles.withValue)}>
            {value}
          </Text>
        ) : (
          <Text
            variant="secondaryText"
            style={StyleSheet.compose(styles.empty, styles.value)}
          >
            {emptyText || t('common.noValue')}
          </Text>
        )}
      </Row>
    </Col>
  );
};

const createStyles = ({
  colors,
  fontSizes,
  fontWeights,
  spacing,
  shapes,
}: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      padding: spacing[2],
      borderRadius: shapes.md,
    },
    value: {
      fontSize: fontSizes.sm,
    },
    withValue: {
      fontWeight: fontWeights.medium,
    },
    text: {
      marginLeft: spacing[1],
    },
    empty: {
      color: colors.secondaryText,
    },
  });
