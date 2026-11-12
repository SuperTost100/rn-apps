import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCircleInfo,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type InfoMessageVariant = 'warning' | 'info' | 'error';

type Props = ViewProps & {
  variant?: InfoMessageVariant;
  icon?: IconDefinition;
};

export const InfoMessage = ({
  children,
  variant = 'info',
  icon,
  style,
  ...rest
}: PropsWithChildren<Props>) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();

  const [backgroundColor, textColor] =
    variant === 'warning'
      ? [colors.warningBg, colors.warningText]
      : variant === 'error'
        ? [colors.dangerBg, colors.dangerText]
        : [colors.infoBg, colors.infoText];

  const defaultIcon =
    variant === 'warning'
      ? faTriangleExclamation
      : variant === 'error'
        ? faTriangleExclamation
        : faCircleInfo;

  return (
    <View
      style={[styles.container, { backgroundColor }, style]}
      accessibilityRole="alert"
      {...rest}
    >
      <View style={styles.iconWrapper}>
        <Icon icon={icon ?? defaultIcon} color={textColor} size={20} />
      </View>
      <View style={styles.body}>
        {typeof children === 'string' ? (
          <Text
            variant="secondaryText"
            style={{ color: textColor }}
            weight="medium"
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

// A tinted note: the tone's background and text, an icon, no border
const createStyles = ({ spacing, shapes }: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderRadius: shapes.lg,
    },
    iconWrapper: {
      alignSelf: 'flex-start',
    },
    body: {
      flex: 1,
    },
  });
