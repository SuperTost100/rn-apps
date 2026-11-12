import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  ListItem,
  OutlineIcon,
  OutlineIconName,
  Switch,
  Text,
  Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';

interface Props {
  icon: OutlineIconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** The change was just saved: "Saved" shows in place of the subtitle */
  saved?: boolean;
  disabled?: boolean;
  /** Read instead of the title and subtitle, e.g. with the course name */
  accessibilityLabel?: string;
}

/**
 * A settings row with a switch. The whole row is the switch for screen
 * readers. "Saved" takes the subtitle's line for a moment, so the title
 * keeps its width, or sits before the switch on a row without a subtitle,
 * so the row keeps its height; at 150% and above the switch moves under the
 * text, with "Saved" beside it, so a long word never breaks.
 */
export const SettingSwitchRow = ({
  icon,
  title,
  subtitle,
  value,
  onChange,
  saved = false,
  disabled = false,
  accessibilityLabel,
}: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge } = useTextScale();
  const toggle = () => onChange(!value);

  const control = (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={!isLarge && styles.switchSpace}
    >
      <Switch value={value} disabled={disabled} onValueChange={toggle} />
    </View>
  );
  const savedNote = (
    <View style={styles.saved}>
      <OutlineIcon name="check-circle" color={colors.successText} size={16} />
      <Text variant="secondaryText" style={styles.savedText}>
        {t('course.settings.saved')}
      </Text>
    </View>
  );
  const subtitleText = subtitle ? (
    <Text variant="secondaryText">{subtitle}</Text>
  ) : null;
  const savedInSubtitle = saved && !!subtitle && !isLarge;
  const secondLine = savedInSubtitle ? savedNote : subtitleText;
  const trailing =
    saved && !subtitle ? (
      <View style={styles.trailing}>
        {savedNote}
        {control}
      </View>
    ) : (
      control
    );

  return (
    <ListItem
      title={title}
      titleProps={{ numberOfLines: 0 }}
      subtitle={
        isLarge ? (
          <View>
            {subtitleText}
            <View style={styles.largeSwitch}>
              {control}
              {saved && savedNote}
            </View>
          </View>
        ) : (
          (secondLine ?? undefined)
        )
      }
      leadingItem={
        isLarge ? undefined : (
          <OutlineIcon name={icon} color={colors.secondaryText} />
        )
      }
      trailingItem={isLarge ? undefined : trailing}
      onPress={toggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={
        accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')
      }
    />
  );
};

const createStyles = ({ colors, spacing }: Theme) =>
  StyleSheet.create({
    // More room between the label and the switch than between other columns
    switchSpace: {
      marginLeft: spacing[3],
    },
    saved: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },
    savedText: {
      color: colors.successText,
    },
    largeSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      marginTop: spacing[2],
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
  });
