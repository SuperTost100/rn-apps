import { TeachingNavigatorID } from '@polito/lib/core';

/**
 * The Places stack of the tab a screen is in. Lectures and bookings open
 * from the Teaching tab too, which has its own.
 */
export const placesStack = (navigation: { getId(): string | undefined }) =>
  (navigation.getId() === TeachingNavigatorID
    ? 'PlacesTeachingStack'
    : 'PlacesAgendaStack') as 'PlacesAgendaStack';
