import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { faDownload, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import {
  CtaButton,
  Theme,
  useSafeBottomBarHeight,
  useStylesheet,
} from '@polito/lib/ui';

interface Props {
  /** Selected files that are not on the phone */
  toDownload: number;
  /** Selected files that are on the phone */
  toRemove: number;
  /** Downloading needs a connection */
  isOffline: boolean;
  onDownload: () => void;
  onRemove: () => void;
  /** The bar's height, so the list can end above it */
  onHeight?: (height: number) => void;
}

/**
 * The bar above the tab bar in selection mode. Each button says how many
 * files it acts on; when both labels don't fit one row, the second moves
 * under the first.
 */
export const SelectionActionBar = ({
  toDownload,
  toRemove,
  isOffline,
  onDownload,
  onRemove,
  onHeight,
}: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const bottom = useSafeBottomBarHeight();
  return (
    <View
      style={[styles.bar, { bottom }]}
      onLayout={e => onHeight?.(e.nativeEvent.layout.height)}
      accessibilityRole="toolbar"
      accessibilityLabel={t('course.files.actionsLabel')}
    >
      <CtaButton
        absolute={false}
        icon={faDownload}
        title={t('course.files.downloadSelected', { count: toDownload })}
        action={onDownload}
        disabled={toDownload === 0 || isOffline}
        accessibilityHint={isOffline ? t('states.needsConnection') : undefined}
        containerStyle={styles.button}
      />
      <CtaButton
        absolute={false}
        variant="outlined"
        icon={faTrashCan}
        title={t('course.files.removeSelected', { count: toRemove })}
        action={onRemove}
        disabled={toRemove === 0}
        containerStyle={styles.button}
      />
    </View>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
      paddingHorizontal: layout.gutter,
      paddingVertical: spacing[3],
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    button: {
      padding: 0,
      flexGrow: 1,
      flexShrink: 0,
    },
  });
