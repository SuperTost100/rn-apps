import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextProps } from 'react-native';

import { isNumber } from 'lodash';

import { usePreferencesContext } from '../../core/contexts/PreferencesContext';
import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Row } from './Row';
import { Text } from './Text';
import { VisuallyHidden } from './VisuallyHidden';

interface Props {
  text?: string | number;
  style?: TextProps['style'];
  variant?: 'outlined' | 'filled';
  isNumeric?: boolean;
}

export const UnreadBadge = ({
  text,
  style,
  variant = 'filled',
  isNumeric = false,
}: Props) => {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const styles = useStylesheet(createStyles);
  const isOutlined = useMemo(() => variant === 'outlined', [variant]);
  const isDigit = isNumber(text);
  const [styless, setStyless] = useState();
  const { accessibility } = usePreferencesContext();

  useEffect(() => {
    const changeStyle = () => {
      setStyless({
        marginTop:
          accessibility?.fontSize && accessibility.fontSize > 125
            ? -spacing[3]
            : 0,
      } as any);
    };
    changeStyle();
  }, [spacing, accessibility]);
  return (
    <Row
      ph={1}
      align="center"
      justify="center"
      flexShrink={0}
      style={[
        styles.badge,
        !text && styles.dotBadge,
        isOutlined && {
          backgroundColor: colors.surface,
          borderColor: isDigit || isNumeric ? colors.badge : colors.accentText,

          borderWidth: 2,
        },
        style,
      ]}
    >
      {text && (
        <Text
          style={[
            styles.badgeText,
            isOutlined && { color: colors.accentText },
            styless,
          ]}
        >
          {text}
          {isDigit && (
            <VisuallyHidden>
              {t('common.newItems', { count: Number(text) })}
            </VisuallyHidden>
          )}
        </Text>
      )}
    </Row>
  );
};

const createStyles = ({ colors, fontSizes, fontWeights, shapes }: Theme) => {
  return StyleSheet.create({
    badge: {
      borderRadius: shapes.xl,
      minWidth: 19,
      minHeight: 19,
      backgroundColor: colors.badge,
    },
    dotBadge: {
      minWidth: 12,
      minHeight: 12,
    },
    badgeText: {
      color: colors.onBadge,
      fontWeight: fontWeights.semibold,
      fontSize: fontSizes.sm,
      textTransform: 'uppercase',
    },
  });
};
