/**
 * The state of a screen region fed by one or more queries. Kept free of React
 * and React Native so it can be checked against @tanstack/query-core alone.
 */
export type QueryStatus = 'loading' | 'error' | 'empty' | 'ready';

/** The fields of a TanStack query result this logic reads */
export interface QueryStateSource {
  data: unknown;
  error: unknown;
  status: 'pending' | 'error' | 'success';
  fetchStatus: 'fetching' | 'paused' | 'idle';
  dataUpdatedAt: number;
  isRefetching: boolean;
  refetch: () => unknown;
}

export interface QueryStatesOptions<D extends unknown[] = unknown[]> {
  /**
   * Decides whether the loaded data counts as empty. Gets the data of every
   * query, in order. By default the region is empty when every query
   * returned an array and all of them are empty.
   */
  isEmpty?: (...data: D) => boolean;
}

export interface QueryStates {
  /**
   * loading: no data yet and a request is under way.
   * error: no data to show, because a request failed or the phone is offline
   * (see isOffline). Data from an earlier load always wins over an error.
   * empty: loaded, and there is nothing in it.
   * ready: there is data to show, even if a later refresh failed.
   */
  status: QueryStatus;
  /** The phone has no connection */
  isOffline: boolean;
  /** When the oldest data shown was fetched (ms), if any data is shown */
  updatedAt?: number;
  /** The error of the first failed query, whatever the status */
  error?: unknown;
  /**
   * A refresh failed while older data is still shown (status ready or
   * empty): the screen stays as it is and can mention it without blocking
   */
  refreshError?: unknown;
  /** A query that already has data is fetching again */
  isRefetching: boolean;
  /** Fetches again the queries that failed or have no data */
  retry: () => void;
}

const hasData = (q: QueryStateSource) => q.data !== undefined;

export const getQueryStates = <D extends unknown[] = unknown[]>(
  queries: readonly QueryStateSource[],
  isOnline: boolean,
  options: QueryStatesOptions<D> = {},
): QueryStates => {
  const isOffline = !isOnline;
  const failed = queries.filter(q => q.status === 'error');
  const missing = queries.filter(q => !hasData(q));
  const withData = queries.filter(hasData);
  const updatedAt = withData.length
    ? Math.min(...withData.map(q => q.dataUpdatedAt).filter(t => t > 0))
    : undefined;

  const retry = () => {
    queries
      .filter(q => q.status === 'error' || !hasData(q))
      .forEach(q => q.refetch());
  };

  let status: QueryStatus;
  if (missing.length > 0) {
    // Without data, a failure or a request held back offline is an error.
    // A paused query is one TanStack holds until the phone is back online
    const blocked = missing.some(
      q => q.status === 'error' || q.fetchStatus === 'paused',
    );
    status =
      blocked || (isOffline && missing.every(q => q.fetchStatus !== 'fetching'))
        ? 'error'
        : 'loading';
  } else {
    const data = queries.map(q => q.data) as D;
    const empty = options.isEmpty
      ? options.isEmpty(...data)
      : data.every(d => Array.isArray(d) && d.length === 0);
    status = empty ? 'empty' : 'ready';
  }

  return {
    status,
    isOffline,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : undefined,
    error: failed[0]?.error,
    refreshError:
      status === 'ready' || status === 'empty' ? failed[0]?.error : undefined,
    isRefetching: queries.some(q => q.isRefetching),
    retry,
  };
};

/**
 * The refetch functions of the queries some mounted region renders states
 * for, with a count. TanStack binds `refetch` once per observer, so the
 * function a result exposes is the same one `query.observers` holds: the
 * global error handler can tell whether a failure is already on screen.
 */
const stateAwareRefetchers = new Map<unknown, number>();

/** Marks the queries of a region as rendered with states; returns the undo */
export const markStateAware = (refetchers: readonly unknown[]) => {
  refetchers.forEach(r =>
    stateAwareRefetchers.set(r, (stateAwareRefetchers.get(r) ?? 0) + 1),
  );
  return () =>
    refetchers.forEach(r => {
      const n = (stateAwareRefetchers.get(r) ?? 1) - 1;
      if (n <= 0) stateAwareRefetchers.delete(r);
      else stateAwareRefetchers.set(r, n);
    });
};

/** Whether a mounted region shows this query's loading, failed and empty states */
export const isShownWithStates = (query: {
  observers: readonly { refetch: unknown }[];
}) => query.observers.some(o => stateAwareRefetchers.has(o.refetch));
