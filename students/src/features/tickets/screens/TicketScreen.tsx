import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';

import {
  APP_TIMEZONE,
  getHtmlTextContent,
  useFeedbackContext,
  useIsOnline,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import { useScreenReader } from '@polito/lib/core';
import {
  Card,
  GlobalStyles,
  Metric,
  OutlineIconButton,
  QueryStateView,
  RefreshControl,
  SkeletonDetail,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import {
  TicketAttachment,
  TicketSpecialAgent,
  TicketStatus,
} from '@polito/student-api-client';
import { MenuView } from '@react-native-menu/menu';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import { useMarkAsRead } from '../../../core/hooks/useMarkAsRead';
import { useNotifications } from '../../../core/hooks/useNotifications';
import {
  isResolvedTicketStatus,
  useGetTicket,
  useMarkTicketAsClosed,
  useReplyToTicket,
} from '../../../core/queries/ticketHooks';
import { describeMutationFailure } from '../../../utils/mutationFailure';
import { useNoticeWhen } from '../../courses/utils/noticeWhen';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { Attachment } from '../../services/types/Attachment';
import { AttachmentChip } from '../components/AttachmentChip';
import {
  ThreadDay,
  ThreadMessage,
  ThreadMessageState,
} from '../components/ThreadMessage';
import { TicketAttachmentChip } from '../components/TicketAttachmentChip';
import { TicketAutoresolvedBar } from '../components/TicketAutoresolvedBar';
import { TicketDuplicateBar } from '../components/TicketDuplicateBar';
import { TicketFeedbackInfo } from '../components/TicketFeedbackInfo';
import { TicketRateBar } from '../components/TicketRateBar';
import { TicketReplyBar } from '../components/TicketReplyBar';
import { TicketStatusBadge } from '../components/TicketStatusBadge';
import { TicketWaitingOperatorBar } from '../components/TicketWaitingOperatorBar';
import { VirtualOperatorFeedbackBar } from '../components/VirtualOperatorFeedbackBar';

type Props = NativeStackScreenProps<ServiceStackParamList, 'Ticket'>;

/** A reply written here, shown at once until the server's copy arrives */
interface LocalReply {
  key: string;
  message: string;
  attachment?: Attachment;
  createdAt: Date;
  state: ThreadMessageState;
}

type ThreadEntry =
  | { kind: 'day'; key: string; label: string }
  | {
      kind: 'message';
      key: string;
      fromStaff: boolean;
      sender: string;
      html: string;
      createdAt: Date;
      attachments?: TicketAttachment[];
      replyId?: number;
      local?: LocalReply;
    };

/** The text the server stores for a reply, as the app sends it */
const toHtml = (message: string) => message.trim().replace(/\n/g, '<br>');
const plain = (html: string) =>
  getHtmlTextContent(html).replace(/\s+/g, ' ').trim();

export const TicketScreen = ({ route, navigation }: Props) => {
  const { id } = route.params;
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { language } = usePreferencesContext<AppPreferences>();
  const when = useNoticeWhen(language);
  const { setFeedback } = useFeedbackContext();
  const { announce } = useScreenReader();
  const isOnline = useIsOnline();
  const ticketQuery = useGetTicket(id);
  const states = useQueryStates(ticketQuery);
  const markAsRead = useMarkAsRead();
  const { mutateAsync: markTicketAsClosed } = useMarkTicketAsClosed(id);
  const { mutateAsync: reply } = useReplyToTicket(id);
  const bottomBarHeight = useBottomTabBarHeight();
  const ticket = ticketQuery.data;
  const refetchTicket = ticketQuery.refetch;
  const { clearNotificationScope } = useNotifications();

  const [draft, setDraft] = useState('');
  const [draftAttachment, setDraftAttachment] = useState<Attachment>();
  const [localReplies, setLocalReplies] = useState<LocalReply[]>([]);
  const listRef = useRef<FlatList<ThreadEntry>>(null);

  // Runs again whenever the notifications refresh; useMarkAsRead sends each
  // read call once, so a server that still reports the notification unread
  // no longer gets the same call again on every refresh
  const ticketId = ticket?.id;
  const ticketUnread = !!ticket?.unreadCount;
  useEffect(() => {
    if (ticketId === undefined) return;
    clearNotificationScope(['services', 'tickets', ticketId.toString()]);
    if (ticketUnread) markAsRead.ticket(ticketId);
  }, [markAsRead, clearNotificationScope, ticketId, ticketUnread]);

  const isAutoResolved = ticket?.status === TicketStatus.Autoresolved;
  const isDuplicate = ticket?.status === TicketStatus.Duplicate;
  const isResolved = isResolvedTicketStatus(ticket?.status);
  const feedback = ticket?.providedFeedback;
  const feedbackInserted =
    !!ticket && (isResolved || isAutoResolved) && !!feedback;

  const replyNeedingFeedback = useMemo(
    () =>
      [...(ticket?.replies ?? [])]
        .filter(r => r.needsFeedback === true)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0],
    [ticket?.replies],
  );
  const showVirtualOperatorFeedback =
    !!ticket &&
    !isAutoResolved &&
    !isDuplicate &&
    !isResolved &&
    !feedbackInserted &&
    replyNeedingFeedback != null;
  const showResolvedRateBar =
    isResolved && !feedbackInserted && ticket?.needsFeedback === true;
  const showAutoresolvedRateBar =
    isAutoResolved && !feedbackInserted && ticket?.needsFeedback === true;
  const isWaitingForOperator =
    !!ticket &&
    !isAutoResolved &&
    !isDuplicate &&
    !isResolved &&
    !feedbackInserted &&
    !showVirtualOperatorFeedback &&
    ticket.status === TicketStatus.Pending &&
    (ticket.replies ?? []).some(r => r.isFromAgent);
  const isMessagingDisabled =
    (isResolved && !showResolvedRateBar) ||
    (isAutoResolved && !showAutoresolvedRateBar) ||
    isDuplicate ||
    feedbackInserted ||
    isWaitingForOperator ||
    showVirtualOperatorFeedback;
  const canMarkResolved =
    !!ticket &&
    !isResolved &&
    !isAutoResolved &&
    !isDuplicate &&
    !isWaitingForOperator &&
    !showVirtualOperatorFeedback;

  // ---- sending replies: shown at once, then confirmed or failed
  const isSentByServer = useCallback(
    (local: LocalReply) => {
      const text = plain(toHtml(local.message));
      // The server's clock may differ: a few minutes of tolerance
      const since = local.createdAt.getTime() - 5 * 60 * 1000;
      return (ticket?.replies ?? []).some(
        r =>
          !r.isFromAgent &&
          r.createdAt.getTime() >= since &&
          plain(r.message) === text,
      );
    },
    [ticket?.replies],
  );

  const setLocalState = (key: string, state: ThreadMessageState) =>
    setLocalReplies(list =>
      list.map(r => (r.key === key ? { ...r, state } : r)),
    );

  const send = async (local: LocalReply) => {
    setLocalState(local.key, 'pending');
    try {
      await reply({
        ticketId: id,
        message: toHtml(local.message),
        attachment: local.attachment as unknown as Blob,
      });
      setLocalState(local.key, 'sent');
      announce(t('ticketScreen.replySent'));
      refetchTicket();
    } catch (e) {
      const failure = await describeMutationFailure(e);
      if (failure.lost) {
        // No answer came back: the reply may be there anyway
        const { data } = await refetchTicket();
        const text = plain(toHtml(local.message));
        const since = local.createdAt.getTime() - 5 * 60 * 1000;
        const arrived = (data?.replies ?? []).some(
          r =>
            !r.isFromAgent &&
            r.createdAt.getTime() >= since &&
            plain(r.message) === text,
        );
        if (arrived) {
          setLocalState(local.key, 'sent');
          announce(t('ticketScreen.replySent'));
          return;
        }
      }
      setLocalState(local.key, 'failed');
      announce(t('ticketScreen.replyFailed'));
    }
  };

  const onSend = () => {
    if (!draft.trim() && !draftAttachment) return;
    const local: LocalReply = {
      key: `local-${Date.now()}`,
      message: draft,
      attachment: draftAttachment,
      createdAt: new Date(),
      state: 'pending',
    };
    setLocalReplies(list => [...list, local]);
    // The list is inverted: offset 0 is the newest message
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setDraft('');
    setDraftAttachment(undefined);
    send(local);
  };

  // Local replies leave once the server's copy is in the thread
  const visibleLocal = useMemo(
    () => localReplies.filter(r => r.state !== 'sent' || !isSentByServer(r)),
    [localReplies, isSentByServer],
  );

  // ---- new messages from the office are announced, politely
  const staffCount = (ticket?.replies ?? []).filter(r => r.isFromAgent).length;
  const lastStaffCount = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (ticket === undefined) return;
    if (
      lastStaffCount.current !== undefined &&
      staffCount > lastStaffCount.current
    ) {
      announce(t('ticketScreen.newReplyAnnounce'));
    }
    lastStaffCount.current = staffCount;
  }, [staffCount, ticket, announce, t]);

  // ---- mark as resolved, from the header menu
  const markResolved = useCallback(() => {
    Alert.alert(
      t('ticketScreen.resolveConfirmTitle'),
      t('ticketScreen.resolveConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('ticketScreen.markAsResolved'),
          onPress: async () => {
            try {
              await markTicketAsClosed();
            } catch {
              setFeedback({
                text: t('ticketScreen.resolveFailed'),
                isError: true,
              });
              return;
            }
            setFeedback({ text: t('ticketScreen.resolved') });
            const { data: closed } = await refetchTicket();
            if (closed?.needsFeedback) {
              navigation.navigate('TicketResolved', {
                ticketId: id,
                markAsResolved: true,
              });
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [t, markTicketAsClosed, setFeedback, refetchTicket, navigation, id]);

  const subject = ticket ? getHtmlTextContent(ticket.subject) : '';
  const headerRight = useCallback(
    () =>
      ticket ? (
        <MenuView
          title={t('ticketScreen.menuTitle', { id: ticket.id })}
          actions={[
            {
              id: 'resolve',
              title: t('ticketScreen.markAsResolved'),
              subtitle: canMarkResolved
                ? t('ticketScreen.markAsResolvedHint')
                : t('ticketScreen.cannotResolveHint'),
              image: 'checkmark.circle',
              attributes: { disabled: !canMarkResolved || !isOnline },
            },
            {
              id: 'details',
              title: t('ticketScreen.infoModalTitle'),
              image: 'info.circle',
            },
          ]}
          onPressAction={({ nativeEvent: { event } }) => {
            if (event === 'resolve') markResolved();
            if (event === 'details') navigation.navigate('TicketInfo', { id });
          }}
        >
          <OutlineIconButton
            icon="more"
            color={colors.title}
            accessibilityLabel={t('ticketScreen.actions')}
            accessibilityHint={t('ticketScreen.actionsHint')}
          />
        </MenuView>
      ) : null,
    [
      ticket,
      canMarkResolved,
      isOnline,
      markResolved,
      navigation,
      id,
      colors.title,
      t,
    ],
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: subject || t('ticketScreen.title'),
      headerRight,
    });
  }, [navigation, subject, headerRight, t]);

  // ---- the thread: the question, the replies, then the local ones, by day
  const entries = useMemo((): ThreadEntry[] => {
    if (!ticket) return [];
    const you = t('ticketScreen.you');
    const messages: Extract<ThreadEntry, { kind: 'message' }>[] = [
      {
        kind: 'message',
        key: 'question',
        fromStaff: false,
        sender: you,
        html: ticket.message,
        createdAt: ticket.createdAt,
        attachments: ticket.attachments,
      },
      ...[...(ticket.replies ?? [])]
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(r => ({
          kind: 'message' as const,
          key: `reply-${r.id}`,
          fromStaff: r.isFromAgent,
          // The API names no person: the office, or the virtual assistant
          sender: !r.isFromAgent
            ? you
            : r.agentId === TicketSpecialAgent.AiAgent
              ? t('ticketScreen.virtualAssistant')
              : t('ticketScreen.studentOffice'),
          html: r.message ?? '',
          createdAt: r.createdAt,
          attachments: r.attachments,
          replyId: r.id,
        })),
      ...visibleLocal.map(l => ({
        kind: 'message' as const,
        key: l.key,
        fromStaff: false,
        sender: you,
        html: toHtml(l.message),
        createdAt: l.createdAt,
        local: l,
      })),
    ];
    const out: ThreadEntry[] = [];
    let lastDay = '';
    for (const m of messages) {
      const day = DateTime.fromJSDate(m.createdAt, { zone: APP_TIMEZONE })
        .setLocale(language)
        .toFormat('ccc d LLL yyyy');
      if (day !== lastDay) {
        out.push({ kind: 'day', key: `day-${m.key}`, label: day });
        lastDay = day;
      }
      out.push(m);
    }
    // The list is inverted, so it opens on the newest message
    return out.reverse();
  }, [ticket, visibleLocal, language, t]);

  const keyboard = useAnimatedKeyboard();
  const animatedBottomPadding = useAnimatedStyle(() => ({
    paddingBottom: Math.max(keyboard.height.value, bottomBarHeight),
  }));

  if (states.status !== 'ready' || !ticket) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <QueryStateView
          states={states}
          skeleton={
            <SkeletonDetail
              title={false}
              cards={[72, 140, 96]}
              label={t('states.tickets.loadingOne')}
            />
          }
          errorState={{
            title: t('states.tickets.failedOneTitle'),
            text: t('states.tickets.failedText'),
          }}
        >
          {null}
        </QueryStateView>
      </ScrollView>
    );
  }

  const statusCard = (
    <View style={styles.statusCard}>
      <Card padded style={styles.statusCardInner}>
        <View style={styles.metrics}>
          <Metric
            title={t('common.status')}
            value={<TicketStatusBadge status={ticket.status} />}
          />
          <Metric
            title={t('ticketScreen.ticket')}
            value={`#${ticket.id}`}
            accessibilityLabel={t('ticketsScreen.ticketNumber', {
              id: ticket.id,
            })}
          />
          <Metric
            title={t('ticketScreen.updated')}
            value={when(ticket.updatedAt)}
          />
        </View>
      </Card>
    </View>
  );

  return (
    <Animated.View style={[GlobalStyles.grow, animatedBottomPadding]}>
      <FlatList
        ref={listRef}
        style={GlobalStyles.grow}
        inverted
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.thread}
        refreshControl={<RefreshControl queries={[ticketQuery]} />}
        data={entries}
        keyExtractor={item => item.key}
        ListFooterComponent={statusCard}
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <ThreadDay date={item.label} />
          ) : (
            <ThreadMessage
              fromStaff={item.fromStaff}
              sender={item.sender}
              html={item.html}
              createdAt={item.createdAt}
              state={item.local?.state}
              onRetry={
                item.local ? () => send(item.local as LocalReply) : undefined
              }
              attachments={
                item.local?.attachment ? (
                  <AttachmentChip
                    attachment={item.local.attachment}
                    onBrand
                    style={styles.localAttachment}
                  />
                ) : (
                  item.attachments?.map(a => (
                    <TicketAttachmentChip
                      key={a.id}
                      attachment={a}
                      ticketId={ticket.id}
                      replyId={item.replyId}
                      onBrand={!item.fromStaff}
                    />
                  ))
                )
              }
            />
          )
        }
      />
      {isDuplicate ? (
        <TicketDuplicateBar
          onPress={() =>
            ticket.duplicateId != null &&
            navigation.push('Ticket', { id: ticket.duplicateId })
          }
        />
      ) : feedbackInserted && feedback ? (
        <TicketFeedbackInfo
          rating={feedback.rating}
          createdAt={feedback.createdAt}
        />
      ) : showVirtualOperatorFeedback ? (
        <VirtualOperatorFeedbackBar
          ticketId={id}
          replyId={replyNeedingFeedback!.id}
          onAccepted={() =>
            navigation.replace('TicketAutoResolved', { ticketId: id })
          }
        />
      ) : isWaitingForOperator ? (
        <TicketWaitingOperatorBar />
      ) : showAutoresolvedRateBar ? (
        <TicketAutoresolvedBar
          onPress={() =>
            navigation.navigate('TicketResolved', { ticketId: id })
          }
        />
      ) : showResolvedRateBar ? (
        <TicketRateBar
          onPress={() =>
            navigation.navigate('TicketResolved', { ticketId: id })
          }
        />
      ) : isMessagingDisabled ? null : (
        <TicketReplyBar
          message={draft}
          onMessageChange={setDraft}
          attachment={draftAttachment}
          onAttachmentChange={setDraftAttachment}
          onSend={onSend}
          offline={!isOnline}
        />
      )}
    </Animated.View>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    // Inverted: flex-end keeps a short thread under the header
    thread: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      paddingBottom: spacing[4],
      gap: spacing[3],
    },
    statusCard: {
      paddingTop: spacing[2],
      paddingBottom: spacing[2],
    },
    statusCardInner: {
      marginBottom: 0,
    },
    metrics: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: spacing[6],
      rowGap: spacing[3],
    },
    localAttachment: {
      marginTop: spacing[3],
    },
  });
