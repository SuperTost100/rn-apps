import { useTranslation } from 'react-i18next';

import { useFeedbackContext } from '@polito/lib/core';
import { ListItem, OutlineIconButton } from '@polito/lib/ui';
import { GuideField } from '@polito/student-api-client';
import Clipboard from '@react-native-clipboard/clipboard';

type Props = {
  field: GuideField;
};

/**
 * A setting to copy: the value as the title, so it wraps on its own column,
 * its label under it, and a copy button when the guide allows copying
 */
export const GuideFieldListItem = ({ field }: Props) => {
  const { t } = useTranslation();
  const { setFeedback } = useFeedbackContext();
  const copyToClipboard = () => {
    Clipboard.setString(field.value);
    setFeedback({
      text: t('serviceInfo.guides.copied', { value: field.value }),
    });
  };

  return (
    <ListItem
      title={field.value}
      multilineTitle
      subtitle={field.label}
      // With a copy button the row lets screen readers reach it: the value,
      // the label and the button are read one by one
      accessible={!field.isCopyEnabled}
      accessibilityLabel={`${field.label}: ${field.value}`}
      trailingItem={
        field.isCopyEnabled ? (
          <OutlineIconButton
            icon="copy"
            onPress={copyToClipboard}
            accessibilityLabel={t('serviceInfo.guides.copy', {
              label: field.label,
            })}
          />
        ) : undefined
      }
    />
  );
};
