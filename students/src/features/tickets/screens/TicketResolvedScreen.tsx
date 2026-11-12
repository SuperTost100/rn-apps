import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useFeedbackContext, useIsOnline } from '@polito/lib/core';
import {
  BottomActionBar,
  CtaButton,
  Icon,
  Text,
  TextField,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useProvideTicketFeedback } from '~/core/queries/ticketHooks';

import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { PodiumIcon } from '../components/PodiumIcon';
import { exitToTicketsList } from '../utils/exitToTicketsList';

type Props = NativeStackScreenProps<ServiceStackParamList, 'TicketResolved'>;

const MIN_COMMENT_LENGTH = 100;
const MAX_RATING_REQUIRING_COMMENT = 2;
const RATINGS = [1, 2, 3, 4, 5];
const PODIUM_ICON_SIZE = 64;
const STAR_ICON_SIZE = 32;

export const TicketResolvedScreen = ({ route, navigation }: Props) => {
  const { ticketId } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { setFeedback } = useFeedbackContext();
  const isOnline = useIsOnline();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tried, setTried] = useState(false);
  const { mutateAsync: provideFeedback, isPending } =
    useProvideTicketFeedback(ticketId);

  const commentLength = comment.trim().length;
  const commentRequired = rating > 0 && rating <= MAX_RATING_REQUIRING_COMMENT;
  const commentValid = !commentRequired || commentLength >= MIN_COMMENT_LENGTH;
  const ratingError =
    tried && rating === 0 ? t('ticketResolvedScreen.chooseRating') : undefined;
  const commentError =
    tried && !commentValid
      ? commentLength === 0
        ? t('ticketResolvedScreen.minCharsHint', { count: MIN_COMMENT_LENGTH })
        : t('ticketResolvedScreen.remainingCharsHint', {
            count: MIN_COMMENT_LENGTH - commentLength,
          })
      : undefined;

  const onSubmit = () => {
    setTried(true);
    if (rating === 0 || !commentValid || isPending) return;
    provideFeedback({ rating, comment: comment.trim() || undefined })
      .then(() => {
        setFeedback({ text: t('ticketResolvedScreen.sent') });
        exitToTicketsList(navigation);
      })
      .catch(() =>
        setFeedback({ text: t('ticketResolvedScreen.failed'), isError: true }),
      );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.headerIcon}>
          <PodiumIcon size={PODIUM_ICON_SIZE} color={colors.successText} />
        </View>
        <Text variant="title" accessibilityRole="header" style={styles.center}>
          {t('ticketResolvedScreen.title')}
        </Text>
        <Text variant="prose" style={[styles.center, styles.question]}>
          {t('ticketResolvedScreen.rateQuestion')}
        </Text>
        <View
          style={styles.starsRow}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('ticketResolvedScreen.rateQuestion')}
        >
          {RATINGS.map(value => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: value === rating }}
              accessibilityLabel={t('ticketResolvedScreen.rateValue', {
                value,
              })}
              onPress={() => setRating(value)}
              style={styles.star}
            >
              <Icon
                icon={value <= rating ? faStar : faStarRegular}
                size={STAR_ICON_SIZE}
                color={colors.accent}
              />
            </Pressable>
          ))}
        </View>
        {ratingError && (
          <Text
            variant="secondaryText"
            style={[styles.center, { color: colors.dangerText }]}
          >
            {ratingError}
          </Text>
        )}
        <TextField
          variant="boxed"
          style={styles.comment}
          label={
            commentRequired
              ? t('ticketResolvedScreen.commentRequiredLabel')
              : t('ticketResolvedScreen.commentLabel')
          }
          placeholder={t('ticketResolvedScreen.commentPlaceholder')}
          hint={
            commentRequired && !commentError
              ? t('ticketResolvedScreen.minCharsHint', {
                  count: MIN_COMMENT_LENGTH,
                })
              : undefined
          }
          error={commentError}
          value={comment}
          onChangeText={setComment}
          autoCapitalize="sentences"
          multiline
          numberOfLines={5}
          inputStyle={styles.commentInput}
        />
      </ScrollView>
      <BottomActionBar>
        <CtaButton
          absolute={false}
          containerStyle={styles.cta}
          disabled={!isOnline}
          title={
            isOnline
              ? t('ticketResolvedScreen.sendFeedback')
              : t('ticketResolvedScreen.needsConnection')
          }
          action={onSubmit}
          loading={isPending}
        />
      </BottomActionBar>
    </View>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    container: {
      paddingHorizontal: layout.gutter,
      paddingBottom: spacing[6],
    },
    headerIcon: {
      alignItems: 'center',
      marginTop: spacing[8],
      marginBottom: spacing[4],
    },
    center: {
      textAlign: 'center',
    },
    question: {
      marginTop: spacing[4],
    },
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing[2],
    },
    star: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    comment: {
      marginTop: spacing[4],
    },
    commentInput: {
      minHeight: 128,
    },
    cta: {
      padding: 0,
    },
  });
