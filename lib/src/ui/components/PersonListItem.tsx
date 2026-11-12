import { ReactElement } from 'react';
import { Image, StyleSheet, TouchableHighlightProps } from 'react-native';

import { faUser } from '@fortawesome/free-regular-svg-icons';
import { Person } from '@polito/api-client';

import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { ListItem } from './ListItem';

interface Props {
  person: Person | undefined;
  subtitle?: string | ReactElement;
  navigateEnabled?: boolean;
}

export const PersonListItem = ({
  person,
  subtitle,
  navigateEnabled = true,
}: TouchableHighlightProps & Props) => {
  const { fontSizes } = useTheme();

  return (
    <ListItem
      leadingItem={
        person?.picture ? (
          <Image source={{ uri: person.picture }} style={styles.picture} />
        ) : (
          <Icon icon={faUser} size={fontSizes['2xl']} />
        )
      }
      title={person ? `${person.firstName} ${person.lastName}` : ''}
      accessibilityLabel={
        person
          ? [
              typeof subtitle === 'string' && subtitle ? `${subtitle}:` : '',
              person.firstName,
              person.lastName,
            ]
              .filter(Boolean)
              .join(' ')
          : undefined
      }
      linkTo={
        person?.id && navigateEnabled
          ? {
              screen: 'Person',
              params: { id: person.id },
            }
          : undefined
      }
      subtitle={subtitle}
    />
  );
};

// The leading column is 40 px: the picture fills it
const styles = StyleSheet.create({
  picture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
