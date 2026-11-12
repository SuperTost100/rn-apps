import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { hasLoggedOutThisSession, useAuth } from '@polito/lib/features/auth';
import { SSOScreen as SharedSSOScreen } from '@polito/lib/ui';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { isTestBuild } from '~/config/testBuild.ts';
import { GuestStackParamList } from '~/core/components/GuestNavigator.tsx';
import { PolitoLogo } from '~/core/components/Logo.tsx';
import { TestBuildLogo } from '~/core/components/TestBuildLogo.tsx';

type Props = NativeStackScreenProps<GuestStackParamList, 'SSO'>;

type SSOScreenRouteProp = RouteProp<
  { SSO: { uid: string; key: string } },
  'SSO'
>;

export const SSOScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const route = useRoute<SSOScreenRouteProp>();
  const { key } = route.params || {};
  const { handleSSO, isLoading } = useAuth(key);
  // Read once: the notice stays while the student is on this screen
  const [loggedOut] = useState(hasLoggedOutThisSession);

  return (
    <SharedSSOScreen
      logo={
        isTestBuild ? (
          <TestBuildLogo width="100%" height="100%" />
        ) : (
          <PolitoLogo width="100%" height="100%" />
        )
      }
      // Single Sign-On returns to polito://students, which the official app
      // also claims: a test build leads with the username and password form
      unofficial={
        isTestBuild
          ? { notice: t('testBuild.notice'), ssoNote: t('testBuild.ssoNote') }
          : undefined
      }
      isLoading={isLoading}
      loggedOut={loggedOut}
      onLoginPress={() => navigation.navigate('Login')}
      onSsoPress={() => handleSSO()}
    />
  );
};
