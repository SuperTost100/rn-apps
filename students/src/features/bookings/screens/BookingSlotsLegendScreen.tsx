import { ScrollView } from 'react-native';

import { useTheme } from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { BookingSlotsLegendContent } from '../components/BookingSlotsLegendContent';

type Props = NativeStackScreenProps<
  ServiceStackParamList,
  'BookingSlotsLegend'
>;

export const BookingSlotsLegendScreen = (_: Props) => {
  const { layout } = useTheme();
  return (
    <ScrollView>
      <BookingSlotsLegendContent style={{ padding: layout.gutter }} />
    </ScrollView>
  );
};
