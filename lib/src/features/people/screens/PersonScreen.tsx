import { useCallback, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { PersonCourse, PhoneNumber } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { usePreferencesContext } from '../../../core/contexts/PreferencesContext';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { useOpenInAppLink } from '../../../core/hooks/useOpenInAppLink';
import { useQueryStates } from '../../../core/hooks/useQueryStates';
import { notNullish } from '../../../core/utils/predicates';
import { BottomBarSpacer } from '../../../ui/components/BottomBarSpacer';
import { Card } from '../../../ui/components/Card';
import { IconButton } from '../../../ui/components/IconButton';
import { KeyValueList } from '../../../ui/components/KeyValueList';
import { ListItem } from '../../../ui/components/ListItem';
import { OutlineIcon } from '../../../ui/components/OutlineIcon';
import { OverviewList } from '../../../ui/components/OverviewList';
import { PersonAvatar } from '../../../ui/components/PersonListItem';
import { QueryStateView } from '../../../ui/components/QueryStateView';
import { RefreshControl } from '../../../ui/components/RefreshControl';
import { Section } from '../../../ui/components/Section';
import { SectionHeader } from '../../../ui/components/SectionHeader';
import {
  SkeletonBox,
  SkeletonLine,
  SkeletonRegion,
  SkeletonRows,
} from '../../../ui/components/Skeleton';
import { useStylesheet } from '../../../ui/hooks/useStylesheet';
import { useTheme } from '../../../ui/hooks/useTheme';
import { Theme } from '../../../ui/types/Theme';
import { useGetPerson } from '../queries/peopleHooks';
import { PeoplePreferences, PeopleStackParamList } from '../types';
import {
  isPersonPreferred,
  toPersonOverview,
  togglePersonPreferred,
} from '../utils/peoplePreferences';

type Props = NativeStackScreenProps<PeopleStackParamList, 'Person'> & {
  /** Whether to show the preferred/favorite contact toggle. */
  showPreferredContacts?: boolean;
};

const AVATAR_SIZE = 72;

/** "2027" as the academic year it ends, "2026/27" */
const academicYear = (year: number) =>
  `${year - 1}/${String(year).substring(2, 4)}`;

/** The page while it loads: the header card, then two contact rows */
const PersonSkeleton = ({ label }: { label: string }) => {
  const styles = useStylesheet(createStyles);
  const { layout, spacing } = useTheme();
  return (
    <SkeletonRegion label={label}>
      <Card padded style={[styles.headerCard, styles.headerRow]}>
        <SkeletonBox width={AVATAR_SIZE} height={AVATAR_SIZE} round />
        <View style={styles.headerInfo}>
          <SkeletonLine variant="secondaryText" width="30%" />
          <SkeletonLine width="70%" />
          <SkeletonLine variant="secondaryText" width="40%" />
          <SkeletonLine width="30%" />
        </View>
      </Card>
      <View
        style={{
          paddingHorizontal: layout.gutter,
          marginTop: layout.sectionGap - spacing[2],
        }}
      >
        <SkeletonLine variant="heading" width="35%" />
      </View>
      <SkeletonRows count={2} leading="icon" />
    </SkeletonRegion>
  );
};

export const PersonScreen = ({
  route,
  navigation,
  showPreferredContacts = true,
}: Props) => {
  const { id } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const personQuery = useGetPerson(id);
  const { peoplePreferred = [], updatePreference } =
    usePreferencesContext<PeoplePreferences>();
  const { accessibilityListLabel } = useAccessibility();
  const openInAppLink = useOpenInAppLink();
  const person = personQuery.data;
  const isPreferred = person
    ? isPersonPreferred(peoplePreferred, person.id)
    : false;

  const onTogglePreferred = useCallback(() => {
    if (!person) return;
    updatePreference(
      'peoplePreferred',
      togglePersonPreferred(peoplePreferred, toPersonOverview(person)),
    );
  }, [person, peoplePreferred, updatePreference]);
  const fullName = [person?.firstName, person?.lastName]
    .filter(notNullish)
    .join(' ');
  const courses = person?.courses ?? [];
  const phoneNumbers = person?.phoneNumbers ?? [];

  const states = useQueryStates(personQuery);

  // The name is the page title, so the page does not repeat it
  useLayoutEffect(() => {
    if (fullName) navigation.setOptions({ headerTitle: fullName });
  }, [fullName, navigation]);

  const icon = (name: 'phone' | 'mail' | 'ext') => (
    <OutlineIcon name={name} color={colors.secondaryText} />
  );

  const renderPhoneNumber = (phoneNumber: PhoneNumber, index: number) => {
    const number = [phoneNumber.full, phoneNumber?.internal]
      .filter(notNullish)
      .join(' / ');
    return (
      <ListItem
        key={index}
        isAction
        leadingItem={icon('phone')}
        title={number}
        subtitle={t('common.phone')}
        accessibilityLabel={t('serviceInfo.person.call', {
          number: phoneNumber.full,
        })}
        onPress={() => Linking.openURL(`tel:${phoneNumber.full}`)}
      />
    );
  };

  const renderCourse = (course: PersonCourse, index: number) => {
    const role = t(
      'common.' +
        (course.role === 'Titolare' ? 'roleHolder' : 'roleCollaborator'),
    );
    const subtitle = `${academicYear(course.year)} · ${role}`;
    return (
      <ListItem
        key={course.id}
        title={course.name}
        subtitle={subtitle}
        isAction
        accessibilityLabel={`${accessibilityListLabel(
          index,
          courses.length,
        )} ${course.name}, ${subtitle}`}
        linkTo={{
          screen: 'DegreeCourse',
          params: {
            courseShortcode: course.shortcode,
            year: course.year,
          },
        }}
      />
    );
  };

  return (
    <ScrollView
      refreshControl={<RefreshControl queries={[personQuery]} manual />}
      contentInsetAdjustmentBehavior="automatic"
    >
      {states.status !== 'ready' && (
        <QueryStateView
          states={states}
          skeleton={<PersonSkeleton label={t('states.people.loadingOne')} />}
          errorState={{ title: t('states.people.failedOneTitle') }}
          style={styles.headerCard}
        >
          {null}
        </QueryStateView>
      )}
      {states.status === 'ready' && person && (
        <>
          <Card padded style={[styles.headerCard, styles.headerRow]}>
            <PersonAvatar person={person} size={AVATAR_SIZE} />
            <KeyValueList
              style={styles.headerInfo}
              items={[
                { label: t('personScreen.role'), value: person.role },
                {
                  label: t('personScreen.department'),
                  value: person.facilityShortName,
                },
              ]}
            />
            {showPreferredContacts && (
              <IconButton
                icon={isPreferred ? faStar : faStarRegular}
                size={22}
                onPress={onTogglePreferred}
                accessibilityRole="button"
                accessibilityState={{ selected: isPreferred }}
                accessibilityLabel={t(
                  isPreferred
                    ? 'contactsScreen.removePreferred'
                    : 'contactsScreen.addPreferred',
                )}
              />
            )}
          </Card>
          {(phoneNumbers.length > 0 ||
            !!person.email ||
            !!person.profileUrl) && (
            <Section style={styles.firstSection}>
              <SectionHeader title={t('personScreen.contacts')} />
              <OverviewList>
                {phoneNumbers.map(renderPhoneNumber)}
                {!!person.email && (
                  <ListItem
                    isAction
                    leadingItem={icon('mail')}
                    title={person.email}
                    titleProps={{ numberOfLines: 3 }}
                    subtitle={t('common.email')}
                    accessibilityLabel={t('serviceInfo.person.write', {
                      email: person.email,
                    })}
                    onPress={() => Linking.openURL(`mailto:${person.email}`)}
                  />
                )}
                {!!person.profileUrl && (
                  <ListItem
                    isAction
                    leadingItem={icon('ext')}
                    title={t('personScreen.moreInfo')}
                    subtitle={t('serviceInfo.person.profilePage')}
                    accessibilityRole="link"
                    accessibilityLabel={t('serviceInfo.opensInBrowser', {
                      label: `${t('personScreen.moreInfo')}, ${t(
                        'serviceInfo.person.profilePage',
                      )}`,
                    })}
                    onPress={() => openInAppLink(person.profileUrl)}
                  />
                )}
              </OverviewList>
            </Section>
          )}
          {courses.length > 0 && (
            <Section>
              <SectionHeader
                title={t('common.course_plural')}
                accessibilityLabel={`${t('common.course_plural')}. ${t(
                  'personScreen.totalCourses',
                  { total: courses.length },
                )}`}
              />
              <OverviewList>{courses.map(renderCourse)}</OverviewList>
            </Section>
          )}
        </>
      )}
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    // 16 px under the header, as every first card
    headerCard: {
      marginTop: spacing[4],
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[4],
    },
    headerInfo: {
      flex: 1,
      minWidth: 0,
    },
    firstSection: {
      marginTop: layout.sectionGap - spacing[2],
    },
  });
