import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import {
  IconButton,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { MenuView } from '@react-native-menu/menu';

export type AgendaView = 'day' | 'week';

interface Props {
  view: AgendaView;
  onChangeView: (view: AgendaView) => void;
  onPickDate: () => void;
  onOpenPreferences: () => void;
}

/**
 * The Day / Week switch and the agenda's menu, at the end of the navy
 * header. They sit in the header in every state of the screen, so they
 * never move.
 */
export const AgendaHeaderControls = ({
  view,
  onChangeView,
  onPickDate,
  onOpenPreferences,
}: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors, fontSizes } = useTheme();
  const options: [AgendaView, string][] = [
    ['day', t('agendaScreen.day')],
    ['week', t('agendaScreen.week')],
  ];
  return (
    <View style={styles.row}>
      <View
        style={styles.track}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('agendaScreen.viewLabel')}
      >
        {options.map(([value, label]) => {
          const selected = view === value;
          return (
            <Pressable
              key={value}
              onPress={() => onChangeView(value)}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={label}
              hitSlop={{ top: 8, bottom: 8 }}
              style={[styles.option, selected && styles.selected]}
            >
              <Text
                variant="label"
                numberOfLines={1}
                style={{
                  color: selected ? colors.header : colors.onHeaderMuted,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <MenuView
        actions={[
          { id: 'date', title: t('agendaScreen.pickDate') },
          { id: 'preferences', title: t('agendaScreen.preferences') },
        ]}
        onPressAction={({ nativeEvent: { event } }) =>
          event === 'date' ? onPickDate() : onOpenPreferences()
        }
      >
        <IconButton
          icon={faEllipsisVertical}
          color={colors.onHeader}
          size={fontSizes.lg}
          accessibilityLabel={t('agendaScreen.options')}
          accessibilityHint={t('agendaScreen.optionsHint')}
        />
      </MenuView>
    </View>
  );
};

const createStyles = ({ colors, shapes, spacing }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    track: {
      flexDirection: 'row',
      padding: spacing[1],
      borderRadius: shapes.lg,
      backgroundColor: colors.headerSunken,
    },
    option: {
      minHeight: 32,
      paddingHorizontal: spacing[3],
      borderRadius: shapes.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      backgroundColor: colors.onHeader,
    },
  });
