import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { APP_TIMEZONE, getHtmlTextContent } from '@polito/lib/core';
import { useAccessibility } from '@polito/lib/core';
import { ListItem, Text } from '@polito/lib/ui';
import { JobOfferOverview } from '@polito/student-api-client';

import { DateTime } from 'luxon';

interface Props {
  jobOffer: JobOfferOverview;
  index: number;
  totalData: number;
}

/** An offer: its title on up to 2 lines, who and where, and the deadline */
export const JobOfferListItem = ({ jobOffer, index, totalData }: Props) => {
  const { t } = useTranslation();
  const { accessibilityListLabel } = useAccessibility();

  const title = getHtmlTextContent(jobOffer?.title);
  const companyAndPlace = [jobOffer.companyName, jobOffer.location]
    .filter(Boolean)
    .join(' · ');
  const applyBy = t('serviceInfo.jobs.applyBy', {
    date: DateTime.fromJSDate(jobOffer.endsAtDate, {
      zone: APP_TIMEZONE,
    }).toFormat('ccc d LLL'),
  });

  return (
    <ListItem
      title={title}
      linkTo={{
        screen: 'JobOffer',
        params: {
          id: jobOffer?.id,
        },
      }}
      accessibilityLabel={[
        accessibilityListLabel(index, totalData),
        title,
        companyAndPlace,
        applyBy,
      ].join(', ')}
      subtitle={
        <View>
          <Text variant="secondaryText" numberOfLines={2}>
            {companyAndPlace}
          </Text>
          <Text variant="secondaryText" numberOfLines={1}>
            {applyBy}
          </Text>
        </View>
      }
    />
  );
};
