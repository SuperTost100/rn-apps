import { useEffect, useId } from 'react';

import { useScreenStatesContext } from '../contexts/ScreenStatesContext';
import {
  QueryStateSource,
  QueryStates,
  QueryStatesOptions,
  getQueryStates,
  markStateAware,
} from '../utils/queryStates';
import { useIsOnline } from './useOfflineDisabled';

export type { QueryStateSource, QueryStates, QueryStatesOptions };

/**
 * The state of a screen region fed by one or more queries: loading only
 * while there is no data yet, error only when there is no data to show,
 * empty by the caller's predicate or by array length, ready otherwise.
 * A refresh that fails over older data stays ready, with refreshError set.
 *
 * It also tells the screen's offline banner when the region's data was saved.
 */
export const useQueryStates = <D extends unknown[] = unknown[]>(
  queries: QueryStateSource | readonly QueryStateSource[],
  options?: QueryStatesOptions<D>,
): QueryStates => {
  const isOnline = useIsOnline();
  const list = (
    Array.isArray(queries) ? queries : [queries]
  ) as readonly QueryStateSource[];
  const states = getQueryStates(list, isOnline, options);

  const screen = useScreenStatesContext();
  const id = useId();
  const hasData = states.status === 'ready' || states.status === 'empty';
  const { updatedAt } = states;
  // Callers that pass states they computed elsewhere pass no queries
  const reports = list.length > 0;
  useEffect(() => {
    if (reports) screen?.report(id, { hasData, updatedAt });
  }, [screen, id, hasData, updatedAt, reports]);
  useEffect(() => () => screen?.report(id, null), [screen, id]);

  // While mounted, failures of these queries are shown here, so the global
  // error handler does not also raise an alert for them. Marked again after
  // every render: cleanup and setup run in the same commit, without a gap
  useEffect(() => markStateAware(list.map(q => q.refetch)));

  return states;
};
