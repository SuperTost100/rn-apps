import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useRoute } from '@react-navigation/native';

import { usePreferencesContext } from '../../../core/contexts/PreferencesContext';
import { useDebounceValue } from '../../../core/hooks/useDebounceValue';
import { useOfflineDisabled } from '../../../core/hooks/useOfflineDisabled';
import { useQueryStates } from '../../../core/hooks/useQueryStates';
import { BottomBarSpacer } from '../../../ui/components/BottomBarSpacer';
import { OverviewList } from '../../../ui/components/OverviewList';
import { Text } from '../../../ui/components/Text';
import { TranslucentTextField } from '../../../ui/components/TranslucentTextField';
import { useStylesheet } from '../../../ui/hooks/useStylesheet';
import { Theme } from '../../../ui/types/Theme';
import { PersonOverviewListItem } from '../components/PersonOverviewListItem';
import { PreferredContactsSection } from '../components/PreferredContactsSection';
import { RecentSearch } from '../components/RecentSearch';
import { UsefulContactsSection } from '../components/UsefulContactsSection';
import { useGetPeople } from '../queries/peopleHooks';
import {
  PeoplePreferences,
  UsefulContact,
  UsefulContactsVisibility,
} from '../types';

interface Props {
  usefulContacts?: UsefulContact[];
  usefulContactsVisibility?: UsefulContactsVisibility;
  /** Whether to show the preferred/favorite contacts section. */
  showPreferredContacts?: boolean;
  /**
   * Opens the keyboard on the search field. Default: only when the useful
   * contacts appear on focus, or when the route asks for it with
   * `focusSearch`
   */
  autoFocusSearch?: boolean;
}

export const ContactsScreen = ({
  usefulContacts,
  usefulContactsVisibility = 'always',
  showPreferredContacts = true,
  autoFocusSearch,
}: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const route = useRoute();
  const { peoplePreferred = [] } = usePreferencesContext<PeoplePreferences>();
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debounceSearch = useDebounceValue(search, 500);
  const enabled = debounceSearch.length >= 2;
  const peopleQuery = useGetPeople(debounceSearch, enabled);
  const peopleStates = useQueryStates(peopleQuery);
  const hasUsefulContacts = (usefulContacts?.length ?? 0) > 0;
  const isInputDisabled = useOfflineDisabled();
  const focusFromRoute = (route.params as { focusSearch?: boolean } | undefined)
    ?.focusSearch;
  const autoFocus =
    focusFromRoute ??
    autoFocusSearch ??
    usefulContactsVisibility === 'onSearchFocus';

  const showUsefulAlways =
    !enabled && hasUsefulContacts && usefulContactsVisibility === 'always';
  const showUsefulOnSearchFocus =
    !enabled &&
    hasUsefulContacts &&
    usefulContactsVisibility === 'onSearchFocus' &&
    isSearchFocused;

  const idleListHeader = (
    <>
      {showUsefulAlways && <UsefulContactsSection contacts={usefulContacts!} />}
      {showPreferredContacts && peoplePreferred.length > 0 && (
        <PreferredContactsSection contacts={peoplePreferred} />
      )}
      {showUsefulOnSearchFocus && (
        <UsefulContactsSection contacts={usefulContacts!} />
      )}
    </>
  );

  const people = peopleQuery.data ?? [];

  return (
    <>
      <View style={styles.searchBar}>
        <TranslucentTextField
          autoFocus={autoFocus}
          autoCorrect={false}
          leadingIcon={faSearch}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          containerStyle={styles.textField}
          label={t('contactsScreen.search')}
          editable={!isInputDisabled}
          accessibilityHint={
            isInputDisabled ? t('states.needsConnection') : undefined
          }
          isClearable={!!search}
          onClear={() => setSearch('')}
          onClearLabel={t('contactsScreen.clearSearch')}
        />
      </View>
      {!enabled && (
        <RecentSearch
          showRecents={isSearchFocused}
          listHeader={idleListHeader}
        />
      )}
      {enabled && (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.results}
          keyboardShouldPersistTaps="handled"
        >
          <View accessibilityLiveRegion="polite">
            {peopleStates.status === 'ready' && people.length > 0 && (
              <Text
                variant="secondaryText"
                style={styles.status}
                accessibilityRole="text"
              >
                {t('serviceInfo.contacts.matches', {
                  count: people.length,
                  search: debounceSearch,
                })}
              </Text>
            )}
          </View>
          <OverviewList
            states={peopleStates}
            skeleton={{ count: 4, leading: 'avatar' }}
            emptyState={{
              title: t('serviceInfo.contacts.noMatchTitle', {
                search: debounceSearch,
              }),
              text: t('states.people.emptyText'),
            }}
            errorState={{ title: t('states.people.failedTitle') }}
          >
            {people.map((item, index) => (
              <PersonOverviewListItem
                key={item.id}
                person={item}
                index={index}
                totalData={people.length}
                searchString={debounceSearch}
              />
            ))}
          </OverviewList>
          <BottomBarSpacer />
        </ScrollView>
      )}
    </>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    searchBar: {
      paddingTop: spacing[4],
      paddingBottom: spacing[2],
    },
    // The field draws its own 12 px side margin: this makes it the gutter
    textField: {
      marginHorizontal: layout.gutter,
    },
    results: {
      paddingTop: spacing[2],
      paddingBottom: spacing[4],
    },
    status: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[2],
    },
  });
