import { pluckData, rethrowApiError } from '@polito/lib/core';
import {
  CreateTicketRequest,
  GetTicketAttachmentRequest,
  GetTicketReplyAttachmentRequest,
  ReplyToTicketRequest,
  TicketFeedbackRequest,
  TicketStatus,
  TicketsApi,
} from '@polito/student-api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withNativeDownloader } from '../storage/apiDownload';

export const TICKETS_QUERY_KEY = ['tickets'];
export const TICKET_QUERY_PREFIX = 'ticket';

export const LEGACY_CLOSED_TICKET_STATUS = 'closed' as const;

export const CONCLUDED_TICKET_STATUSES = [
  TicketStatus.Resolved,
  TicketStatus.Autoresolved,
  TicketStatus.Duplicate,
] as const satisfies readonly TicketStatus[];

export const isConcludedTicketStatus = (status?: TicketStatus | string) =>
  (CONCLUDED_TICKET_STATUSES as readonly string[]).includes(status ?? '') ||
  status === LEGACY_CLOSED_TICKET_STATUS;

export const isResolvedTicketStatus = (status?: TicketStatus | string) =>
  status === TicketStatus.Resolved || status === LEGACY_CLOSED_TICKET_STATUS;

export type TicketStatusGroup =
  | 'open'
  | 'resolved'
  | 'duplicate'
  | 'waitingUser';

export const getTicketStatusGroup = (
  status?: TicketStatus | string,
): TicketStatusGroup => {
  if (isResolvedTicketStatus(status) || status === TicketStatus.Autoresolved) {
    return 'resolved';
  }
  if (status === TicketStatus.Duplicate) {
    return 'duplicate';
  }
  if (status === TicketStatus.WaitingUser) {
    return 'waitingUser';
  }
  return 'open';
};

const TICKETS_ATTACHMENTS_PREFIX = 'attachments';
const TOPICS_QUERY_KEY = ['topics'];
const FAQS_QUERY_KEY = ['faqs'];

const useTicketsClient = (): TicketsApi => {
  return new TicketsApi();
};

export const useGetTickets = () => {
  const ticketsClient = useTicketsClient();

  return useQuery({
    queryKey: TICKETS_QUERY_KEY,
    queryFn: () => ticketsClient.getTickets().then(pluckData),
  });
};

export const useCreateTicket = () => {
  const client = useQueryClient();
  const ticketsClient = useTicketsClient();

  return useMutation({
    mutationFn: async (dto: CreateTicketRequest) => {
      try {
        const res = await ticketsClient.createTicket(dto);
        return pluckData(res);
      } catch (err) {
        await rethrowApiError(err as Error);
      }
    },
    // The form says what went wrong, so the app-wide alert stays quiet
    onError() {},
    onSuccess() {
      return client.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
};

export const useReplyToTicket = (ticketId: number) => {
  const client = useQueryClient();
  const ticketsClient = useTicketsClient();
  const invalidatesQueries = [
    TICKETS_QUERY_KEY,
    [TICKET_QUERY_PREFIX, ticketId],
  ];

  return useMutation({
    mutationFn: (dto: ReplyToTicketRequest) => {
      return ticketsClient.replyToTicket(dto);
    },
    // The thread marks a failed reply and offers Try again
    onError() {},
    onSuccess() {
      return invalidatesQueries.forEach(queryKey =>
        client.invalidateQueries({ queryKey }),
      );
    },
  });
};

export const useGiveTicketReplyFeedback = (
  ticketId: number,
  replyId: number,
) => {
  const client = useQueryClient();
  const ticketsClient = useTicketsClient();

  return useMutation({
    mutationFn: (positive: boolean) =>
      ticketsClient.setTicketReplyFeedback({ ticketId, replyId, positive }),
    onSuccess(_data, positive) {
      if (positive) {
        client.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
      }
      client.invalidateQueries({
        queryKey: [TICKET_QUERY_PREFIX, ticketId],
      });
    },
  });
};

export const useProvideTicketFeedback = (ticketId: number) => {
  const client = useQueryClient();
  const ticketsClient = useTicketsClient();
  const invalidatesQueries = [
    TICKETS_QUERY_KEY,
    [TICKET_QUERY_PREFIX, ticketId],
  ];

  return useMutation({
    mutationFn: (ticketFeedbackRequest: TicketFeedbackRequest) =>
      ticketsClient.provideTicketFeedback({
        ticketId,
        ticketFeedbackRequest,
      }),
    // The rating screen says when it fails
    onError() {},
    onSuccess() {
      return invalidatesQueries.forEach(queryKey =>
        client.invalidateQueries({ queryKey }),
      );
    },
  });
};

export const useGetTicket = (ticketId: number) => {
  const ticketsClient = useTicketsClient();

  return useQuery({
    queryKey: [TICKET_QUERY_PREFIX, ticketId],
    queryFn: () => ticketsClient.getTicket({ ticketId }).then(pluckData),
    staleTime: 0,
  });
};

export const useMarkTicketAsClosed = (ticketId: number) => {
  const ticketsClient = useTicketsClient();
  const client = useQueryClient();
  const invalidatesQueries = [
    TICKETS_QUERY_KEY,
    [TICKET_QUERY_PREFIX, ticketId],
  ];

  return useMutation({
    mutationFn: () => ticketsClient.markTicketAsClosed({ ticketId }),
    // The thread says when it fails
    onError() {},
    onSuccess() {
      return invalidatesQueries.forEach(queryKey =>
        client.invalidateQueries({ queryKey }),
      );
    },
  });
};

export const useGetTicketTopics = () => {
  const ticketsClient = useTicketsClient();

  return useQuery({
    queryKey: TOPICS_QUERY_KEY,
    queryFn: () => ticketsClient.getTicketTopics().then(pluckData),
  });
};

export const useGetTicketReplyAttachment = (
  { ticketId, replyId, attachmentId }: GetTicketReplyAttachmentRequest,
  fileName: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: [TICKETS_ATTACHMENTS_PREFIX, ticketId, replyId, attachmentId],
    queryFn: () =>
      withNativeDownloader(
        TicketsApi,
        c => c.getTicketReplyAttachment({ ticketId, replyId, attachmentId }),
        fileName,
      ),
    enabled,
  });
};

export const useGetTicketAttachment = (
  { ticketId, attachmentId }: GetTicketAttachmentRequest,
  fileName: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: [TICKETS_ATTACHMENTS_PREFIX, ticketId, attachmentId],
    queryFn: () =>
      withNativeDownloader(
        TicketsApi,
        c => c.getTicketAttachment({ ticketId, attachmentId }),
        fileName,
      ),
    enabled,
  });
};

/**
 * The FAQs matching a search of three characters or more. Empty searches
 * fetch nothing
 */
export const useSearchTicketFaqs = (search: string) => {
  const ticketsClient = useTicketsClient();
  const term = search.trim();

  return useQuery({
    queryKey: [...FAQS_QUERY_KEY, term],
    queryFn: () =>
      ticketsClient.searchTicketFAQs({ search: term }).then(pluckData),
    enabled: term.length >= 3,
    staleTime: 5 * 60 * 1000,
    // Suggestions are not worth keeping between app launches
    persister: undefined,
  });
};
