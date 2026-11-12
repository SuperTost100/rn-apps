import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePreferencesContext } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  OverviewList,
  SectionHeader,
  SwitchListItem,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

import { AppPreferences } from '~/core/types/preferences';

type SpacingKey = 'lineHeight' | 'paragraphSpacing' | 'wordSpacing';
const SPACING_KEYS: SpacingKey[] = [
  'lineHeight',
  'paragraphSpacing',
  'wordSpacing',
];

/**
 * Spacing for long texts (announcements, guides): line height, paragraph
 * and word spacing, with a sample that shows the result. The text size is
 * in Settings.
 */
export const AccessibilitySettingsScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { accessibility, updatePreference } =
    usePreferencesContext<AppPreferences>();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={styles.first}>
        <OverviewList>
          {SPACING_KEYS.map(key => (
            <SwitchListItem
              key={key}
              title={t(`accessibilitySettingsScreen.${key}Title`)}
              subtitle={t(`accessibilitySettingsScreen.${key}Subtitle`)}
              value={accessibility?.[key] ?? false}
              onChange={value => {
                updatePreference('accessibility', {
                  ...accessibility,
                  [key]: value,
                });
              }}
            />
          ))}
        </OverviewList>
      </View>
      <View style={styles.section}>
        <SectionHeader title={t('accessibilitySettingsScreen.exampleText')} />
        <Card padded>
          <Text variant="longProse">
            {t('accessibilitySettingsScreen.sampleFirst')}
          </Text>
          <Text variant="longProse" style={styles.paragraph}>
            {t('accessibilitySettingsScreen.sampleSecond')}
          </Text>
        </Card>
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    first: {
      marginTop: spacing[4],
    },
    section: {
      marginTop: layout.sectionGap,
    },
    paragraph: {
      marginTop: spacing[3],
    },
  });
