import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { useStylesheet } from '../hooks/useStylesheet';
import { Theme } from '../types/Theme';
import { MessageTime } from './MessageTime';

interface Props extends PropsWithChildren<ViewProps> {
  direction?: 'incoming' | 'outgoing';
  time?: Date;
  bubbleStyle?: ViewProps['style'];
}

/**
 * A message in a thread. Incoming ones sit on the surface at the start,
 * outgoing ones on the msgMe role at the end, so the two sides differ by
 * place as well as colour. Text inside uses colors.prose (incoming) or
 * colors.onMsgMe (outgoing).
 */
export const ChatBubble = ({
  direction = 'outgoing',
  time,
  children,
  bubbleStyle,
  ...props
}: Props) => {
  const styles = useStylesheet(createStyles);

  return (
    <View {...props}>
      {time && <MessageTime time={time} right={direction === 'outgoing'} />}
      <View
        style={[
          styles.bubble,
          direction === 'incoming' ? styles.leftBubble : styles.rightBubble,
          bubbleStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const createStyles = ({ colors, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    bubble: {
      paddingHorizontal: layout.cardPadding,
      paddingVertical: spacing[3],
      borderRadius: shapes.lg,
      maxWidth: '85%',
      marginTop: spacing[1],
    },
    rightBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.msgMe,
    },
    leftBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderWidth: colors.cardBorder === 'transparent' ? 0 : 1,
      borderColor: colors.cardBorder,
    },
  });
