import { useTranslation } from 'react-i18next';
import { StyleSheet, View, ViewProps } from 'react-native';

import {
  ActivityIndicator,
  OutlineIcon,
  OutlineIconButton,
  Text,
  type Theme,
  shadeColor,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { wrappableFileName } from '~/utils/files';

import { formatFileSize } from '../../../utils/files';
import { Attachment } from '../../services/types/Attachment';

interface AttachmentChipProps {
  attachment?: Attachment;
  /** Shows a remove button, for an attachment not sent yet */
  onClearAttachment?: () => void;
  loading?: boolean;
  /** On the student's bubble, in the brand colour */
  onBrand?: boolean;
  /** Shows the size: for a file picked on the phone, whose size is in bytes */
  showSize?: boolean;
  style?: ViewProps['style'];
}

/**
 * A file in a message or about to be sent: an icon and the full name, which
 * wraps instead of being cut, so the extension stays visible
 */
export const AttachmentChip = ({
  attachment,
  onClearAttachment,
  loading = false,
  onBrand = false,
  showSize = false,
  style,
}: AttachmentChipProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  if (!attachment) return null;
  const name = attachment.name || t('common.unnamedFile');
  const fg = onBrand ? colors.onMsgMe : colors.title;
  const isImage = attachment.type?.startsWith('image/');
  return (
    <View
      style={[
        styles.chip,
        onBrand ? styles.onBrand : styles.onSurface,
        !!onClearAttachment && styles.withButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <OutlineIcon name={isImage ? 'card' : 'file'} size={20} color={fg} />
      )}
      <View style={styles.text}>
        <Text
          variant="secondaryText"
          weight="semibold"
          numberOfLines={3}
          keepWords
          style={{ color: fg }}
        >
          {wrappableFileName(name)}
        </Text>
        {showSize && !!attachment.size && (
          <Text variant="caption" style={{ color: fg }}>
            {formatFileSize(attachment.size / 1000, 0)}
          </Text>
        )}
      </View>
      {!!onClearAttachment && (
        <OutlineIconButton
          icon="plus"
          color={fg}
          size={20}
          style={styles.remove}
          accessibilityLabel={t('ticketAttachments.remove', { name })}
          onPress={onClearAttachment}
        />
      )}
    </View>
  );
};

const createStyles = ({ colors, shapes, spacing }: Theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      borderRadius: shapes.md,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2.5],
      minHeight: 48,
    },
    withButton: {
      paddingRight: 0,
      paddingVertical: 0,
    },
    onSurface: {
      backgroundColor: colors.surfaceSunken,
    },
    // A darker shade of the student's bubble
    onBrand: {
      backgroundColor: shadeColor(colors.msgMe, -25),
    },
    text: {
      flex: 1,
      minWidth: 0,
    },
    // The plus glyph turned into a cross
    remove: {
      transform: [{ rotate: '45deg' }],
    },
  });
