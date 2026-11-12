import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { faBell } from '@fortawesome/free-regular-svg-icons';
import { useQuietQueryErrors } from '@polito/lib/core';
import { IconButton, UnreadBadge, useTheme } from '@polito/lib/ui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useInbox } from '../../../core/hooks/useInbox';
import { TeachingStackParamList } from './TeachingNavigator';

interface Props {
  /** The header's foreground colour */
  color?: string;
}

/**
 * The bell on the Teaching header, with the inbox's unread count: the same
 * number as the Teaching tab's badge. It opens the inbox.
 */
export const InboxBell = ({ color }: Props) => {
  const { t } = useTranslation();
  const { controls } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeachingStackParamList>>();
  const { counts, notificationsQuery, messagesQuery, ticketsQuery } =
    useInbox();
  // A count that fails to load shows no badge, without an alert
  useQuietQueryErrors([notificationsQuery, messagesQuery, ticketsQuery]);
  const unread = counts.all;

  return (
    <View>
      <IconButton
        icon={faBell}
        color={color}
        size={controls.iconSize}
        adjustSpacing="right"
        accessibilityLabel={
          unread
            ? t('inboxScreen.bellLabelUnread', { count: unread })
            : t('inboxScreen.bellLabel')
        }
        onPress={() => navigation.navigate('Inbox')}
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
  // Anchored by its bottom edge just below the top of the bell, so a badge
  // that grows with the text size grows upwards, over the handle only, and
  // stays inside the screen on the right
  badge: {
    position: 'absolute',
    right: -4,
    bottom: '62%',
  },
});
