import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { usePreferencesContext } from '@polito/lib/core';
import { useAccessibility } from '@polito/lib/core';
import {
  BottomBarSpacer,
  ListItem,
  OutlineIcon,
  OverviewList,
  RefreshControl,
  Section,
  StatusChip,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppPreferences } from '~/core/types/preferences';

import { useGetGuides } from '../../../core/queries/studentHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';

type Props = NativeStackScreenProps<ServiceStackParamList, 'Guides'>;

export const GuidesScreen = (_props: Props) => {
  const guidesQuery = useGetGuides();
  const { t } = useTranslation();
  const { accessibilityListLabel } = useAccessibility();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);

  const { emailGuideRead } = usePreferencesContext<AppPreferences>();

  const isUnread = (guideId: string) => {
    if (guideId !== 'email') return;

    if (emailGuideRead) return false;
    return true;
  };
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      accessibilityRole="list"
      accessibilityLabel={t('guidesScreen.total', {
        total: guidesQuery.data?.length ?? 0,
      })}
      refreshControl={<RefreshControl queries={[guidesQuery]} manual />}
    >
      <SafeAreaView>
        <Section style={styles.list}>
          <OverviewList
            queries={guidesQuery}
            skeleton={{ count: 3, subtitle: false, leading: 'icon' }}
            emptyState={{
              title: t('states.guides.emptyTitle'),
              text: t('states.guides.emptyText'),
            }}
            errorState={{ title: t('states.guides.failedTitle') }}
          >
            {guidesQuery.data?.map((guide, index) => (
              <ListItem
                key={guide.id}
                title={guide.listTitle}
                leadingItem={
                  <OutlineIcon name="guide" color={colors.secondaryText} />
                }
                chip={
                  isUnread(guide.id) ? (
                    <StatusChip
                      label={t('serviceInfo.guides.new')}
                      tone="info"
                    />
                  ) : undefined
                }
                accessibilityLabel={[
                  accessibilityListLabel(index, guidesQuery.data.length),
                  guide.listTitle,
                  isUnread(guide.id) ? t('serviceInfo.guides.new') : '',
                ]
                  .filter(Boolean)
                  .join(', ')}
                linkTo={{
                  screen: 'Guide',
                  params: { id: guide.id },
                }}
              />
            ))}
          </OverviewList>
        </Section>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

// The card's own 8 px plus these 8: 16 px under the header
const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    list: { paddingTop: spacing[2] },
  });
