import { PropsWithChildren, ReactElement } from 'react';
import { TextStyle, ViewProps, ViewStyle } from 'react-native';

import { Card } from './Card';
import { StateBlock, StateBlockAction } from './StateBlock';

type Props = PropsWithChildren<
  ViewProps & {
    text?: string;
    /** A line under the text */
    caption?: string;
    action?: StateBlockAction;
    style?: ViewStyle;
    /** @deprecated StateBlock styles the text */
    testStyle?: TextStyle;
    children?: ReactElement;
    spaced?: boolean;
  }
>;

/**
 * A failed state on a card: the alert icon in the danger colour, the text
 * and an optional action. A thin wrapper over StateBlock; with children it
 * is a plain card around them, as before.
 */
export const ErrorCard = ({
  text,
  caption,
  action,
  style,
  children,
  spaced = true,
  ...rest
}: Props) => (
  <Card rounded spaced={spaced} translucent={false} style={style} {...rest}>
    {children ?? (
      <StateBlock
        variant="error"
        title={text ?? ''}
        text={caption}
        action={action}
      />
    )}
  </Card>
);
