import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import {
  ApiError,
  useDeviceLanguage,
  usePreferencesContext,
} from '../../../core';
import { UnsupportedIdentityTypeError } from '../errors/UnsupportedIdentityTypeError';
import {
  useLogin,
  useSSOLoginInitiator,
  useVisitChpass,
} from '../queries/authHooks';

interface UseAuthOptions {
  /**
   * Shows a failed username and password login on the form, with the text
   * to show, instead of an alert
   */
  onBasicLoginError?: (message: string) => void;
}

export const useAuth = (ssoKey?: string, options: UseAuthOptions = {}) => {
  const { onBasicLoginError } = options;
  const { t } = useTranslation();
  const { loginUid } = usePreferencesContext();
  const { mutateAsync: login, isPending: isLoading } = useLogin();
  const language = useDeviceLanguage();
  const handleSSO = useSSOLoginInitiator();
  const viewChpass = useVisitChpass();

  const handleLoginError = useCallback(
    (e: Error) => {
      if (e instanceof UnsupportedIdentityTypeError) {
        Alert.alert(t('common.error'), t('loginScreen.unsupportedUserType'));
      } else {
        console.error(e);
        Alert.alert(
          t('loginScreen.authnError'),
          t('loginScreen.authnErrorDescription'),
        );
      }
    },
    [t],
  );

  const handleBasicLogin = useCallback(
    (username: string, password: string) =>
      login({
        username,
        password,
        preferences: { language },
        loginType: 'basic',
      }).catch((e: Error) => {
        if (!onBasicLoginError) return handleLoginError(e);
        if (e instanceof UnsupportedIdentityTypeError) {
          onBasicLoginError(t('loginScreen.unsupportedUserType'));
        } else if (
          e instanceof ApiError &&
          e.responseCode !== undefined &&
          e.responseCode < 500
        ) {
          onBasicLoginError(t('auth.wrongCredentials'));
        } else {
          console.error(e);
          onBasicLoginError(t('auth.loginFailed'));
        }
      }),
    [login, language, handleLoginError, onBasicLoginError, t],
  );

  useEffect(() => {
    if (loginUid && ssoKey) {
      login({
        uid: loginUid,
        key: ssoKey,
        preferences: { language },
        loginType: 'sso',
      }).catch(handleLoginError);
    }
  }, [loginUid, ssoKey, login, language, handleLoginError]);

  return {
    handleBasicLogin,
    handleSSO,
    viewChpass,
    isLoading,
  };
};
