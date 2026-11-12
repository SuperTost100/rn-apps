import { useTranslation } from 'react-i18next';

import { useOpenInAppLink } from '@polito/lib/core';
import {
  ListItem,
  type ListItemProps,
  OutlineIcon,
  useTheme,
} from '@polito/lib/ui';
import { Survey } from '@polito/student-api-client';

type Props = {
  survey: Survey;
} & Omit<ListItemProps, 'title'>;

/** A survey named by its type: it opens in the browser */
export const SurveyListItemByTypeName = ({ survey, ...props }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const openInAppLink = useOpenInAppLink();
  return (
    <ListItem
      {...props}
      title={survey.type.name}
      onPress={() => openInAppLink(survey.url)}
      accessibilityRole="link"
      accessibilityLabel={t('serviceInfo.opensInBrowser', {
        label: survey.type.name,
      })}
      trailingItem={<OutlineIcon name="ext" color={colors.secondaryText} />}
    />
  );
};
