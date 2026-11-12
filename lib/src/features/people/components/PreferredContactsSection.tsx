import { useTranslation } from 'react-i18next';

import { PersonOverview } from '@polito/student-api-client';

import { OverviewList } from '../../../ui/components/OverviewList';
import { Section } from '../../../ui/components/Section';
import { SectionHeader } from '../../../ui/components/SectionHeader';
import { PersonOverviewListItem } from './PersonOverviewListItem';

interface Props {
  contacts: PersonOverview[];
}

export const PreferredContactsSection = ({ contacts }: Props) => {
  const { t } = useTranslation();

  if (!contacts.length) {
    return null;
  }

  return (
    <Section>
      <SectionHeader title={t('contactsScreen.preferredContacts')} />
      <OverviewList>
        {contacts.map((person, index) => (
          <PersonOverviewListItem
            key={person.id}
            person={person}
            index={index}
            totalData={contacts.length}
          />
        ))}
      </OverviewList>
    </Section>
  );
};
