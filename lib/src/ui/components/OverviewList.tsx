import { Children, PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { ViewProps } from 'react-native';

import { useScreenReader } from '../../../src/core/hooks/useScreenReader';
import {
  QueryStateSource,
  QueryStates,
  useQueryStates,
} from '../../core/hooks/useQueryStates';
import { useTheme } from '../hooks/useTheme';
import { ActivityIndicator } from './ActivityIndicator';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { List } from './List';
import {
  EmptyStateContent,
  ErrorStateContent,
  RegionStateBlock,
} from './QueryStateView';
import { SkeletonRows, SkeletonRowsProps } from './Skeleton';

type Props = PropsWithChildren<
  ViewProps & {
    style?: ViewProps['style'];
    dividers?: boolean;
    /** Legacy: a spinner, or the skeleton rows when `skeleton` is set */
    loading?: boolean;
    indented?: boolean;
    /** Legacy: a plain title when there are no rows */
    emptyStateText?: string;
    rounded?: boolean;
    translucent?: boolean;
    /**
     * The queries the rows come from. With them the list draws its own
     * loading, failed, offline and empty states
     */
    queries?: QueryStateSource | readonly QueryStateSource[];
    /** States computed by the screen, instead of `queries` */
    states?: QueryStates;
    /** Decides when the loaded data is empty. Default: arrays of length 0 */
    isEmpty?: (...data: any[]) => boolean;
    /** The shape of the rows while loading. Default: 3 rows with a chevron */
    skeleton?: SkeletonRowsProps;
    /** What appears here and how to start, when there is nothing */
    emptyState?: EmptyStateContent;
    /** Overrides the generic failed wording */
    errorState?: ErrorStateContent;
  }
>;

/**
 * Displays a list of items with automatic dividers inside a card, 8 px from
 * whatever is above and below it. Given its queries, it shows skeleton rows
 * while loading and a block when the load failed, the phone is offline with
 * nothing saved, or there is nothing to list.
 * (Only suitable for short non virtual-scrolled lists)
 */
export const OverviewList = ({
  children,
  loading = false,
  indented = false,
  dividers,
  translucent = false,
  emptyStateText,
  style,
  rounded,
  queries,
  states: givenStates,
  isEmpty,
  skeleton,
  emptyState,
  errorState,
  ...rest
}: Props) => {
  const { spacing, layout } = useTheme();
  const { t } = useTranslation();
  const { isEnabled, announce } = useScreenReader();
  const ownStates = useQueryStates(queries ?? [], { isEmpty });
  const states = givenStates ?? (queries ? ownStates : undefined);
  const hasRows = Children.count(children) > 0;

  const isLoading = states ? states.status === 'loading' : loading;
  const showsBlock =
    !!states &&
    (states.status === 'error' ||
      (!!emptyState && (states.status === 'empty' || !hasRows)));

  let content;
  if (isLoading) {
    content =
      skeleton || states ? (
        <SkeletonRows card={false} {...skeleton} />
      ) : (
        <ActivityIndicator style={{ marginVertical: spacing[8] }} />
      );
  } else if (showsBlock) {
    content = (
      <RegionStateBlock
        card={false}
        // A list that has loaded but shows no rows (filtered) is empty too
        states={
          states.status === 'ready' ? { ...states, status: 'empty' } : states
        }
        emptyState={emptyState}
        errorState={errorState}
      />
    );
  } else if (hasRows) {
    content = (
      <List dividers={dividers} indented={indented}>
        {children}
      </List>
    );
  } else {
    content = emptyStateText && <EmptyState message={emptyStateText} />;
  }

  return (
    <Card
      rounded={rounded}
      translucent={translucent}
      style={[{ marginHorizontal: layout.gutter }, style]}
      {...rest}
      onAccessibilityTap={() => {
        if (loading && !states && isEnabled) {
          announce(t('common.loading'));
        }
      }}
    >
      {content}
    </Card>
  );
};
