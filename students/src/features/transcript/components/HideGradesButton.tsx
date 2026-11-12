import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableHighlight, View } from 'react-native';

import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { usePreferencesContext } from '@polito/lib/core';
import {
  Icon,
  Text,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { AppPreferences } from '../../../core/types/preferences';

/**
 * Show or Hide in the header of the transcript screens: the same setting as
 * on the Teaching card, so grades are masked everywhere or nowhere
 */
export const HideGradesButton = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { hideGrades, updatePreference } =
    usePreferencesContext<AppPreferences>();

  return (
    <TouchableHighlight
      underlayColor={colors.touchableHighlight}
      onPress={() => updatePreference('hideGrades', !hideGrades)}
      accessibilityRole="button"
      accessibilityLabel={
        hideGrades
          ? t('transcriptGradesScreen.showGrades')
          : t('transcriptGradesScreen.hideGrades')
      }
      style={styles.button}
    >
      <View style={styles.content}>
        <Icon icon={hideGrades ? faEye : faEyeSlash} color={colors.link} />
        <Text variant="label" style={{ color: colors.link }} maxFontSize={24}>
          {hideGrades ? t('common.show') : t('common.hide')}
        </Text>
      </View>
    </TouchableHighlight>
  );
};

/** A grade as shown, or a mask while grades are hidden */
export const useGradeMask = () => {
  const { hideGrades } = usePreferencesContext<AppPreferences>();
  return {
    hidden: !!hideGrades,
    mask: (value: string) => (hideGrades ? '--' : value),
  };
};

const createStyles = ({ controls, shapes, spacing }: Theme) =>
  StyleSheet.create({
    button: {
      minHeight: controls.touchTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing[3],
      marginRight: -spacing[3],
      borderRadius: shapes.md,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
  });
