import { useTranslation } from 'react-i18next';

import { InfoMessage, Text, useTheme } from '@polito/lib/ui';

import { MutationFailure } from '../../utils/mutationFailure';

interface Props {
  /** What did not happen, e.g. "Couldn't book the exam" */
  title: string;
  failure: MutationFailure;
  /** Said when no answer came back, after the screen fetched the state again */
  lostText: string;
  /** What to do after a refusal. Default: try again, then a ticket */
  whatToDo?: string;
}

/**
 * Says in place that an action failed: the server's reason when it gave
 * one, then what to do. Screen readers announce it when it appears
 */
export const FailureNote = ({ title, failure, lostText, whatToDo }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const color = { color: colors.dangerText };
  const body = failure.lost
    ? lostText
    : [
        failure.message ?? t('examScreen.noServerReason'),
        whatToDo ?? t('examScreen.failedWhatToDo'),
      ].join(' ');

  return (
    <InfoMessage variant="error" accessibilityLabel={`${title}. ${body}`}>
      <Text variant="secondaryText" weight="semibold" style={color}>
        {title}
      </Text>
      <Text variant="secondaryText" style={color}>
        {body}
      </Text>
    </InfoMessage>
  );
};
