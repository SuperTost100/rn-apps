import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  BottomActionBar,
  CtaButton,
  InfoMessage,
  Text,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { PodiumIcon } from './PodiumIcon';

interface TicketAutoResolvedProps {
  onClose: () => void;
}

const PODIUM_ICON_SIZE = 64;

/** After the virtual assistant's answer solved the question */
export const TicketAutoResolved = ({ onClose }: TicketAutoResolvedProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <PodiumIcon size={PODIUM_ICON_SIZE} color={colors.successText} />
        <Text variant="title" accessibilityRole="header" style={styles.center}>
          {t('ticketResolvedScreen.title')}
        </Text>
        <Text variant="prose" style={styles.center}>
          {t('ticketScreen.autoResolvedSubtitle')}
        </Text>
        <InfoMessage style={styles.hint}>
          <Text variant="secondaryText" style={{ color: colors.infoText }}>
            {t('ticketScreen.autoResolvedHint')}
          </Text>
        </InfoMessage>
      </ScrollView>
      <BottomActionBar>
        <CtaButton
          absolute={false}
          title={t('common.close')}
          action={onClose}
          containerStyle={styles.cta}
        />
      </BottomActionBar>
    </View>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[4],
      paddingHorizontal: layout.gutter,
      paddingVertical: spacing[8],
    },
    center: {
      textAlign: 'center',
    },
    hint: {
      alignSelf: 'stretch',
      marginHorizontal: 0,
    },
    cta: {
      padding: 0,
    },
  });
