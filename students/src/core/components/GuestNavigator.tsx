import { useInnerHeaderOptions, useTheme } from '@polito/lib/ui';
import { ParamListBase } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SSOScreen } from '~/core/screens/SSOScreen.tsx';

import { LoginScreen } from '../screens/LoginScreen';

export interface GuestStackParamList extends ParamListBase {
  SSO: undefined;
  Login: undefined;
}

const Stack = createNativeStackNavigator<GuestStackParamList>();

export const GuestNavigator = () => {
  const { colors } = useTheme();
  const innerHeaderOptions = useInnerHeaderOptions();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SSO" component={SSOScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        // A header with only the back arrow: iOS has no system back button,
        // and the form below has its own title. It takes the page colour,
        // without the hairline, so the screen reads as one piece
        options={{
          ...innerHeaderOptions,
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: colors.background },
          contentStyle: undefined,
        }}
      />
    </Stack.Navigator>
  );
};
