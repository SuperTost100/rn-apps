import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { faLink } from '@fortawesome/free-solid-svg-icons';
import { useOpenInAppLink, usePreferencesContext } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Icon,
  ListItem,
  OverviewList,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AgendaStackParamList } from '../components/AgendaNavigator';
import { EventHead } from '../components/EventHead';

type Props = NativeStackScreenProps<AgendaStackParamList, 'Deadline'>;

/** The host of a link, to say where it opens */
const hostOf = (url: string) => {
  const match = /^[a-z]+:\/\/([^/?#]+)/i.exec(url);
  return match?.[1];
};

export const DeadlineScreen = ({ route }: Props) => {
  const { item: deadline } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { language } = usePreferencesContext();
  const openInAppLink = useOpenInAppLink();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView>
        <EventHead
          caption={
            deadline.deadlineType
              ? `${t('agendaScreen.types.deadline')} · ${deadline.deadlineType}`
              : t('agendaScreen.types.deadline')
          }
          date={deadline.start.setLocale(language).toFormat('ccc, d LLL yyyy')}
        />
        {deadline.url && (
          <OverviewList indented style={styles.list}>
            <ListItem
              leadingItem={
                <Icon icon={faLink} size={24} color={colors.secondaryText} />
              }
              title={t('deadlineScreen.openLink')}
              subtitle={hostOf(deadline.url)}
              accessibilityRole="link"
              isAction
              onPress={() => openInAppLink(deadline.url!)}
            />
          </OverviewList>
        )}
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    list: {
      marginTop: spacing[4],
    },
  });
