import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  OutlineIconButton,
  type Theme,
  resolveFontFace,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { MenuView } from '@react-native-menu/menu';

import { Attachment } from '../../services/types/Attachment';
import {
  AttachmentSource,
  useAttachmentPicker,
} from '../hooks/useAttachmentPicker';
import { AttachmentChip } from './AttachmentChip';

interface Props {
  message: string;
  onMessageChange: (message: string) => void;
  attachment?: Attachment;
  onAttachmentChange: (attachment?: Attachment) => void;
  onSend: () => void;
  /** Offline: the field and both buttons are off, and the field says why */
  offline?: boolean;
}

/** The menu of the attach button: files, the photo library, the camera */
export const AttachMenu = ({
  onPick,
  disabled,
  children,
}: {
  onPick: (source: AttachmentSource) => void;
  disabled?: boolean;
  children: ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <MenuView
      title={t('ticketAttachments.menuTitle')}
      actions={
        disabled
          ? []
          : [
              {
                id: 'file',
                title: t('ticketAttachments.pickFile'),
                subtitle: t('ticketAttachments.pickFileHint'),
                image: 'folder',
              },
              {
                id: 'image',
                title: t('ticketAttachments.pickImage'),
                image: 'photo',
              },
              {
                id: 'camera',
                title: t('ticketAttachments.takePhoto'),
                image: 'camera',
              },
            ]
      }
      onPressAction={({ nativeEvent: { event } }) =>
        onPick(event as AttachmentSource)
      }
    >
      {children}
    </MenuView>
  );
};

/**
 * The reply bar of a ticket thread: attach, the message and send. Send is off
 * while there is nothing to send.
 */
export const TicketReplyBar = ({
  message,
  onMessageChange,
  attachment,
  onAttachmentChange,
  onSend,
  offline = false,
}: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors, fontSizes, fontFamilies } = useTheme();
  const { scale } = useTextScale();
  const pickAttachment = useAttachmentPicker(onAttachmentChange);
  const canSend = !offline && (!!message.trim() || !!attachment);

  return (
    <View style={styles.bar}>
      {!!attachment && (
        <AttachmentChip
          attachment={attachment}
          showSize
          onClearAttachment={() => onAttachmentChange(undefined)}
          style={styles.attachment}
        />
      )}
      <View style={styles.row}>
        <AttachMenu onPick={pickAttachment} disabled={offline}>
          <OutlineIconButton
            icon="clip"
            color={colors.secondaryText}
            disabled={offline}
            accessibilityLabel={t('ticketAttachments.attach')}
          />
        </AttachMenu>
        <TextInput
          value={message}
          onChangeText={onMessageChange}
          editable={!offline}
          multiline
          autoCapitalize="sentences"
          placeholder={
            offline ? t('ticketScreen.replyOffline') : t('ticketScreen.reply')
          }
          placeholderTextColor={colors.secondaryText}
          accessibilityLabel={t('ticketScreen.replyLabel')}
          accessibilityHint={
            offline ? t('ticketScreen.replyOffline') : undefined
          }
          accessibilityState={{ disabled: offline }}
          style={[
            styles.input,
            resolveFontFace(fontFamilies.body, '400', false),
            { fontSize: fontSizes.md * scale },
            offline && styles.inputOffline,
          ]}
        />
        <OutlineIconButton
          icon="send"
          disabled={!canSend}
          accessibilityLabel={t('ticketScreen.send')}
          onPress={onSend}
        />
      </View>
    </View>
  );
};

const createStyles = ({ colors, shapes, spacing }: Theme) =>
  StyleSheet.create({
    bar: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[2],
    },
    attachment: {
      marginHorizontal: spacing[2],
      marginBottom: spacing[2],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing[1],
    },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 160,
      borderRadius: shapes.lg,
      backgroundColor: colors.surfaceSunken,
      color: colors.prose,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
      paddingBottom: spacing[3],
      textAlignVertical: 'center',
    },
    inputOffline: {
      opacity: 0.6,
    },
  });
