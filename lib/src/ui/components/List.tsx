import {
  Children,
  Fragment,
  PropsWithChildren,
  isValidElement,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { useTheme } from '../hooks/useTheme';
import { IndentedDivider } from './IndentedDivider';
import { ListRowContext } from './ListItem';

interface Props {
  /** Hairlines between the rows. Default: on, on both platforms */
  dividers?: boolean;
  /**
   * Dividers start at the text column of the row below them, past its
   * leading icon (default). With false they start at the card's padding.
   */
  indented?: boolean;
}

/**
 * Guess for rows that are not a ListItem, or before a ListItem reports:
 * screen rows that take one of these props draw a leading item
 */
const looksLikeItHasALeadingItem = (props: any) =>
  !!props?.leadingItem ||
  !!props?.course ||
  !!props?.exam ||
  !!props?.person ||
  !!props?.ticket;

/**
 * Renders a list of rows with dividers between them
 */
export const List = ({
  dividers = true,
  indented = true,
  children,
}: PropsWithChildren<Props>) => {
  const { layout, controls } = useTheme();
  // Whether each row has a leading column, as the ListItem inside reports it
  const [leading, setLeading] = useState<Record<number, boolean>>({});
  const reporters = useMemo(() => new Map<number, (v: boolean) => void>(), []);
  const reporterFor = useCallback(
    (index: number) => {
      let reporter = reporters.get(index);
      if (!reporter) {
        reporter = (hasLeadingItem: boolean) =>
          setLeading(prev =>
            prev[index] === hasLeadingItem
              ? prev
              : { ...prev, [index]: hasLeadingItem },
          );
        reporters.set(index, reporter);
      }
      return reporter;
    },
    [reporters],
  );

  if (!dividers) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  const items = Children.toArray(children).filter(isValidElement);
  const textColumn =
    layout.cardPadding + controls.leadingSize + layout.leadingGap;

  return (
    <>
      {items.map((c, i) => {
        const hasLeadingItem =
          leading[i] ?? looksLikeItHasALeadingItem(c.props);
        const indent =
          indented && hasLeadingItem ? textColumn : layout.cardPadding;
        return (
          <Fragment key={c.key ?? i}>
            {i > 0 && <IndentedDivider indent={indent} />}
            <ListRowContext.Provider value={reporterFor(i)}>
              {c}
            </ListRowContext.Provider>
          </Fragment>
        );
      })}
    </>
  );
};
