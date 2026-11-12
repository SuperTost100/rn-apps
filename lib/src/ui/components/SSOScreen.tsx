import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStylesheet } from '../hooks/useStylesheet';
import { Theme } from '../types/Theme';
import { CtaButton } from './CtaButton';
import { Text } from './Text';
import { TextButton } from './TextButton';

type SSOScreenProps = {
  logo: ReactNode;
  isLoading?: boolean;
  /** The student just logged out: the screen says what that removed */
  loggedOut?: boolean;
  onLoginPress: () => void;
  onSsoPress: () => void;
};

/**
 * The login landing: the university mark, then Single Sign-On as the main
 * button and the username and password form as a text button under it.
 * After a logout it says that the login and the authenticator key are gone.
 */
export const SSOScreen = ({
  logo,
  isLoading,
  loggedOut = false,
  onLoginPress,
  onSsoPress,
}: SSOScreenProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { top, bottom } = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: top, paddingBottom: bottom },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.logo}>{logo}</View>
        {loggedOut && (
          <View style={styles.notice} accessible>
            <Text variant="cardTitle" role="heading" style={styles.center}>
              {t('auth.loggedOutTitle')}
            </Text>
            <Text variant="secondaryText" style={styles.center}>
              {t('auth.loggedOutText')}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <CtaButton
          absolute={false}
          title={t('ssoScreen.ssoButton')}
          action={onSsoPress}
          loading={isLoading}
          containerStyle={styles.button}
        />
        <TextButton onPress={onLoginPress} style={styles.link}>
          {t('ssoScreen.ssoLink')}
        </TextButton>
      </View>
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
      paddingHorizontal: layout.gutter,
    },
    top: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing[8],
      gap: spacing[8],
    },
    logo: {
      width: '30%',
      aspectRatio: 120 / 168,
    },
    notice: {
      gap: spacing[2],
      maxWidth: 360,
    },
    center: {
      textAlign: 'center',
    },
    actions: {
      paddingBottom: spacing[8],
      gap: spacing[2],
    },
    button: {
      paddingHorizontal: 0,
    },
    link: {
      alignSelf: 'center',
    },
  });
