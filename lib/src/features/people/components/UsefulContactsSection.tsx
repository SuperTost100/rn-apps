import { useTranslation } from 'react-i18next';

import { ListItem } from '../../../ui/components/ListItem';
import { OutlineIcon } from '../../../ui/components/OutlineIcon';
import { OverviewList } from '../../../ui/components/OverviewList';
import { Section } from '../../../ui/components/Section';
import { SectionHeader } from '../../../ui/components/SectionHeader';
import { useTheme } from '../../../ui/hooks/useTheme';
import { UsefulContact } from '../types';

interface Props {
  contacts: UsefulContact[];
}

export const UsefulContactsSection = ({ contacts }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!contacts.length) {
    return null;
  }

  return (
    <Section>
      <SectionHeader title={t('contactsScreen.usefulContacts')} />
      <OverviewList>
        {contacts.map(contact => (
          <ListItem
            key={contact.id}
            title={contact.title}
            linkTo={{ screen: 'UsefulContact', params: { id: contact.id } }}
            leadingItem={
              <OutlineIcon name="user" color={colors.secondaryText} />
            }
          />
        ))}
      </OverviewList>
    </Section>
  );
};
