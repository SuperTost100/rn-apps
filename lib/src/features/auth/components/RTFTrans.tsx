import { ComponentProps, ReactNode } from 'react';
import { Trans } from 'react-i18next';
import { StyleProp, TextStyle } from 'react-native';

import { Text, TextProps } from '../../../ui';

export type RTFTransProps = ComponentProps<typeof Trans> & {
  children?: ReactNode;
  style?: StyleProp<TextStyle>;
  /** The text style of the whole block. Default: prose */
  variant?: TextProps['variant'];
};

/**
 * A line break that draws its own newline: Trans renders <br/> as a void
 * element and drops any children given to it, which lost every break
 */
const LineBreak = () => <Text>{'\n'}</Text>;

/**
 * A translation with <b>, <i>, <u> and <br/> in it, drawn with the app's
 * text, so it follows the theme, the font and the in-app text size
 */
export const RTFTrans = ({
  children,
  style,
  variant = 'prose',
  ...props
}: RTFTransProps) => (
  <Text variant={variant} style={style} key="t0">
    <Trans
      {...props}
      components={{
        b: <Text variant={variant} weight="bold" key="b" />,
        i: <Text variant={variant} italic key="i" />,
        u: (
          <Text
            variant={variant}
            style={{ textDecorationLine: 'underline' }}
            key="u"
          />
        ),
        br: <LineBreak key="br" />,
        ...props.components,
      }}
    >
      {children}
    </Trans>
  </Text>
);
