import { ReactElement } from 'react';
import { Image, StyleSheet, TouchableHighlightProps, View } from 'react-native';

import { Person } from '@polito/api-client';

import { useStylesheet } from '../hooks/useStylesheet';
import { Theme } from '../types/Theme';
import { ListItem } from './ListItem';
import { Text } from './Text';

interface Props {
  person: Person | undefined;
  subtitle?: string | ReactElement;
  navigateEnabled?: boolean;
}

const initialsOf = (person: Person) =>
  [person.firstName, person.lastName]
    .map(name => name?.trim().charAt(0) ?? '')
    .join('')
    .toUpperCase();

/**
 * A person: their picture, or their initials on a round avatar, in the
 * leading column
 */
export const PersonListItem = ({
  person,
  subtitle,
  navigateEnabled = true,
}: TouchableHighlightProps & Props) => {
  const styles = useStylesheet(createStyles);

  return (
    <ListItem
      leadingItem={
        person?.picture ? (
          <Image source={{ uri: person.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.initials]}>
            <Text variant="label" style={styles.initialsText} maxFontSize={20}>
              {person ? initialsOf(person) : ''}
            </Text>
          </View>
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

// The avatar fills the 40 px leading column
const createStyles = ({ colors, controls, shapes }: Theme) =>
  StyleSheet.create({
    avatar: {
      width: controls.leadingSize,
      height: controls.leadingSize,
      borderRadius: shapes.pill,
    },
    initials: {
      backgroundColor: colors.surfaceSunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      color: colors.secondaryText,
    },
  });
