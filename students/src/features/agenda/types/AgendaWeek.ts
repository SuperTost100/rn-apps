import { DateTime } from 'luxon';

import { AgendaDay } from './AgendaDay';

export interface AgendaWeek {
  /** The week's Monday as yyyy-MM-dd, in Rome */
  key: string;
  /** Monday at midnight in Rome */
  monday: DateTime;
  /** The days that have items, in order */
  data: AgendaDay[];
}
