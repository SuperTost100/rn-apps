import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { dateFormatter, getHtmlTextContent } from '@polito/lib/core';
import {
  ChatBubble,
  Text,
  TextButton,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { HtmlMessage } from './HtmlMessage';

export type ThreadMessageState = 'sent' | 'pending' | 'failed';

interface Props {
  fromStaff: boolean;
  /** The office or "Virtual assistant"; the student's side says "You" */
  sender: string;
  html: string;
  createdAt: Date;
  attachments?: ReactNode;
  state?: ThreadMessageState;
  onRetry?: () => void;
}

/**
 * One message of a ticket: the office on the surface at the start, the
 * student in the brand colour at the end, with who wrote it, the text, the
 * files and the time. A reply being sent says so, and a failed one offers
 * Try again.
 */
export const ThreadMessage = ({
  fromStaff,
  sender,
  html,
  createdAt,
  attachments,
  state = 'sent',
  onRetry,
}: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const fg = fromStaff ? colors.prose : colors.onMsgMe;
  const muted = fromStaff ? colors.secondaryText : colors.onMsgMe;
  const time = dateFormatter('HH:mm')(createdAt);
  const stateText =
    state === 'pending'
      ? t('ticketScreen.sending')
      : state === 'failed'
        ? t('ticketScreen.notSent')
        : time;
  const label = [
    sender,
    getHtmlTextContent(html),
    state === 'sent' ? t('ticketScreen.sentAt', { time }) : stateText,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      <ChatBubble
        direction={fromStaff ? 'incoming' : 'outgoing'}
        bubbleStyle={[styles.bubble, state === 'pending' && styles.pending]}
      >
        <View accessible accessibilityLabel={label}>
          <Text
            variant="secondaryText"
            weight="semibold"
            style={[styles.sender, { color: fg }]}
          >
            {sender}
          </Text>
          <HtmlMessage
            message={html.trim()}
            baseStyle={{ color: fg, textDecorationColor: fg }}
          />
        </View>
        {attachments}
        <Text
          variant="secondaryText"
          style={[
            styles.time,
            {
              color:
                state === 'failed' && fromStaff ? colors.dangerText : muted,
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {stateText}
        </Text>
      </ChatBubble>
      {state === 'failed' && onRetry && (
        <TextButton
          onPress={onRetry}
          style={styles.retry}
          accessibilityLabel={t('ticketScreen.retrySend')}
        >
          {t('ticketScreen.retrySend')}
        </TextButton>
      )}
    </View>
  );
};

/** The day above the first message of each day */
export const ThreadDay = ({ date }: { date: string }) => {
  const styles = useStylesheet(createStyles);
  return (
    <Text
      variant="secondaryText"
      weight="semibold"
      style={styles.day}
      accessibilityRole="header"
    >
      {date}
    </Text>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: layout.gutter,
    },
    bubble: {
      marginTop: 0,
    },
    pending: {
      opacity: 0.7,
    },
    sender: {
      marginBottom: spacing[1],
    },
    time: {
      alignSelf: 'flex-end',
      marginTop: spacing[2],
    },
    retry: {
      alignSelf: 'flex-end',
    },
    day: {
      textAlign: 'center',
      paddingVertical: spacing[2],
    },
  });
