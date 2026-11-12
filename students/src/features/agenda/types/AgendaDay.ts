import { DateTime } from 'luxon';

import { AgendaItem } from './AgendaItem';

export interface AgendaDay {
  /** The day as yyyy-MM-dd, in Rome */
  key: string;
  date: DateTime;
  items: AgendaItem[];
}
