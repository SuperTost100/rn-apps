import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { usePreferencesContext } from '../../../core/contexts/PreferencesContext';
import { BottomBarSpacer } from '../../../ui/components/BottomBarSpacer';
import { OverviewList } from '../../../ui/components/OverviewList';
import { Section } from '../../../ui/components/Section';
import { SectionHeader } from '../../../ui/components/SectionHeader';
import { useTheme } from '../../../ui/hooks/useTheme';
import { PeoplePreferences } from '../types';
import { PersonOverviewListItem } from './PersonOverviewListItem';

interface Props {
  listHeader?: ReactNode;
  showRecents?: boolean;
}

/** What Contacts shows before a search: the given sections, then recent people */
export const RecentSearch = ({ listHeader, showRecents = false }: Props) => {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { peopleSearched = [] } = usePreferencesContext<PeoplePreferences>();
  const hasRecents = showRecents && peopleSearched.length > 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: spacing[6] }}
      keyboardShouldPersistTaps="handled"
    >
      {listHeader}
      {hasRecents && (
        <Section>
          <SectionHeader title={t('contactsScreen.recentSearches')} />
          <OverviewList>
            {peopleSearched.map((person, index) => (
              <PersonOverviewListItem
                key={person.id}
                person={person}
                index={index}
                totalData={peopleSearched.length}
              />
            ))}
          </OverviewList>
        </Section>
      )}
      <BottomBarSpacer />
    </ScrollView>
  );
};
