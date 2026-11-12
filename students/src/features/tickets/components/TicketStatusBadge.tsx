import { useTranslation } from 'react-i18next';

import { StatusChip, StatusChipTone } from '@polito/lib/ui';
import { TicketStatus } from '@polito/student-api-client';

import {
  type TicketStatusGroup,
  getTicketStatusGroup,
} from '~/core/queries/ticketHooks';

const TONES: Record<TicketStatusGroup, StatusChipTone> = {
  open: 'info',
  waitingUser: 'warning',
  resolved: 'success',
  duplicate: 'neutral',
};

export const useTicketStatusLabel = () => {
  const { t } = useTranslation();
  return (status: TicketStatus | string) =>
    t(`tickets.status.${getTicketStatusGroup(status)}`);
};

/** The ticket's state in a word: Open, Waiting for you, Resolved */
export const TicketStatusBadge = ({
  status,
}: {
  status: TicketStatus | string;
}) => {
  const label = useTicketStatusLabel()(status);
  return (
    <StatusChip label={label} tone={TONES[getTicketStatusGroup(status)]} />
  );
};
