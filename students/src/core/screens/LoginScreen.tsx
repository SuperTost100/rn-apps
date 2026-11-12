import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@polito/lib/features/auth';
import {
  CtaButton,
  Text,
  TextButton,
  TextField,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

import { isTestBuild } from '~/config/testBuild.ts';
import { PolitoLogo } from '~/core/components/Logo.tsx';
import { TestBuildLogo } from '~/core/components/TestBuildLogo.tsx';

/**
 * The username and password form: boxed fields, an error from the server
 * under the password, and a Log in button that says why it is off until
 * both fields are filled
 */
export const LoginScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { bottom } = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [tried, setTried] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const canLogin = username.length > 0 && password.length > 0;
  const { handleBasicLogin, handleSSO, viewChpass, isLoading } = useAuth(
    undefined,
    { onBasicLoginError: setServerError },
  );

  const handleLogin = () => {
    setTried(true);
    if (!canLogin) return;
    setServerError(undefined);
    Keyboard.dismiss();
    handleBasicLogin(username, password);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        // The header above takes the top inset
        { paddingBottom: bottom },
      ]}
    >
      <View style={styles.logo}>
        {isTestBuild ? (
          <TestBuildLogo width="100%" height="100%" />
        ) : (
          <PolitoLogo width="100%" height="100%" />
        )}
      </View>
      <Text variant="cardTitle" role="heading" style={styles.title}>
        {t('loginScreen.title')}
      </Text>
      <TextField
        variant="boxed"
        textContentType="username"
        autoComplete="username"
        label={t('loginScreen.usernameLabel')}
        value={username}
        onChangeText={text => {
          setUsername(text.trim());
          setServerError(undefined);
        }}
        editable={!isLoading}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={tried && !username ? t('auth.enterUsername') : undefined}
      />
      <TextField
        variant="boxed"
        inputRef={passwordRef}
        textContentType="password"
        type="password"
        label={t('loginScreen.passwordLabel')}
        value={password}
        onChangeText={text => {
          setPassword(text);
          setServerError(undefined);
        }}
        secureTextEntry={!passwordVisible}
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        editable={!isLoading}
        error={
          serverError ??
          (tried && !password ? t('auth.enterPassword') : undefined)
        }
      />
      <View style={styles.row}>
        <TextButton
          onPress={() => setPasswordVisible(old => !old)}
          accessibilityState={{ checked: passwordVisible }}
          accessibilityRole="switch"
        >
          {t(
            passwordVisible
              ? 'loginScreen.hidePassword'
              : 'loginScreen.showPassword',
          )}
        </TextButton>
        <TextButton onPress={() => viewChpass()}>
          {t('loginScreen.forgotYourPassword')}
        </TextButton>
      </View>
      <CtaButton
        absolute={false}
        title={t('auth.logIn')}
        action={handleLogin}
        loading={isLoading}
        disabled={!canLogin}
        // Says why the button is off, until both fields are filled
        hint={canLogin ? undefined : t('auth.fillBoth')}
        accessibilityHint={canLogin ? undefined : t('auth.fillBoth')}
        containerStyle={styles.button}
      />
      <TextButton onPress={() => handleSSO()} style={styles.sso}>
        {t('ssoScreen.ssoButton')}
      </TextButton>
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: layout.gutter,
    },
    logo: {
      width: '24%',
      aspectRatio: 120 / 168,
      alignSelf: 'center',
      marginTop: spacing[10],
      marginBottom: spacing[6],
    },
    title: {
      textAlign: 'center',
      marginBottom: spacing[4],
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    button: {
      paddingHorizontal: 0,
    },
    sso: {
      alignSelf: 'center',
      marginBottom: spacing[8],
    },
  });
