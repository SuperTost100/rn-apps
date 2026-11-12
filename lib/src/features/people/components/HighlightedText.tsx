import { Text } from '../../../ui/components/Text';

/**
 * A name with the searched part in bold, so the match shows without relying
 * on colour
 */
export const HighlightedText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  const highlightIndex = highlight
    ? text.toLowerCase().indexOf(highlight.toLowerCase())
    : -1;
  if (highlightIndex === -1) {
    return (
      <Text variant="title" numberOfLines={2}>
        {text}
      </Text>
    );
  }

  return (
    <Text variant="title" numberOfLines={2}>
      {text.substring(0, highlightIndex)}
      <Text variant="title" weight="bold">
        {text.substring(highlightIndex, highlightIndex + highlight.length)}
      </Text>
      {text.substring(highlightIndex + highlight.length)}
    </Text>
  );
};
