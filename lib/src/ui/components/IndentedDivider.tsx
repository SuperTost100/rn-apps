import { Divider, DividerProps } from './Divider';

interface IndentedDividerProps extends DividerProps {
  /** Space before the line, e.g. up to the text column of a row */
  indent?: number;
}

/**
 * A divider that starts `indent` px from the start of its container
 */
export const IndentedDivider = ({
  indent = 0,
  style,
  ...props
}: IndentedDividerProps) => {
  return <Divider {...props} style={[{ marginStart: indent }, style]} />;
};
