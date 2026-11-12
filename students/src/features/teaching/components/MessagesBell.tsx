import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { faBell } from '@fortawesome/free-regular-svg-icons';
import { useQuietQueryErrors } from '@polito/lib/core';
import { IconButton, UnreadBadge, useTheme } from '@polito/lib/ui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useGetMessages } from '../../../core/queries/studentHooks';
import { filterUnread } from '../../../utils/messages';
import { TeachingStackParamList } from './TeachingNavigator';

interface Props {
  /** The header's foreground colour */
  color?: string;
}

/**
 * The bell on the Teaching header, with the number of unread messages.
 * It opens the messages until the inbox replaces them.
 */
export const MessagesBell = ({ color }: Props) => {
  const { t } = useTranslation();
  const { controls } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeachingStackParamList>>();
  const messagesQuery = useGetMessages();
  // A count that fails to load shows no badge, without an alert
  useQuietQueryErrors(messagesQuery);
  const unread = filterUnread(messagesQuery.data ?? []).length;

  return (
    <View>
      <IconButton
        icon={faBell}
        color={color}
        size={controls.iconSize}
        adjustSpacing="right"
        accessibilityLabel={
          unread
            ? t('teachingScreen.bellLabelUnread', { count: unread })
            : t('teachingScreen.bellLabel')
        }
        onPress={() => navigation.navigate('Messages')}
      />
      {unread > 0 && (
        <View pointerEvents="none" style={styles.badge}>
          <UnreadBadge text={unread} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Over the bell's top right corner, clear of the glyph's centre
  badge: {
    position: 'absolute',
    top: 0,
    right: -6,
  },
});
