import { ReactElement } from 'react';
import { StyleProp, TouchableHighlightProps, ViewStyle } from 'react-native';

import { PersonOverview } from '@polito/student-api-client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { MAX_RECENT_SEARCHES } from '../../../core/constants';
import { usePreferencesContext } from '../../../core/contexts/PreferencesContext';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { ListItem } from '../../../ui/components/ListItem';
import { PersonAvatar } from '../../../ui/components/PersonListItem';
import { PeoplePreferences } from '../types';
import { HighlightedText } from './HighlightedText';

interface Props {
  person: PersonOverview;
  searchString?: string;
  trailingItem?: ReactElement;
  /** The position in the list, read by screen readers */
  index?: number;
  totalData?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * A person in a search result or a recent search: avatar, name and role.
 * Opening it saves the person among the recent searches.
 */
export const PersonOverviewListItem = ({
  person,
  trailingItem,
  searchString,
  index,
  totalData,
  containerStyle,
  ...rest
}: TouchableHighlightProps & Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { accessibilityListLabel } = useAccessibility();
  const { updatePreference, peopleSearched = [] } =
    usePreferencesContext<PeoplePreferences>();
  const subtitle = person.role ?? '';
  const title = [person?.firstName ?? '', person?.lastName ?? '']
    .join(' ')
    .trim();

  const navigateToPerson = () => {
    const others = peopleSearched.filter(p => p.id !== person.id);
    updatePreference(
      'peopleSearched',
      [person, ...others].slice(0, MAX_RECENT_SEARCHES),
    );
    navigation.navigate('Person', { id: person.id });
  };

  return (
    <ListItem
      onPress={navigateToPerson}
      leadingItem={<PersonAvatar person={person} />}
      title={<HighlightedText text={title} highlight={searchString || ''} />}
      accessibilityLabel={[
        index !== undefined && totalData
          ? accessibilityListLabel(index, totalData)
          : undefined,
        title,
        subtitle,
      ]
        .filter(Boolean)
        .join(', ')}
      subtitle={subtitle}
      trailingItem={trailingItem}
      showChevron={!trailingItem}
      containerStyle={containerStyle}
      {...rest}
    />
  );
};
