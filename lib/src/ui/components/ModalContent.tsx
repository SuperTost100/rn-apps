import { PropsWithChildren, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = {
  title: string;
  close: () => void;
  scrollViewRef?: any;
  setScrollOffset?: (value: number) => void;
};

/** The grab handle at the top of a sheet */
const GRAB_WIDTH = 36;
const GRAB_HEIGHT = 4;

/**
 * The content of a BottomModal: a grab handle, the title with a close
 * button, and a scrolling body that ends above the home indicator
 */
export const ModalContent = ({
  children,
  close,
  title,
  scrollViewRef,
  setScrollOffset,
}: PropsWithChildren<Props>) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  const handleOnScroll = useCallback(
    (event: any) => {
      if (setScrollOffset) {
        setScrollOffset(event.nativeEvent.contentOffset.y);
      }
    },
    [setScrollOffset],
  );

  return (
    <View style={styles.container}>
      <View style={styles.grab} />
      <View style={styles.header}>
        <Text
          variant="cardTitle"
          accessibilityRole="header"
          style={styles.title}
        >
          {title}
        </Text>
        <IconButton
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
          icon={faTimes}
          size={20}
          color={colors.secondaryText}
          onPress={close}
        />
      </View>
      <ScrollView
        onScroll={handleOnScroll}
        scrollEventThrottle={120}
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: bottom }}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const createStyles = ({ colors, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderTopRightRadius: shapes.xl,
      borderTopLeftRadius: shapes.xl,
      maxHeight: '100%',
      paddingTop: spacing[2],
      paddingBottom: spacing[2],
    },
    grab: {
      alignSelf: 'center',
      width: GRAB_WIDTH,
      height: GRAB_HEIGHT,
      borderRadius: GRAB_HEIGHT / 2,
      backgroundColor: colors.controlBorder,
      marginBottom: spacing[1],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      paddingLeft: layout.gutter,
      paddingRight: spacing[1],
    },
    title: {
      flex: 1,
      color: colors.title,
    },
  });
