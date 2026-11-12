import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { getHtmlTextContent } from '@polito/lib/core';
import {
  Card,
  HtmlView,
  Icon,
  IndentedDivider,
  ListItem,
  Text,
  TextButton,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { TicketFAQ } from '@polito/student-api-client';

interface Props {
  faqs: TicketFAQ[];
  onOpen: (faq: TicketFAQ) => void;
}

/**
 * Answers that may already cover the subject being typed. Each one opens in
 * place, and can be opened on its own screen. A short line above announces
 * them to screen readers without moving the focus.
 */
export const FaqSuggestions = ({ faqs, onOpen }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<number>();
  const label = faqs.length
    ? t('createTicketScreen.faqsMayHelp', { count: faqs.length })
    : '';

  return (
    <View>
      <View accessibilityLiveRegion="polite" accessibilityRole="text">
        {!!label && (
          <Text variant="secondaryText" weight="semibold" style={styles.label}>
            {label}
          </Text>
        )}
      </View>
      {faqs.length > 0 && (
        <Card spaced={false}>
          {faqs.map((faq, index) => {
            const question = getHtmlTextContent(faq.question);
            const isOpen = expanded === faq.id;
            return (
              <View key={faq.id}>
                {index > 0 && <IndentedDivider />}
                <ListItem
                  title={question}
                  titleProps={{ numberOfLines: isOpen ? undefined : 3 }}
                  multilineTitle={isOpen}
                  onPress={() => setExpanded(isOpen ? undefined : faq.id)}
                  accessibilityLabel={question}
                  accessibilityHint={t('createTicketScreen.faqToggleHint')}
                  accessibilityState={{ expanded: isOpen }}
                  trailingItem={
                    <Icon
                      icon={isOpen ? faChevronUp : faChevronDown}
                      size={14}
                      color={colors.secondaryText}
                    />
                  }
                />
                {isOpen && (
                  <View style={styles.answer}>
                    <HtmlView
                      props={{
                        source: { html: faq.answer },
                        baseStyle: { padding: 0 },
                      }}
                      variant="prose"
                    />
                    <TextButton onPress={() => onOpen(faq)} style={styles.open}>
                      {t('createTicketScreen.openFaq')}
                    </TextButton>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      )}
    </View>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    label: {
      color: colors.link,
      paddingVertical: spacing[2],
    },
    answer: {
      paddingHorizontal: layout.cardPadding,
      paddingBottom: spacing[2],
    },
    open: {
      alignSelf: 'flex-start',
    },
  });
