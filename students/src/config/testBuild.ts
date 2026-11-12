import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/**
 * The identifiers of the private test builds, which install next to the
 * official app: the `preview` Android build type, with the `.dev`
 * application id, and the `Test` iOS configuration, signed by its own team.
 * Debug builds may use the same ids but run in development mode.
 */
const TEST_BUILD_IDS = [
  'it.polito.students.dev',
  'com.supertost100.studentstest',
];

/**
 * A private test build. Test builds say they are unofficial, show "test" in
 * the version, never offer an update and send nothing to Sentry.
 */
export const isTestBuild =
  !__DEV__ && TEST_BUILD_IDS.includes(DeviceInfo.getBundleId());

/**
 * Whether the build can receive push notifications. The iOS test build is
 * signed without the push capability and is not registered with Firebase,
 * so it asks for no token and no notification permission.
 */
export const hasPushNotifications = !(isTestBuild && Platform.OS === 'ios');
