import { API_BASE_PATH } from '@env';
import {
  Configuration as AuthConfiguration,
  DefaultConfig as AuthDefaultConfig,
} from '@polito/auth-api-client';
import { fetchWithTimeout } from '@polito/lib/core';
import { PlacesApiConfig } from '@polito/lib/features/places';
import {
  BASE_PATH,
  Configuration,
  ConfigurationParameters,
  DefaultConfig,
} from '@polito/student-api-client';

export const updateGlobalApiConfiguration = ({
  token,
  language = 'en',
}: {
  token?: string;
  language?: string;
}) => {
  const basePath = API_BASE_PATH ?? BASE_PATH;
  console.debug(`Expecting a running API at ${basePath}`);

  const configurationParameters: ConfigurationParameters = {
    basePath,
    // Every API call gives up after a while instead of hanging
    fetchApi: fetchWithTimeout,
    headers: {
      'Accept-Language': language,
    },
  };

  if (token) {
    configurationParameters.accessToken = token;
  }

  AuthDefaultConfig.config = new AuthConfiguration(configurationParameters);
  DefaultConfig.config = new Configuration(configurationParameters);
  PlacesApiConfig.config = new Configuration(configurationParameters);
};
