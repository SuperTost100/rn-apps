import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, ViewStyle } from 'react-native';

import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';

import { useScreenStatesContext } from '../../core/contexts/ScreenStatesContext';
import {
  QueryStateSource,
  QueryStates,
  useQueryStates,
} from '../../core/hooks/useQueryStates';
import { SkeletonRows, SkeletonRowsProps } from './Skeleton';
import { StateBlock, StateBlockAction } from './StateBlock';

/** What an empty region says: what will appear here, and how to start */
export interface EmptyStateContent {
  title: string;
  text?: string;
  action?: StateBlockAction;
}

/** Overrides the generic "Couldn't load" wording of a failed region */
export interface ErrorStateContent {
  title?: string;
  text?: string;
}

export interface RegionStateProps {
  states: QueryStates;
  emptyState?: EmptyStateContent;
  errorState?: ErrorStateContent;
  /** Draw the failed, empty and offline blocks on a card. Default: true */
  card?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The block a region shows when it has nothing to show: failed (with Try
 * again), offline with nothing saved, or empty. Renders nothing otherwise.
 */
export const RegionStateBlock = ({
  states,
  emptyState,
  errorState,
  card = true,
  style,
}: RegionStateProps) => {
  const { t } = useTranslation();
  const screen = useScreenStatesContext();

  if (states.status === 'error') {
    if (states.isOffline) {
      // When the banner already says "Offline", the block does not repeat it
      const bannerVisible = screen?.isBannerVisible ?? false;
      return (
        <StateBlock
          card={card}
          style={style}
          title={
            bannerVisible ? t('states.notSavedTitle') : t('states.offlineTitle')
          }
          text={
            bannerVisible ? t('states.notSavedText') : t('states.offlineText')
          }
        />
      );
    }
    return (
      <StateBlock
        card={card}
        style={style}
        variant="error"
        title={errorState?.title ?? t('states.failedTitle')}
        text={errorState?.text ?? t('states.failedText')}
        action={{
          label: t('states.tryAgain'),
          icon: faArrowsRotate,
          primary: true,
          onPress: states.retry,
        }}
      />
    );
  }
  if (states.status === 'empty' && emptyState) {
    return (
      <StateBlock
        card={card}
        style={style}
        title={emptyState.title}
        text={emptyState.text}
        action={emptyState.action}
      />
    );
  }
  return null;
};

type QueryStateViewProps = Omit<RegionStateProps, 'states'> & {
  /** The queries the region shows, or states already computed */
  queries?: QueryStateSource | readonly QueryStateSource[];
  states?: QueryStates;
  isEmpty?: (...data: any[]) => boolean;
  /** Shown while loading: an element with the loaded layout's shape, or rows */
  skeleton?: ReactNode | SkeletonRowsProps;
  /** Rendered when the region is ready (and when empty without emptyState) */
  children: ReactNode | ((states: QueryStates) => ReactNode);
};

const isElementLike = (s: unknown): s is ReactNode =>
  s === null ||
  typeof s !== 'object' ||
  Array.isArray(s) ||
  (typeof s === 'object' && s !== null && '$$typeof' in s);

/**
 * A screen region fed by queries that are not a single list: the skeleton
 * while loading, the failed, offline or empty block, and the children when
 * there is something to show.
 */
export const QueryStateView = ({
  queries,
  states: givenStates,
  isEmpty,
  skeleton,
  children,
  ...blockProps
}: QueryStateViewProps) => {
  const ownStates = useQueryStates(queries ?? [], { isEmpty });
  const states = givenStates ?? ownStates;

  if (states.status === 'loading') {
    return isElementLike(skeleton) && skeleton !== undefined ? (
      skeleton
    ) : (
      <SkeletonRows {...(skeleton as SkeletonRowsProps | undefined)} />
    );
  }
  if (
    states.status === 'error' ||
    (states.status === 'empty' && blockProps.emptyState)
  ) {
    return <RegionStateBlock states={states} {...blockProps} />;
  }
  return typeof children === 'function' ? children(states) : children;
};
