import DeviceInfo from 'react-native-device-info';

/**
 * A private test build: the `preview` Android build type, which installs
 * next to the official app with the `.dev` application id. Debug builds use
 * the same id but run in development mode.
 *
 * Test builds say they are unofficial, show "test" in the version, never
 * offer an update and send nothing to Sentry.
 */
export const isTestBuild =
  !__DEV__ && DeviceInfo.getBundleId() === 'it.polito.students.dev';
