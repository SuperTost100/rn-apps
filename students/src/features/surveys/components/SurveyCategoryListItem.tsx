import { useTranslation } from 'react-i18next';

import { ListItem, type ListItemProps, StatusChip } from '@polito/lib/ui';

import { SurveyType } from '../types/SurveyType';

type Props = {
  type: SurveyType;
} & Omit<ListItemProps, 'title'>;

export const SurveyCategoryListItem = ({ type, ...props }: Props) => {
  const { t } = useTranslation();
  const remaining = t('common.remaining', { value: type.incompleteCount });

  return (
    <ListItem
      {...props}
      title={type.name}
      linkTo={{
        screen: 'CpdSurveys',
        params: {
          categoryId: type.categoryId,
          typeId: type.typeId,
          typeName: type.name,
        },
      }}
      // The chip moves under the title at large text instead of squeezing it
      chip={<StatusChip label={remaining} tone="warning" />}
      chipLabel={remaining}
    />
  );
};
