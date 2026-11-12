import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Card } from './Card';
import { CtaButton } from './CtaButton';
import { Icon } from './Icon';
import { Text } from './Text';

export interface StateBlockAction {
  label: string;
  onPress: () => unknown;
  icon?: IconDefinition;
  /** Filled for the one thing to do next (Try again, New ticket). Default: outlined */
  primary?: boolean;
}

export interface StateBlockProps {
  /**
   * empty: nothing to show yet, with the neutral "nothing here" glyph.
   * error: a load failed, with the alert icon in the danger colour.
   */
  variant?: 'empty' | 'error';
  /** Replaces the variant's glyph */
  icon?: IconDefinition;
  iconColor?: string;
  iconSize?: number;
  /** false hides the glyph */
  showIcon?: boolean;
  title: string;
  text?: string;
  action?: StateBlockAction;
  /** Draws the block inside a card, 8 px from what is above. Default: false */
  card?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Padding around the content, in theme spacing units */
  spacing?: keyof Theme['spacing'];
}

/** The state icon: 40 px, as in the mockup's empty and error blocks */
const STATE_ICON_SIZE = 40;

/** The mockup's neutral "nothing here": a dashed rounded square */
const EmptyGlyph = ({ size, color }: { size: number; color: string }) => {
  const { shapes } = useTheme();
  const inner = Math.round(size * 0.7);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: shapes.md,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: color,
        }}
      />
    </View>
  );
};

/**
 * One block for a failed or empty region: an icon, a title, a line of text
 * and at most one action, centred. Failed blocks are announced as alerts.
 */
export const StateBlock = ({
  variant = 'empty',
  icon,
  iconColor,
  iconSize = STATE_ICON_SIZE,
  showIcon = true,
  title,
  text,
  action,
  card = false,
  style,
  spacing,
}: StateBlockProps) => {
  const { colors, spacing: themeSpacing } = useTheme();
  const styles = useStylesheet(createStyles);
  const isError = variant === 'error';
  const color =
    iconColor ?? (isError ? colors.dangerText : colors.secondaryText);

  const glyph = !showIcon ? null : icon || isError ? (
    <Icon icon={icon ?? faCircleExclamation} color={color} size={iconSize} />
  ) : (
    <EmptyGlyph size={iconSize} color={color} />
  );

  const content = (
    <View
      style={[
        styles.container,
        spacing !== undefined && { padding: themeSpacing[spacing] },
        !card && style,
      ]}
    >
      <View
        accessible={true}
        accessibilityRole={isError ? 'alert' : 'text'}
        accessibilityLabel={[title, text].filter(Boolean).join('. ')}
        style={styles.texts}
      >
        {glyph && <View style={styles.icon}>{glyph}</View>}
        <Text variant="title" weight="semibold" style={styles.centred}>
          {title}
        </Text>
        {text && (
          <Text variant="secondaryText" style={[styles.centred, styles.text]}>
            {text}
          </Text>
        )}
      </View>
      {action && (
        <CtaButton
          absolute={false}
          title={action.label}
          icon={action.icon}
          action={action.onPress}
          variant={action.primary ? 'filled' : 'outlined'}
          containerStyle={styles.action}
        />
      )}
    </View>
  );

  return card ? <Card style={style}>{content}</Card> : content;
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: spacing[8],
      paddingHorizontal: spacing[6],
    },
    texts: {
      alignItems: 'center',
      gap: spacing[2],
    },
    icon: {
      marginBottom: spacing[1],
    },
    centred: {
      textAlign: 'center',
    },
    text: {
      maxWidth: 320,
    },
    action: {
      padding: 0,
      marginTop: spacing[4],
    },
  });
