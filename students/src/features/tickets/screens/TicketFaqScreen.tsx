import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { getHtmlTextContent } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  CtaButton,
  HtmlView,
  Text,
  type Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ServiceStackParamList } from '../../services/components/ServicesNavigator';

type Props = NativeStackScreenProps<ServiceStackParamList, 'TicketFaq'>;

/** One FAQ: the question as the page title, the answer in a card */
export const TicketFaqScreen = ({ route, navigation }: Props) => {
  const { faq } = route.params;
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <Text variant="title" accessibilityRole="header" style={styles.question}>
        {getHtmlTextContent(faq.question)}
      </Text>
      <Card padded>
        <HtmlView
          props={{ source: { html: faq.answer }, baseStyle: { padding: 0 } }}
          variant="prose"
        />
      </Card>
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
    question: {
      paddingHorizontal: layout.gutter,
      marginBottom: spacing[2],
    },
    pad: {
      paddingHorizontal: layout.gutter,
    },
    notFound: {
      marginTop: spacing[6],
    },
    cta: {
      paddingHorizontal: 0,
    },
  });
