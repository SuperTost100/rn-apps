import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AppState } from 'react-native';

import type { ResponseError } from '@polito/auth-api-client';
import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core';
import {
  Query,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';

import { SQLiteStorage } from 'expo-sqlite/kv-store';
import { DateTime } from 'luxon';
import SuperJSON from 'superjson';

import { PolitoAppConfig } from '../config';
import {
  ApiContext,
  ApiContextProps,
  Credentials,
} from '../contexts/ApiContext';
import { AuthApiContext } from '../contexts/AuthApiContext';
import { useFeedbackContext } from '../contexts/FeedbackContext';
import { PolitoAppContext } from '../contexts/PolitoAppContext';
import { usePreferencesContext } from '../contexts/PreferencesContext';
import { useSplashContext } from '../contexts/SplashContext';
import {
  AuthApiClient,
  AuthIdentityValidator,
  PushTokenProvider,
} from '../types/auth';
import { APP_TIMEZONE } from '../utils/dates';
import { isEnvProduction } from '../utils/env';
import { createPolitoAppKeychainServices } from '../utils/keychain';
import { isResponseError } from '../utils/queries';
import { errorPresentation } from '../utils/queryStates';

const DATA_MAX_AGE = 1000 * 3600 * 24 * 7;

const queryStorage = new SQLiteStorage('queryClient');

const queryPersister = experimental_createQueryPersister({
  storage: {
    getItem: key => queryStorage.getItem(key),
    setItem: (key, value: string) => queryStorage.setItem(key, value),
    removeItem: key => queryStorage.removeItem(key),
    // Lets restoreQueries read every saved query at startup
    entries: async () => {
      const keys = await queryStorage.getAllKeys();
      const pairs = await queryStorage.multiGet(keys);
      return pairs.filter((p): p is [string, string] => p[1] !== null);
    },
  },
  serialize: SuperJSON.stringify,
  deserialize: SuperJSON.parse,
  maxAge: DATA_MAX_AGE,
  refetchOnRestore: 'always',
});

export const clearPersistedQueryCache = () => queryStorage.clear();

type ApiProviderProps = PropsWithChildren<{
  /** App-owned identity and keychain configuration */
  config: PolitoAppConfig;
  /** Creates the generated auth client owned and configured by this app */
  createAuthClient: () => AuthApiClient;
  /** Optional app-owned push transport used to register this device */
  getPushToken?: PushTokenProvider;
  /** Optional app-owned policy for identities returned by the shared login */
  validateIdentity?: AuthIdentityValidator;
  /** Configures the app-specific API client(s) with the token and language */
  updateApiConfiguration: (params: {
    token?: string;
    language?: string;
  }) => void;
}>;

/**
 * Shared API provider: owns the react-query client, global 401/error handling
 * and connectivity feedback. App identity drives the shared keychain, SSO and
 * persistence configuration; the app only plugs in its generated API clients.
 *
 * `Prefs` is the app-specific preferences shape (e.g. `ApiProvider<AppPreferences>`),
 * mirroring `PreferencesProvider<AppPreferences>`.
 */
export const ApiProvider = <Prefs extends object = {}>({
  children,
  config,
  createAuthClient,
  getPushToken,
  validateIdentity,
  updateApiConfiguration,
}: ApiProviderProps) => {
  const { t } = useTranslation();
  const [apiContext, setApiContext] = useState<ApiContextProps>({
    isLogged: false,
    username: '',
    token: '',
    refreshContext: () => {},
  });
  const [hasResolvedInitialCredentials, setHasResolvedInitialCredentials] =
    useState(false);
  const { setFeedback } = useFeedbackContext();
  const { language, username, updatePreference } =
    usePreferencesContext<Prefs>();
  const splashContext = useSplashContext();
  const authApiContext = useMemo(
    () => ({ client: createAuthClient(), getPushToken, validateIdentity }),
    [createAuthClient, getPushToken, validateIdentity],
  );
  const keychainServices = useMemo(
    () => createPolitoAppKeychainServices(config),
    [config],
  );
  const resetCredentials = useCallback(async () => {
    await keychainServices.credentials.resetCredentials();
    await keychainServices.mfaPrivateKey.resetPrivateKeyMFA();
  }, [keychainServices]);

  /** A 401 logs the user out, whatever request got it */
  const handleUnauthorized = useCallback(
    async (client: QueryClient) => {
      await resetCredentials();
      updatePreference('politoAuthnEnrolmentStatus', {});
      Sentry.setUser(null);
      updateApiConfiguration({ language });
      setApiContext(c => ({
        ...c,
        isLogged: false,
        username: '',
        token: '',
      }));
      await clearPersistedQueryCache();
      await client.invalidateQueries();
    },
    [language, resetCredentials, updateApiConfiguration, updatePreference],
  );

  const readServerMessage = useCallback(async (error: ResponseError) => {
    try {
      const { message } = (await error.response.clone().json()) as {
        message?: string;
      };
      if (!isEnvProduction) {
        console.error(message);
        console.error(JSON.stringify(error));
      }
      return message;
    } catch {
      return undefined;
    }
  }, []);

  /**
   * Mutations are actions the user took: the alert stays, with the server's
   * explanation when it gives one
   */
  const mutationErrorHandler = useCallback(
    async (error: unknown, client: QueryClient) => {
      if (!isResponseError(error)) return;
      if (error.response.status === 401) await handleUnauthorized(client);
      const message = await readServerMessage(error);
      // The login alert is handled in the login screen
      if (!error.response.url?.includes('/login'))
        Alert.alert(
          t('common.error'),
          message ?? t('common.somethingWentWrong'),
        );
    },
    [handleUnauthorized, readServerMessage, t],
  );

  /**
   * Queries: when older data stays on screen, a short snackbar says the
   * refresh failed. Without data, a region that renders states
   * (useQueryStates) shows the failure itself, so it gets no alert. Background consumers marked with
   * useQuietQueryErrors say nothing. Screens not converted yet keep an
   * alert, with a translated message and Try again, never the server's text.
   */
  const queryErrorHandler = useCallback(
    async (
      error: unknown,
      query: Query<unknown, unknown, unknown>,
      client: QueryClient,
    ) => {
      if (!isResponseError(error)) return;
      if (error.response.status === 401) {
        // Unchanged: log out and show what the server said
        await mutationErrorHandler(error, client);
        return;
      }
      await readServerMessage(error);
      if (error.response.url?.includes('/login')) return;
      const retry = () => {
        query.fetch().catch(() => {});
      };
      const presentation = errorPresentation(query);
      if (presentation === 'quiet') return;
      // Older data stays on screen: a short snackbar says the refresh failed,
      // whichever screen reads the query
      if (query.state.data !== undefined) {
        const { dataUpdatedAt } = query.state;
        setFeedback({
          id: 'refresh-failed',
          text: dataUpdatedAt
            ? t('states.refreshFailed', {
                time: DateTime.fromMillis(dataUpdatedAt, {
                  zone: APP_TIMEZONE,
                }).toFormat('HH:mm'),
              })
            : t('states.refreshFailedNoTime'),
          action: { label: t('states.tryAgain'), onPress: retry },
        });
        return;
      }
      // Nothing to show: a region that renders states says so itself
      if (presentation === 'states') return;
      Alert.alert(t('common.error'), t('states.loadFailed'), [
        { text: t('states.close'), style: 'cancel' },
        { text: t('states.tryAgain'), onPress: retry },
      ]);
    },
    [mutationErrorHandler, readServerMessage, setFeedback, t],
  );

  // The handlers change whenever their inputs do (the language, the snackbar
  // setter, which changes each time a snackbar shows). The client reads them
  // through refs, because a new client would leave every mounted useQuery
  // observing the old cache while writes and new screens used the new one
  const queryErrorHandlerRef = useRef(queryErrorHandler);
  const mutationErrorHandlerRef = useRef(mutationErrorHandler);
  useEffect(() => {
    queryErrorHandlerRef.current = queryErrorHandler;
    mutationErrorHandlerRef.current = mutationErrorHandler;
  }, [queryErrorHandler, mutationErrorHandler]);

  const [queryClient] = useState(() => {
    const client = new QueryClient({
      queryCache: new QueryCache({
        onError: (error, query) => {
          queryErrorHandlerRef.current(error, query, client);
        },
      }),
      defaultOptions: {
        queries: {
          gcTime: DATA_MAX_AGE,
          staleTime: 300000, // 5 minutes
          // No request starts offline: React Native's fetch has no timeout,
          // so one sent without a network can hang until the app restarts.
          // Saved data comes from restoreQueries at startup instead
          networkMode: 'online',
          retry: isEnvProduction ? 2 : 1,
          refetchOnWindowFocus: isEnvProduction,
          persister: queryPersister.persisterFn,
        },
        mutations: {
          retry: 0,
          onError(error) {
            mutationErrorHandlerRef.current(error, client);
          },
        },
      },
    });
    return client;
  });

  useEffect(() => {
    // Update ApiContext based on the provided token and selected language
    const refreshContext = (credentials?: Credentials) => {
      if (credentials) {
        Sentry.setUser({ username: credentials.username });
      } else {
        Sentry.setUser(null);
      }

      updateApiConfiguration({
        token: credentials?.token,
        language,
      });

      setApiContext(() => ({
        isLogged: !!credentials,
        username: credentials?.username ?? '',
        token: credentials?.token ?? '',
        refreshContext,
      }));
    };

    // Retrieve existing token from the keychain, if any
    keychainServices.credentials
      .getCredentials()
      .then(keychainCredentials => {
        let credentials: Credentials | undefined;

        if (username && keychainCredentials && keychainCredentials.password) {
          credentials = {
            username,
            token: keychainCredentials.password,
          };
        }
        refreshContext(credentials);
        setHasResolvedInitialCredentials(true);
      })
      .catch(e => {
        console.warn("Keychain couldn't be accessed!", e);
        refreshContext();
        setHasResolvedInitialCredentials(true);
      });
  }, [keychainServices, language, username, updateApiConfiguration]);

  useEffect(() => {
    // Track connectivity. Screens show it with the offline banner
    // (OfflineScreenLayout), not with a snackbar
    onlineManager.setEventListener(setOnline => {
      return NetInfo.addEventListener(state => {
        const isConnected =
          state.isConnected && state.isInternetReachable !== false;
        setOnline(!!isConnected);
      });
    });
  }, []);

  useEffect(() => {
    // Tell react-query when the app comes back to the foreground
    focusManager.setEventListener(setFocused => {
      const subscription = AppState.addEventListener('change', status =>
        setFocused(status === 'active'),
      );
      return () => subscription.remove();
    });
  }, []);

  // Saved queries go into the cache before the first screen renders, so a
  // cold start offline shows them. The per-query persister alone restores
  // only inside the query function, which never runs offline
  const [isCacheRestored, setIsCacheRestored] = useState(false);
  useEffect(() => {
    let cancelled = false;
    queryPersister
      .restoreQueries(queryClient)
      .catch(e => console.warn('Could not restore the saved queries', e))
      .finally(() => {
        if (!cancelled) setIsCacheRestored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  // Initialization completed, splash can be hidden
  useEffect(() => {
    if (
      hasResolvedInitialCredentials &&
      isCacheRestored &&
      !splashContext.isAppLoaded
    ) {
      splashContext.setIsAppLoaded(true);
    }
  }, [hasResolvedInitialCredentials, isCacheRestored, splashContext]);

  return (
    <PolitoAppContext.Provider value={config}>
      <AuthApiContext.Provider value={authApiContext}>
        <ApiContext.Provider value={apiContext}>
          {splashContext.isAppLoaded && (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          )}
        </ApiContext.Provider>
      </AuthApiContext.Provider>
    </PolitoAppContext.Provider>
  );
};
