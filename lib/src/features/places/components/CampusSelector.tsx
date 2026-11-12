import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { faChevronDown, faSchool } from '@fortawesome/free-solid-svg-icons';

import { usePreferencesContext } from '../../../core/contexts/PreferencesContext';
import { Icon, Row, StatefulMenuView, Text } from '../../../ui/components';
import { HeaderForegroundContext } from '../../../ui/components/AppHeader';
import { useTheme } from '../../../ui/hooks/useTheme';
import { useGetSite, useGetSites } from '../queries/placesHooks';

export const CampusSelector = () => {
  const { t } = useTranslation();
  const { spacing, colors, fontSizes } = useTheme();
  const { data: sites } = useGetSites();
  const { campusId, updatePreference } = usePreferencesContext();
  const campus = useGetSite(campusId);
  // On the navy header the link colour would not be readable
  const color = useContext(HeaderForegroundContext) ?? colors.link;

  return (
    <StatefulMenuView
      title={t('common.campus')}
      onPressAction={({ nativeEvent: { event: newCampusId } }) => {
        updatePreference(
          'campusId',
          sites?.data?.find(s => s.id === newCampusId)?.id,
        );
      }}
      actions={
        sites?.data?.map(site => ({
          id: site.id,
          title: site.name,
          state: campusId === site.id ? 'on' : undefined,
        })) ?? []
      }
    >
      <Row align="center" mr={2} gap={0.5} style={{ maxWidth: '73%' }}>
        <Icon icon={faSchool} color={color} />
        <Text
          variant="link"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            flexGrow: 1,
            flexShrink: 1,
            marginLeft: spacing[1],
            color,
          }}
        >
          {campus?.name ?? t('common.campus')}
        </Text>
        <Icon icon={faChevronDown} color={color} size={fontSizes.xs} />
      </Row>
    </StatefulMenuView>
  );
};
