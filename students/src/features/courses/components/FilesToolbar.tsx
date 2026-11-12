import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableHighlight, View } from 'react-native';

import {
  OutlineIcon,
  Text,
  TextButton,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { FileSortOrder } from '../utils/fileTree';

export type FilesView = 'folders' | 'all';

interface Props {
  /** The Folders / All files switch; left out inside a folder */
  view?: FilesView;
  onChangeView?: (view: FilesView) => void;
  sort: FileSortOrder;
  onPressSort: () => void;
  onPressSelect: () => void;
  /** Nothing to select or sort: the list is loading or empty */
  disabled?: boolean;
}

/**
 * One row above the files: the view switch on the left, the sort control
 * (showing the current order) and Select at the right edge. The labels are
 * the chip size, so the row fits a 360 dp phone in both languages; at large
 * text the right group moves under the switch as one piece.
 */
export const FilesToolbar = ({
  view,
  onChangeView,
  sort,
  onPressSort,
  onPressSelect,
  disabled = false,
}: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const linkColor = disabled ? colors.secondaryText : colors.link;

  return (
    <View style={styles.row}>
      {view && onChangeView ? (
        <View
          style={styles.segments}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('course.files.viewLabel')}
        >
          {(['folders', 'all'] as const).map(v => {
            const active = v === view;
            return (
              <TouchableHighlight
                key={v}
                underlayColor={colors.touchableHighlight}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => onChangeView(v)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <Text
                  variant="chip"
                  numberOfLines={1}
                  style={active ? styles.segmentTextActive : styles.segmentText}
                >
                  {v === 'folders'
                    ? t('course.files.viewFolders')
                    : t('course.files.viewAll')}
                </Text>
              </TouchableHighlight>
            );
          })}
        </View>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.end}>
        <TextButton
          onPress={onPressSort}
          disabled={disabled}
          accessibilityLabel={t('course.files.sortLabel', {
            order: t(`course.files.sort.${sort}`),
          })}
          accessibilityHint={t('course.files.sortHint')}
          style={styles.button}
        >
          <View style={styles.buttonContent}>
            <OutlineIcon name="sort" color={linkColor} size={18} />
            <Text variant="chip" numberOfLines={1} style={{ color: linkColor }}>
              {t(`course.files.sortShort.${sort}`)}
            </Text>
          </View>
        </TextButton>
        <TextButton
          onPress={onPressSelect}
          disabled={disabled}
          accessibilityHint={t('course.files.selectHint')}
          style={[styles.button, styles.lastButton]}
        >
          <Text variant="chip" numberOfLines={1} style={{ color: linkColor }}>
            {t('course.files.select')}
          </Text>
        </TextButton>
      </View>
    </View>
  );
};

const createStyles = ({ colors, controls, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      rowGap: spacing[1],
      columnGap: spacing[1.5],
      paddingHorizontal: layout.gutter,
      marginTop: spacing[3],
    },
    spacer: {
      flexGrow: 1,
    },
    segments: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: shapes.md,
      backgroundColor: colors.surfaceSunken,
    },
    segment: {
      minHeight: controls.touchTarget - 6,
      justifyContent: 'center',
      paddingHorizontal: spacing[2],
      borderRadius: shapes.sm,
    },
    segmentActive: {
      backgroundColor: colors.surface,
    },
    segmentText: {
      color: colors.secondaryText,
    },
    segmentTextActive: {
      color: colors.title,
    },
    end: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    button: {
      paddingHorizontal: spacing[1.5],
      marginRight: 0,
    },
    // The last label ends on the gutter; its target reaches past it
    lastButton: {
      paddingRight: spacing[3],
      marginRight: -spacing[3],
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },
  });
