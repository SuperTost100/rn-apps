import { useState } from 'react';

import { hasLoggedOutThisSession, useAuth } from '@polito/lib/features/auth';
import { SSOScreen as SharedSSOScreen } from '@polito/lib/ui';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GuestStackParamList } from '~/core/components/GuestNavigator.tsx';
import { PolitoLogo } from '~/core/components/Logo.tsx';

type Props = NativeStackScreenProps<GuestStackParamList, 'SSO'>;

type SSOScreenRouteProp = RouteProp<
  { SSO: { uid: string; key: string } },
  'SSO'
>;

export const SSOScreen = ({ navigation }: Props) => {
  const route = useRoute<SSOScreenRouteProp>();
  const { key } = route.params || {};
  const { handleSSO, isLoading } = useAuth(key);
  // Read once: the notice stays while the student is on this screen
  const [loggedOut] = useState(hasLoggedOutThisSession);

  return (
    <SharedSSOScreen
      logo={<PolitoLogo width="100%" height="100%" />}
      isLoading={isLoading}
      loggedOut={loggedOut}
      onLoginPress={() => navigation.navigate('Login')}
      onSsoPress={() => handleSSO()}
    />
  );
};
