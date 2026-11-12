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

type AvatarPerson = Pick<Person, 'firstName' | 'lastName'> & {
  picture?: string | null;
};

const initialsOf = (person: AvatarPerson) =>
  [person.firstName, person.lastName]
    .map(name => name?.trim().charAt(0) ?? '')
    .join('')
    .toUpperCase();

/**
 * A person's picture, or their initials on a round tile. Decorative: the row
 * or card around it names the person.
 */
export const PersonAvatar = ({
  person,
  size,
}: {
  person: AvatarPerson | undefined;
  /** Default: the 40 px leading column */
  size?: number;
}) => {
  const styles = useStylesheet(createStyles);
  const sized = size ? { width: size, height: size } : undefined;
  return person?.picture ? (
    <Image
      source={{ uri: person.picture }}
      style={[styles.avatar, sized]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  ) : (
    <View
      style={[styles.avatar, styles.initials, sized]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        variant={size && size > 48 ? 'cardTitle' : 'label'}
        style={styles.initialsText}
        maxFontSize={size && size > 48 ? 32 : 20}
      >
        {person ? initialsOf(person) : ''}
      </Text>
    </View>
  );
};

/**
 * A person: their picture, or their initials on a round avatar, in the
 * leading column
 */
export const PersonListItem = ({
  person,
  subtitle,
  navigateEnabled = true,
}: TouchableHighlightProps & Props) => {
  return (
    <ListItem
      leadingItem={<PersonAvatar person={person} />}
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
