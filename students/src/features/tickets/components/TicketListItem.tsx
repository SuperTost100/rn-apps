import { useTranslation } from 'react-i18next';

import { getHtmlTextContent, usePreferencesContext } from '@polito/lib/core';
import { ListItem, type ListItemProps } from '@polito/lib/ui';
import { TicketOverview } from '@polito/student-api-client';

import { AppPreferences } from '~/core/types/preferences';

import { useNoticeWhen } from '../../courses/utils/noticeWhen';
import { TicketStatusBadge, useTicketStatusLabel } from './TicketStatusBadge';

interface TicketListItemProps extends Partial<ListItemProps> {
  ticket: TicketOverview;
}

/**
 * A ticket: the subject on up to two lines, when it was updated and its
 * number, its state, and the unread mark when the office replied
 */
export const TicketListItem = ({
  ticket,
  unread,
  ...props
}: TicketListItemProps) => {
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();
  const when = useNoticeWhen(language);
  const statusLabel = useTicketStatusLabel()(ticket.status);
  const isUnread = !!unread || ticket.unreadCount > 0;
  const subject = getHtmlTextContent(ticket.subject);
  const subtitle = [
    t('ticketsScreen.updated', {
      when: when(ticket.updatedAt),
      interpolation: { escapeValue: false },
    }),
    `#${ticket.id}`,
  ].join(' · ');
  const feedback = ticket.needsFeedback
    ? t('ticketsScreen.rateTheReply')
    : undefined;

  return (
    <ListItem
      {...props}
      linkTo={{ screen: 'Ticket', params: { id: ticket.id } }}
      unread={isUnread}
      title={subject}
      titleProps={{ numberOfLines: 2 }}
      subtitle={feedback ? `${subtitle}\n${feedback}` : subtitle}
      subtitleProps={{ numberOfLines: feedback ? 3 : 2 }}
      chip={<TicketStatusBadge status={ticket.status} />}
      chipLabel={statusLabel}
      showChevron
      accessibilityLabel={[
        isUnread ? t('ticketsScreen.newReply') : undefined,
        subject,
        statusLabel,
        t('ticketsScreen.updated', {
          when: when(ticket.updatedAt),
          interpolation: { escapeValue: false },
        }),
        t('ticketsScreen.ticketNumber', { id: ticket.id }),
        feedback,
      ]
        .filter(Boolean)
        .join(', ')}
    />
  );
};
