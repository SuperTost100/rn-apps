import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet } from 'react-native';

import { BottomBarSpacer } from '../../../ui/components/BottomBarSpacer';
import { Card } from '../../../ui/components/Card';
import { InfoMessage } from '../../../ui/components/InfoMessage';
import { ListItem } from '../../../ui/components/ListItem';
import { OutlineIcon } from '../../../ui/components/OutlineIcon';
import { OverviewList } from '../../../ui/components/OverviewList';
import { Section } from '../../../ui/components/Section';
import { SectionHeader } from '../../../ui/components/SectionHeader';
import { useStylesheet } from '../../../ui/hooks/useStylesheet';
import { useTheme } from '../../../ui/hooks/useTheme';
import { Theme } from '../../../ui/types/Theme';
import { UsefulContactDetail, UsefulContactItem } from '../types';

interface Props {
  detail: UsefulContactDetail;
}

const ICONS = { email: 'mail', tel: 'phone', link: 'ext' } as const;

/**
 * A useful contact: what the service does in a card, how to reach it as a
 * section, then its contacts as rows. The header already shows its name.
 */
export const StaticContactScreenContent = ({ detail }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();

  const openContact = (contact: UsefulContactItem) => {
    const { kind, target } = contact.action;
    const url =
      kind === 'email'
        ? `mailto:${target}`
        : kind === 'tel'
          ? `tel:${target}`
          : target;
    if (!url) return;
    Linking.openURL(url);
  };

  const contactLabel = (contact: UsefulContactItem) => {
    switch (contact.action.kind) {
      case 'email':
        return t('serviceInfo.person.write', { email: contact.value });
      case 'tel':
        return t('serviceInfo.person.call', { number: contact.value });
      default:
        return `${contact.title}, ${contact.value}`;
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Card padded style={styles.firstCard}>
        {detail.description.paragraphs.map((paragraph, index) => (
          <Fragment key={index}>{paragraph}</Fragment>
        ))}
        {detail.description.warning && (
          <InfoMessage variant="warning">
            {detail.description.warning}
          </InfoMessage>
        )}
      </Card>

      {detail.info && (
        <Section style={styles.section}>
          <SectionHeader title={detail.info.title} />
          <Card padded>{detail.info.body}</Card>
        </Section>
      )}

      {detail.contacts.length > 0 && (
        <Section style={!detail.info && styles.section}>
          <SectionHeader title={t('personScreen.contacts')} />
          <OverviewList>
            {detail.contacts.map((contact, index) => (
              <ListItem
                key={index}
                title={contact.value}
                titleProps={{ numberOfLines: 3 }}
                subtitle={contact.title}
                onPress={() => openContact(contact)}
                isAction
                accessibilityRole={
                  contact.action.kind === 'link' ? 'link' : 'button'
                }
                accessibilityLabel={contactLabel(contact)}
                leadingItem={
                  <OutlineIcon
                    name={ICONS[contact.action.kind]}
                    color={colors.secondaryText}
                  />
                }
              />
            ))}
          </OverviewList>
        </Section>
      )}
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    // 16 px under the header, as every first card
    firstCard: {
      marginTop: spacing[4],
      gap: spacing[3],
    },
    section: {
      marginTop: layout.sectionGap - spacing[2],
    },
  });
