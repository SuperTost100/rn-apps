import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text, useTheme } from '@polito/lib/ui';

interface Props {
  label: string;
  /** As shown: "26", "30L", "Passed", "--" */
  grade: string;
  hidden: boolean;
}

/** The grade as the page's main figure, out of 30 when it is a number */
export const GradeFigure = ({ label, grade, hidden }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const outOf30 = /^\d+L?$/.test(grade);
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${
        hidden
          ? t('transcriptGradesScreen.gradeHidden')
          : outOf30
            ? `${grade}/30`
            : grade
      }`}
    >
      <Text variant="secondaryText">{label}</Text>
      <Text
        variant="display"
        style={{ color: colors.title, fontVariant: ['tabular-nums'] }}
      >
        {grade}
        {outOf30 && (
          <Text variant="title" weight="semibold">
            /30
          </Text>
        )}
      </Text>
    </View>
  );
};
