import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faPencil } from '@fortawesome/free-solid-svg-icons';
import {
  getHtmlTextContent,
  useDebounceValue,
  useQueryStates,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  CtaButton,
  ListItem,
  OutlineIcon,
  OverviewList,
  Text,
  TextField,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useSearchTicketFaqs } from '../../../core/queries/ticketHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';

type Props = NativeStackScreenProps<ServiceStackParamList, 'TicketFaqs'>;

/**
 * Search the FAQs before writing a ticket: an option offered by the new
 * ticket form, never a step to get through. Results come as you type.
 */
export const TicketFaqsScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const term = useDebounceValue(search, 400).trim();
  const faqsQuery = useSearchTicketFaqs(term);
  const states = useQueryStates(faqsQuery);
  const hasTerm = term.length >= 3;
  const faqs = hasTerm
    ? [...(faqsQuery.data ?? [])].sort((a, b) =>
        a.question.localeCompare(b.question),
      )
    : [];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.content}
    >
      <View style={styles.pad}>
        <Text variant="secondaryText">{t('ticketFaqsScreen.intro')}</Text>
        <TextField
          variant="boxed"
          label={t('ticketFaqsScreen.searchLabel')}
          placeholder={t('ticketFaqsScreen.searchPlaceholder')}
          hint={t('ticketFaqsScreen.searchHint')}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
      </View>
      {hasTerm && (
        <View accessibilityLiveRegion="polite">
          {states.status === 'ready' && (
            <Text
              variant="secondaryText"
              style={[styles.pad, styles.count]}
              accessibilityRole="text"
            >
              {t('ticketFaqsScreen.results', { count: faqs.length })}
            </Text>
          )}
          <OverviewList
            states={states}
            skeleton={{
              count: 3,
              leading: 'icon',
              subtitle: false,
              titleLines: 2,
            }}
            emptyState={{
              title: t('ticketFaqsScreen.noResultsTitle', { term }),
              text: t('ticketFaqsScreen.noResultsText'),
            }}
            errorState={{ title: t('states.tickets.failedFaqsTitle') }}
          >
            {faqs.map(faq => (
              <ListItem
                key={faq.id}
                leadingItem={
                  <OutlineIcon name="info" color={colors.secondaryText} />
                }
                title={getHtmlTextContent(faq.question)}
                titleProps={{ numberOfLines: 3 }}
                linkTo={{ screen: 'TicketFaq', params: { faq } }}
              />
            ))}
          </OverviewList>
        </View>
      )}
      <View style={styles.pad}>
        <Text variant="secondaryText" style={styles.notFound}>
          {t('ticketFaqsScreen.noResultFound')}
        </Text>
        <CtaButton
          absolute={false}
          variant="outlined"
          containerStyle={styles.cta}
          title={t('ticketFaqsScreen.writeTicket')}
          icon={faPencil}
          action={() => navigation.navigate('CreateTicket', {})}
        />
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing[4],
    },
    pad: {
      paddingHorizontal: layout.gutter,
    },
    count: {
      paddingBottom: spacing[1],
    },
    notFound: {
      marginTop: spacing[6],
    },
    cta: {
      paddingHorizontal: 0,
    },
  });
