import { useTranslation } from 'react-i18next';
import DeviceInfo from 'react-native-device-info';

import { isTestBuild } from '../../config/testBuild';

/**
 * The installed version as App info and Settings show it: "Version: 1.9.5
 * (90)", or "Version: 1.9.5 test 1" in a test build
 */
export const useVersionText = () => {
  const { t } = useTranslation();
  const version = DeviceInfo.getVersion();
  // The last two digits of the build number count the builds of a version
  const build = DeviceInfo.getBuildNumber().slice(-2);
  return isTestBuild
    ? t('testBuild.version', { version, build: Number(build) })
    : t('appInfoScreen.version', { version, build });
};
