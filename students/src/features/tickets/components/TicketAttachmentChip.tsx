import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { open } from 'react-native-file-viewer';

import {
  type Theme,
  ThemeContext,
  darkTheme,
  useStylesheet,
} from '@polito/lib/ui';
import { TicketAttachment } from '@polito/student-api-client';

import {
  useGetTicketAttachment,
  useGetTicketReplyAttachment,
} from '../../../core/queries/ticketHooks';
import { AttachmentChip } from './AttachmentChip';

interface TicketAttachmentChipProps {
  /** On an incoming bubble, which sits on the surface instead of the blue */
  incoming?: boolean;
  attachment: TicketAttachment;
  replyId?: number;
  ticketId: number;
}

export const TicketAttachmentChip = ({
  attachment,
  ticketId,
  replyId,
  incoming = false,
}: TicketAttachmentChipProps) => {
  const styles = useStylesheet(createStyles);
  const [shouldOpen, setShouldOpen] = useState<boolean>(false);
  const isReply = useMemo(() => replyId !== undefined, [replyId]);

  const { isFetching: isDownloadingReplyAttachment, data: replyAttachment } =
    useGetTicketReplyAttachment(
      {
        replyId: replyId ?? 0,
        ticketId,
        attachmentId: attachment.id,
      },
      attachment.filename,
      isReply && shouldOpen,
    );

  const { isFetching: isDownloadingTicketAttachment, data: ticketAttachment } =
    useGetTicketAttachment(
      {
        ticketId,
        attachmentId: attachment.id,
      },
      attachment.filename,
      !isReply && shouldOpen,
    );

  const onPressAttachment = () => setShouldOpen(true);

  useEffect(() => {
    if (!shouldOpen || !ticketAttachment) return;
    open(ticketAttachment);
    setShouldOpen(false);
  }, [shouldOpen, ticketAttachment]);

  useEffect(() => {
    if (!shouldOpen || !replyAttachment) return;
    open(replyAttachment);
    setShouldOpen(false);
  }, [shouldOpen, replyAttachment]);

  const chip = (
    <TouchableOpacity onPress={onPressAttachment} style={styles.container}>
      <AttachmentChip
        attachment={{
          name: attachment.filename,
          size: attachment.sizeInKiloBytes,
          uri: null,
          type: attachment.mimeType,
        }}
        loading={isDownloadingReplyAttachment || isDownloadingTicketAttachment}
      />
    </TouchableOpacity>
  );

  // Outgoing bubbles are blue: the chip takes the dark theme's light text
  return incoming ? (
    chip
  ) : (
    <ThemeContext.Provider value={darkTheme}>{chip}</ThemeContext.Provider>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      maxWidth: '100%',
      marginTop: spacing[4],
    },
  });
