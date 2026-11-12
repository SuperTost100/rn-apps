import { APP_TIMEZONE } from '@polito/lib/core';
import { OutlineIconName, StatusChipTone, Theme } from '@polito/lib/ui';
import { Booking, BookingTopic } from '@polito/student-api-client';

import { inRange } from 'lodash';
import { DateTime } from 'luxon';

import { BookingCalendarEvent } from '../features/bookings/screens/BookingSlotScreen';

export const MIN_CELL_HEIGHT = 20;

export const isSlotBookable = (item: BookingCalendarEvent) => {
  const bookingStartsAt = DateTime.fromJSDate(item.bookingStartsAt as Date, {
    zone: APP_TIMEZONE,
  }).valueOf();
  const bookingEndsAt = DateTime.fromJSDate(item.bookingEndsAt as Date, {
    zone: APP_TIMEZONE,
  }).valueOf();
  return (
    item.canBeBooked &&
    inRange(
      DateTime.now().setZone(APP_TIMEZONE).valueOf(),
      bookingStartsAt,
      bookingEndsAt,
    )
  );
};

export const isSlotFull = (item: BookingCalendarEvent) => {
  return item.bookedPlaces >= item.places;
};

export const isPastSlot = (item: BookingCalendarEvent) => {
  return DateTime.now().setZone(APP_TIMEZONE) > item.end;
};

export const canBeBookedWithSeatSelection = (slot: BookingCalendarEvent) => {
  return (
    slot.canBeBooked &&
    slot.hasSeatSelection &&
    slot.hasSeats &&
    slot.end > DateTime.now().setZone(APP_TIMEZONE)
  );
};

export type SlotStatus =
  | 'available'
  | 'booked'
  | 'full'
  | 'notAvailable'
  | 'concluded';

/** The state of a slot, as the legend names it */
export const getSlotStatus = (item: BookingCalendarEvent): SlotStatus => {
  const isPast = isPastSlot(item);
  if (item.isBooked && !isPast) return 'booked';
  if (isPast) return 'concluded';
  if (isSlotBookable(item)) return 'available';
  if (isSlotFull(item)) return 'full';
  return 'notAvailable';
};

/** The order of the legend, and the tone of each state */
export const slotStatusTones: Record<SlotStatus, StatusChipTone> = {
  available: 'info',
  booked: 'success',
  full: 'neutral',
  notAvailable: 'warning',
  concluded: 'neutral',
};

/** The colours of a slot in the grid: the tint of its legend chip */
export const getBookingStyle = (
  item: BookingCalendarEvent,
  colors: Theme['colors'],
) => {
  const status = getSlotStatus(item);
  if (status === 'concluded') {
    return { backgroundColor: colors.background, color: colors.secondaryText };
  }
  const tone = slotStatusTones[status];
  const [bg, fg] = {
    info: [colors.infoBg, colors.infoText],
    success: [colors.successBg, colors.successText],
    neutral: [colors.neutralChipBg, colors.neutralChipText],
    warning: [colors.warningBg, colors.warningText],
    danger: [colors.dangerBg, colors.dangerText],
  }[tone];
  return { backgroundColor: bg, color: fg };
};

/**
 * A link rather than a room. The type says so; a location that comes
 * without it counts as a link when it has a URL and no building
 */
export const isVirtualPlace = (location: Booking['location']) =>
  location.type === 'virtualPlace' ||
  (!location.type && 'url' in location && !('buildingId' in location));

/** The glyph of a booking row: a desk, an online meeting, or an office */
export const getBookingIconName = (booking: Booking): OutlineIconName => {
  if (booking.seat) return 'seat';
  if (booking.location && isVirtualPlace(booking.location)) return 'video';
  return 'door';
};

/**
 * The glyph of a topic in the new booking list.
 * shortcut: the API says nothing about the kind of topic, so this reads its
 * words; use a field for it if the API ever adds one
 */
export const getTopicIconName = (
  topic: Pick<BookingTopic, 'title' | 'description'>,
): OutlineIconName => {
  const words = `${topic.title} ${topic.description}`.toLowerCase();
  if (/aul[ae] studio|study room|posti|seat|desk/.test(words)) return 'seat';
  if (/online|video|teams|zoom|remot/.test(words)) return 'video';
  return 'door';
};

export const canBeCancelled = (booking?: Booking) => {
  return (
    !!booking?.cancelableUntil &&
    booking?.cancelableUntil.getTime() > Date.now()
  );
};

export const getCalendarHours = (startHour = 8, endHour = 20) => {
  return Array.from({ length: endHour - startHour }, (_, i) => i + startHour);
};

export const getCalendarPropsFromTopic = (
  topics?: BookingTopic[],
  topicId?: string,
) => {
  const topicIndex = topics?.findIndex(topic => topic.id === topicId);
  if (topicIndex !== undefined && topicIndex > -1 && topics) {
    return topics[topicIndex];
  }
  const topicWithSubtopics = topics?.find(topic =>
    topic.subtopics?.find(subtopic => subtopic.id === topicId),
  );
  const topic = topicWithSubtopics?.subtopics?.find(
    subtopic => subtopic.id === topicId,
  );
  return {
    ...topic,
  };
};

/** "Fri 13 Nov", in the app time zone and language */
export const formatBookingDay = (date: Date | DateTime, language: string) => {
  const day = (
    date instanceof DateTime
      ? date.setZone(APP_TIMEZONE)
      : DateTime.fromJSDate(date, { zone: APP_TIMEZONE })
  )
    .setLocale(language)
    .toFormat('ccc d LLL');
  return day.charAt(0).toUpperCase() + day.slice(1);
};

/** "10:30", in the app time zone */
export const formatBookingTime = (date: Date | DateTime) =>
  (date instanceof DateTime
    ? date.setZone(APP_TIMEZONE)
    : DateTime.fromJSDate(date, { zone: APP_TIMEZONE })
  ).toFormat('HH:mm');
