import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { AuthProfile } from '@polito/auth-api-client';
import {
  useApiContext,
  useOfflineDisabled,
  useQuietQueryErrors,
} from '@polito/lib/core';
import { useLogout } from '@polito/lib/features/auth';
import {
  BottomBarSpacer,
  Icon,
  ListItem,
  OutlineIcon,
  OverviewList,
  RefreshControl,
  Row,
  Section,
  SectionHeader,
  StatefulMenuView,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';
import { useScrollToTop } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CardSwiper } from '../../../core/components/CardSwiper';
import { useMfaChallengeHandler } from '../../../core/hooks/useMfaChallengeHandler';
import { useEscGet } from '../../../core/queries/escHooks';
import { useSwitchCareer } from '../../../core/queries/studentAuthHooks';
import {
  useGetProfile,
  useGetProfilePicture,
  useGetSmartCard,
  useGetStudent,
} from '../../../core/queries/studentHooks';
import { deleteProfilePictureFile } from '../../../utils/profilePicture';
import {
  degreeNameAsTitle,
  getStudentEnrollmentYear,
} from '../../../utils/students';
import { CareerStatus } from '../components/CareerStatus';
import { SmartCardQrModal } from '../components/SmartCardQrModal';
import { UserStackParamList } from '../components/UserNavigator';

type Props = NativeStackScreenProps<UserStackParamList, 'Profile'>;

type UserDetailsProps = {
  profile?: AuthProfile;
};

const UserDetails = ({ profile }: UserDetailsProps) => {
  const { t } = useTranslation();
  const { spacing, fontSizes } = useTheme();

  return (
    <Section accessible={false} style={{ marginTop: spacing[3] }}>
      <SectionHeader
        title={profile?.lastName + ' ' + profile?.firstName}
        subtitle={t('common.shortUsername') + ' ' + profile?.username}
        titleStyle={{ fontSize: fontSizes.xl }}
        subtitleStyle={{ fontSize: fontSizes.lg }}
      />
    </Section>
  );
};

const HeaderRightDropdown = ({
  profile,
  isOffline,
  color,
}: {
  profile?: AuthProfile;
  isOffline: boolean;
  /** The header's foreground colour */
  color?: string;
}) => {
  const { mutate } = useSwitchCareer();
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const username = profile?.username || '';
  const allCareerIds = useMemo(
    () => profile?.allUsernames ?? [],
    [profile?.allUsernames],
  );
  const canSwitchCareer = allCareerIds.length > 1 && !isOffline;
  const actions = useMemo((): MenuAction[] => {
    if (!canSwitchCareer) return [];

    return allCareerIds.map(careerId => {
      return {
        id: careerId,
        title: careerId,
        state: careerId === username ? 'on' : undefined,
      };
    });
  }, [canSwitchCareer, allCareerIds, username]);

  const onPressAction = ({ nativeEvent: { event } }: NativeActionEvent) => {
    if (event === username) return;
    mutate({ username: event });
  };

  return (
    <View
      style={{ padding: spacing[2] }}
      accessible={true}
      accessibilityRole={canSwitchCareer ? 'button' : 'text'}
      accessibilityLabel={`${t('common.username')} ${username} ${
        canSwitchCareer ? t('common.switchCareerLabel') : ''
      }`}
    >
      <StatefulMenuView actions={actions} onPressAction={onPressAction}>
        <Row>
          <Text variant="link" style={{ marginRight: 5, color }}>
            {username}
          </Text>
          {canSwitchCareer && (
            <Icon icon={faAngleDown} color={color ?? colors.link} />
          )}
        </Row>
      </StatefulMenuView>
    </View>
  );
};

