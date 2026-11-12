import { useTheme } from '@polito/lib/ui';
import { Symbol } from '@polito/student-api-client';

export const useSymbolColor = (symbol?: Symbol) => {
  const { dark, colors } = useTheme();

  if (!symbol?.color) {
    return colors.secondaryText;
  }

  return dark ? symbol.color.dark : symbol.color.light;
};
