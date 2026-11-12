import { StyleSheet } from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Col } from './Col';
import { Icon } from './Icon';
import { Text } from './Text';

interface Props {
  icon?: IconDefinition;
  iconColor?: string;
  iconSize?: number;
  message: string;
  caption?: string;
  spacing?: number;
}

/** The state icon: 40 px, as in the mockup's empty and error blocks */
const STATE_ICON_SIZE = 40;

/**
 * "Nothing here": an optional icon, the message as a title and an
 * optional caption, centred
 */
export const EmptyState = ({
  icon,
  iconColor,
  message,
  caption,
  spacing,
  iconSize,
}: Props) => {
  const { colors, spacing: themeSpacing } = useTheme();
  const styles = useStylesheet(createStyles);

  return (
    <Col
      accessibilityRole="text"
      accessible={true}
      accessibilityLabel={[message, caption].filter(Boolean).join('. ')}
      align="center"
      gap={2}
      style={[
        styles.container,
        spacing !== undefined && {
          padding: themeSpacing[spacing as keyof Theme['spacing']],
        },
      ]}
    >
      {icon && (
        <Icon
          icon={icon}
          color={iconColor ?? colors.secondaryText}
          size={iconSize || STATE_ICON_SIZE}
          style={styles.icon}
        />
      )}
      <Text variant="title" weight="semibold" style={styles.centred}>
        {message}
      </Text>
      {caption && (
        <Text variant="secondaryText" style={styles.centred}>
          {caption}
        </Text>
      )}
    </Col>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: spacing[8],
      paddingHorizontal: spacing[6],
    },
    icon: {
      marginBottom: spacing[1],
    },
    centred: {
      textAlign: 'center',
    },
  });