export const ProfileScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  // Tapping the active tab again scrolls back to the top
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { firstRequest } = route.params;
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const [isQrVisible, setIsQrVisible] = useState(false);
  const { username } = useApiContext();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const profileQuery = useGetProfile();
  const profile = profileQuery.data;
  const studentQuery = useGetStudent();
  const student = studentQuery.data;
  const escQuery = useEscGet();
  const esc = escQuery.data;
  const smartCardQuery = useGetSmartCard();
  const smartCardUrl = smartCardQuery.data?.url;
  const pictureQuery = useGetProfilePicture(profile?.username);
  // The student card falls back to the plain details without these
  useQuietQueryErrors([escQuery, smartCardQuery, pictureQuery]);
  const mfaChallengeQuery = useMfaChallengeHandler();

  const isOffline = useOfflineDisabled();

  const confirmLogout = () =>
    Alert.alert(
      t('profile.logout.confirmTitle'),
      t('profile.logout.confirmText'),
      [
        { text: t('profile.logout.stay'), style: 'cancel' },
        {
          text: t('profile.logout.action'),
          style: 'destructive',
          onPress: () =>
            logout(undefined, {
              onSuccess: () => {
                if (username) {
                  deleteProfilePictureFile(username);
                }
              },
            }),
        },
      ],
    );

  const headerRight = useCallback(
    ({ tintColor }: { tintColor?: string }) => (
      <HeaderRightDropdown
        profile={profile}
        isOffline={isOffline}
        color={tintColor}
      />
    ),
    [isOffline, profile],
  );

  useEffect(() => {
    navigation.setOptions({ headerRight });
  }, [headerRight, navigation]);

  const iconColor = colors.secondaryText;
  const logoutBlocked = isOffline || isLoggingOut;

  return (
    <ScrollView
      ref={scrollRef}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          manual
          queries={[
            profileQuery,
            studentQuery,
            escQuery,
            mfaChallengeQuery,
            pictureQuery,
          ]}
        />
      }
    >
      <SafeAreaView>
        <View style={styles.cards}>
          {!profile ||
          smartCardQuery.isLoading ||
          escQuery.isLoading ? null : smartCardUrl ||
            (esc && (esc.canBeRequested || esc.details)) ? (
            <CardSwiper
              firstName={profile.firstName}
              lastName={profile.lastName}
              username={profile.username}
              degreeName={student?.degreeName}
              status={student?.state}
              picture={pictureQuery.data}
              hasSmartCard={!!smartCardUrl}
              europeanStudentCard={esc}
              firstRequest={firstRequest}
              onShowQr={() => setIsQrVisible(true)}
            />
          ) : (
            <UserDetails profile={profile} />
          )}
        </View>
        {profile && (
          <SmartCardQrModal
            visible={isQrVisible}
            onClose={() => setIsQrVisible(false)}
            firstName={profile.firstName}
            lastName={profile.lastName}
            degreeName={student?.degreeName}
          />
        )}
        <View style={styles.section}>
          <SectionHeader
            title={t('common.career')}
            trailingItem={
              student?.state ? (
                <CareerStatus status={student.state} />
              ) : undefined
            }
          />
          <OverviewList
            queries={studentQuery}
            isEmpty={() => false}
            skeleton={{ count: 1, leading: 'icon', titleLines: 2 }}
            errorState={{ title: t('states.career.failedTitle') }}
          >
            <ListItem
              title={degreeNameAsTitle(student?.degreeName ?? '')}
              titleProps={{ numberOfLines: 0 }}
              subtitle={[
                student?.degreeLevel,
                t('profile.career.firstYear', {
                  year: getStudentEnrollmentYear(student),
                }),
              ]
                .filter(Boolean)
                .join('\n')}
              subtitleProps={{ numberOfLines: 0 }}
              leadingItem={<OutlineIcon name="bookopen" color={iconColor} />}
              linkTo={{
                screen: 'Degree',
                params: {
                  id: student?.degreeId,
                  year: student?.firstEnrollmentYear,
                },
              }}
            />
          </OverviewList>
        </View>
        <OverviewList style={styles.group}>
          <ListItem
            title={t('notificationsScreen.title')}
            leadingItem={<OutlineIcon name="bell" color={iconColor} />}
            linkTo="Notifications"
          />
          <ListItem
            title={t('profileScreen.settings')}
            leadingItem={<OutlineIcon name="gear" color={iconColor} />}
            linkTo="Settings"
          />
          <ListItem
            title={t('profileScreen.appInfo')}
            leadingItem={<OutlineIcon name="info" color={iconColor} />}
            linkTo="AppInfo"
          />
        </OverviewList>
        <OverviewList style={styles.logout}>
          <ListItem
            title={t('profile.logout.action')}
            titleStyle={!logoutBlocked && { color: colors.dangerText }}
            // Offline the row says why it can't log out, once: logging out
            // asks the server to end the session and forget this phone
            subtitle={
              isOffline
                ? t('profile.logout.offline')
                : t('profile.logout.consequence')
            }
            subtitleProps={{ numberOfLines: 0 }}
            leadingItem={
              <OutlineIcon
                name="logout"
                color={logoutBlocked ? iconColor : colors.dangerText}
              />
            }
            onPress={confirmLogout}
            disabled={logoutBlocked}
          />
        </OverviewList>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    // The cards keep their own size and text: only the space around them
    cards: {
      marginTop: spacing[2],
    },
    // The dots under the cards already leave 24 px
    section: {
      marginTop: 0,
    },
    group: {
      marginTop: layout.sectionGap,
    },
    logout: {
      marginTop: spacing[10],
    },
  });
