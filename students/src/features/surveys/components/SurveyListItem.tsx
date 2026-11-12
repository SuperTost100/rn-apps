import { useTranslation } from 'react-i18next';

import { useOpenInAppLink } from '@polito/lib/core';
import {
  ListItem,
  type ListItemProps,
  OutlineIcon,
  StatusChip,
  useTheme,
} from '@polito/lib/ui';
import { Survey } from '@polito/student-api-client';

type Props = {
  survey: Survey;
  /** Shows "To fill in" or "Done" in words */
  showStatus?: boolean;
} & Omit<ListItemProps, 'title'>;

/** A survey: it opens in the browser, which the icon and the label say */
export const SurveyListItem = ({
  survey,
  showStatus = false,
  accessibilityLabel,
  ...props
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const openInAppLink = useOpenInAppLink();
  const status = survey.isCompiled
    ? t('serviceInfo.surveys.done')
    : t('serviceInfo.surveys.toFillIn');
  const label = [
    accessibilityLabel,
    survey.title,
    survey.subtitle,
    showStatus ? status : undefined,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <ListItem
      {...props}
      title={survey.title}
      subtitle={survey.subtitle ?? undefined}
      onPress={() => openInAppLink(survey.url)}
      accessibilityRole="link"
      accessibilityLabel={t('serviceInfo.opensInBrowser', { label })}
      chip={
        showStatus ? (
          <StatusChip
            label={status}
            tone={survey.isCompiled ? 'success' : 'warning'}
          />
        ) : undefined
      }
      trailingItem={<OutlineIcon name="ext" color={colors.secondaryText} />}
    />
  );
};
