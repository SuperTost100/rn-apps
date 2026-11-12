import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import {
  ApiError,
  getHtmlTextContent,
  useDebounceValue,
  useFeedbackContext,
  useIsOnline,
  useScreenReader,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  CtaButton,
  InfoMessage,
  Select,
  Text,
  TextButton,
  TextField,
  type Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { MenuAction } from '@react-native-menu/menu';
import { NavigationProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { RootParamList } from '~/core/types/navigation';

import {
  TICKETS_QUERY_KEY,
  useCreateTicket,
  useGetTicketTopics,
  useSearchTicketFaqs,
} from '../../../core/queries/ticketHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { Attachment } from '../../services/types/Attachment';
import { AttachmentChip } from '../components/AttachmentChip';
import { FaqSuggestions } from '../components/FaqSuggestions';
import { AttachMenu } from '../components/TicketReplyBar';
import { useAttachmentPicker } from '../hooks/useAttachmentPicker';

type Props = NativeStackScreenProps<ServiceStackParamList, 'CreateTicket'>;

type Field = 'topic' | 'subtopic' | 'subject' | 'message';
type Errors = Partial<Record<Field, string>>;

/** The code the server answers when the same ticket was already sent */
const DUPLICATE_CODE = -33;

/**
 * The new ticket form. A line on top offers the FAQs, never as a required
 * step, and answers that match the subject appear under it as it is typed.
 * Errors show under each field on send; a failure keeps what was written.
 */
export const CreateTicketScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { setFeedback } = useFeedbackContext();
  const { announce } = useScreenReader();
  const isOnline = useIsOnline();
  const queryClient = useQueryClient();
  const { topicId: initialTopicId, subtopicId: initialSubtopicId } =
    route.params ?? {};
  const topicsQuery = useGetTicketTopics();
  const topics = useMemo(() => topicsQuery.data ?? [], [topicsQuery.data]);

  const [topicId, setTopicId] = useState(initialTopicId?.toString());
  const [subtopicId, setSubtopicId] = useState(initialSubtopicId?.toString());
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<Attachment>();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string>();
  const subjectRef = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);
  const pickAttachment = useAttachmentPicker(setAttachment);
  const { mutateAsync: createTicket, isPending } = useCreateTicket();

  // Matching FAQs, a moment after typing stops
  const searchTerm = useDebounceValue(subject, 400);
  const faqsQuery = useSearchTicketFaqs(searchTerm);
  const faqs = searchTerm.trim().length >= 3 ? (faqsQuery.data ?? []) : [];

  const subtopics = useMemo(
    () => topics.find(tp => tp.id.toString() === topicId)?.subtopics ?? [],
    [topics, topicId],
  );
  const topicOptions = topics.map(tp => ({
    id: tp.id.toString(),
    title: tp.name,
    state: (tp.id.toString() === topicId ? 'on' : 'off') as MenuAction['state'],
  }));
  const subtopicOptions = subtopics.map(st => ({
    id: st.id.toString(),
    title: st.name,
    state: (st.id.toString() === subtopicId
      ? 'on'
      : 'off') as MenuAction['state'],
  }));

  const clearError = (field: Field) =>
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const validate = (): Errors => ({
    topic: topicId ? undefined : t('createTicketScreen.errors.topic'),
    subtopic: subtopicId ? undefined : t('createTicketScreen.errors.subtopic'),
    subject: subject.trim()
      ? undefined
      : t('createTicketScreen.errors.subject'),
    message: message.trim()
      ? undefined
      : t('createTicketScreen.errors.message'),
  });

  /** Lands on the list, with the new ticket marked and a confirmation */
  const showCreated = (id?: number) => {
    setFeedback({
      text: id
        ? t('createTicketScreen.sent', { id })
        : t('createTicketScreen.sentNoId'),
    });
    if (navigation.getState().routeNames.includes('Tickets')) {
      navigation.popTo('Tickets', { newId: id });
      return;
    }
    navigation
      .getParent<NavigationProp<RootParamList>>()
      ?.navigate('ServicesTab', {
        screen: 'Tickets',
        params: { newId: id },
        initial: false,
      });
  };

  const send = async () => {
    const found = validate();
    setErrors(found);
    const firstError = (['topic', 'subtopic', 'subject', 'message'] as const)
      .map(f => found[f])
      .find(Boolean);
    if (firstError) {
      announce(t('createTicketScreen.errors.announce', { first: firstError }));
      if (!found.topic && !found.subtopic) {
        (found.subject ? subjectRef : messageRef).current?.focus();
      }
      return;
    }
    setFailure(undefined);
    const sentAt = Date.now();
    try {
      const created = await createTicket({
        subject: subject.trim(),
        message: message.trim().replace(/\n/g, '<br>'),
        subtopicId: Number(subtopicId),
        attachment: attachment as unknown as Blob,
      });
      showCreated(created?.id);
    } catch (err) {
      if (err instanceof ApiError) {
        const text =
          err.code === DUPLICATE_CODE
            ? t('createTicketScreen.duplicateMessage')
            : err.error
              ? err.error.replace(/([^.!?])\s*$/, '$1.')
              : t('createTicketScreen.failedNoReason');
        setFailure(text);
        announce(`${t('createTicketScreen.failedTitle')}. ${text}`);
        return;
      }
      // No answer came back: the ticket may have been created anyway
      try {
        await queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
      } catch {
        // The check below then finds nothing, and the form says so
      }
      const tickets =
        queryClient.getQueryData<
          { id: number; subject: string; createdAt: Date }[]
        >(TICKETS_QUERY_KEY);
      const arrived = tickets?.find(
        tk =>
          getHtmlTextContent(tk.subject).trim() === subject.trim() &&
          tk.createdAt.getTime() >= sentAt - 5 * 60 * 1000,
      );
      if (arrived) {
        showCreated(arrived.id);
        return;
      }
      setFailure(t('createTicketScreen.failedLost'));
      announce(
        `${t('createTicketScreen.failedTitle')}. ${t('createTicketScreen.failedLost')}`,
      );
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.content}
    >
      {/* A ticket about the app (from App info) comes with its topic: the
          student office FAQs don't cover it */}
      {!initialTopicId && (
        <>
          <InfoMessage style={styles.faqNote}>
            <Text variant="prose" style={styles.faqText}>
              {t('createTicketScreen.faqLine')}
            </Text>
            <TextButton
              onPress={() => navigation.navigate('TicketFaqs')}
              style={styles.faqLink}
            >
              {t('createTicketScreen.readFaqs')}
            </TextButton>
          </InfoMessage>
          <Text variant="secondaryText" style={styles.intro}>
            {t('createTicketScreen.intro')}
          </Text>
        </>
      )}

      <Select
        variant="boxed"
        label={t('createTicketScreen.topicDropdownLabel')}
        placeholder={t('createTicketScreen.chooseTopic')}
        options={topicOptions}
        value={topicId}
        disabled={!!initialTopicId}
        hideChevron={!!initialTopicId}
        error={errors.topic}
        onSelectOption={id => {
          setTopicId(id);
          setSubtopicId(undefined);
          clearError('topic');
        }}
      />
      <Select
        variant="boxed"
        label={t('createTicketScreen.subtopicDropdownLabel')}
        placeholder={
          topicId
            ? t('createTicketScreen.chooseSubtopic')
            : t('createTicketScreen.chooseTopicFirst')
        }
        options={subtopicOptions}
        value={subtopicId}
        disabled={!topicId || !!initialSubtopicId}
        hideChevron={!!initialSubtopicId}
        error={errors.subtopic}
        onSelectOption={id => {
          setSubtopicId(id);
          clearError('subtopic');
        }}
      />
      <TextField
        variant="boxed"
        inputRef={subjectRef}
        label={t('createTicketScreen.subject')}
        placeholder={t('createTicketScreen.subjectPlaceholder')}
        hint={t('createTicketScreen.subjectHint')}
        error={errors.subject}
        autoCapitalize="sentences"
        maxLength={120}
        value={subject}
        onChangeText={text => {
          setSubject(text);
          clearError('subject');
        }}
        returnKeyType="next"
        onSubmitEditing={() => messageRef.current?.focus()}
      />
      <FaqSuggestions
        faqs={faqs}
        onOpen={faq => navigation.navigate('TicketFaq', { faq })}
      />
      <TextField
        variant="boxed"
        inputRef={messageRef}
        label={t('createTicketScreen.message')}
        error={errors.message}
        autoCapitalize="sentences"
        multiline
        numberOfLines={6}
        inputStyle={styles.message}
        value={message}
        onChangeText={text => {
          setMessage(text);
          clearError('message');
        }}
      />
      <View style={styles.attachment}>
        {attachment ? (
          <AttachmentChip
            attachment={attachment}
            showSize
            onClearAttachment={() => setAttachment(undefined)}
          />
        ) : (
          <AttachMenu onPick={pickAttachment}>
            <CtaButton
              absolute={false}
              variant="outlined"
              containerStyle={styles.noPadding}
              title={t('createTicketScreen.attach')}
              hint={undefined}
              icon={faPaperclip}
              accessibilityHint={t('createTicketScreen.attachHint')}
              action={() => {}}
            />
          </AttachMenu>
        )}
      </View>

      {failure && (
        <InfoMessage variant="error" style={styles.failure}>
          <Text variant="secondaryText" weight="semibold" style={styles.error}>
            {t('createTicketScreen.failedTitle')}
          </Text>
          <Text variant="secondaryText" style={styles.error}>
            {failure}
          </Text>
        </InfoMessage>
      )}

      <CtaButton
        absolute={false}
        containerStyle={styles.send}
        disabled={!isOnline}
        loading={isPending}
        title={
          isOnline
            ? t('createTicketScreen.sendTicket')
            : t('createTicketScreen.sendNeedsConnection')
        }
        action={send}
      />
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
    },
    faqNote: {
      marginHorizontal: 0,
    },
    faqText: {
      color: colors.infoText,
    },
    faqLink: {
      alignSelf: 'flex-start',
      marginLeft: -spacing[3],
    },
    intro: {
      marginTop: spacing[4],
      marginBottom: spacing[2],
    },
    message: {
      minHeight: 128,
    },
    attachment: {
      marginTop: spacing[2],
    },
    noPadding: {
      padding: 0,
    },
    failure: {
      marginHorizontal: 0,
      marginTop: spacing[4],
    },
    error: {
      color: colors.dangerText,
    },
    send: {
      paddingHorizontal: 0,
      paddingTop: spacing[6],
    },
  });
