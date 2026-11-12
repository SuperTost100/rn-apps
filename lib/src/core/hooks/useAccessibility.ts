import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useAccessibility = () => {
  const { t } = useTranslation();

  const accessibilityListLabel = useCallback(
    (index: number, total: number, extraText?: string) => {
      const text = t('common.elementCount', {
        count: index + 1,
        total: total,
      });
      // Callers join it with the row's text: no trailing full stop then
      return extraText ? `${text}. ${extraText}` : text;
    },
    [t],
  );

  return {
    accessibilityListLabel,
  };
};
