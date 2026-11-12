import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { APP_TIMEZONE, getHtmlTextContent } from '@polito/lib/core';
import { useAccessibility } from '@polito/lib/core';
import {
  ListItem,
  OutlineIcon,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { NewsItemOverview } from '@polito/student-api-client';

import { DateTime } from 'luxon';

import { useNotifications } from '../../../core/hooks/useNotifications';

interface Props {
  newsItem: NewsItemOverview;
  index: number;
  totalData: number;
}

/** A neutral tile with the kind of item: a calendar for events, news otherwise */
const NewsTile = ({ isEvent }: { isEvent: boolean }) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.tile}>
      <OutlineIcon
        name={isEvent ? 'calendar' : 'news'}
        size={20}
        color={colors.neutralChipText}
      />
    </View>
  );
};

/** "Event · Thu 21 Nov, 10:30" or "News · Mon 11 Nov" */
const useNewsMeta = () => {
  const { t } = useTranslation();
  return (
    item: Pick<NewsItemOverview, 'isEvent' | 'eventStartTime' | 'createdAt'>,
  ) => {
    if (item.isEvent && item.eventStartTime) {
      const start = DateTime.fromISO(item.eventStartTime, {
        zone: APP_TIMEZONE,
      });
      return t('serviceInfo.news.eventMeta', {
        day: start.toFormat('ccc d LLL'),
        time: start.toFormat('HH:mm'),
      });
    }
    return t('serviceInfo.news.newsMeta', {
      day: DateTime.fromJSDate(item.createdAt, { zone: APP_TIMEZONE }).toFormat(
        'ccc d LLL',
      ),
    });
  };
};

export const NewsListItem = ({ newsItem, index, totalData }: Props) => {
  const { t } = useTranslation();
  const { accessibilityListLabel } = useAccessibility();
  const { getUnreadsCount } = useNotifications();
  const meta = useNewsMeta();

  const title = getHtmlTextContent(newsItem?.title);
  const shortDescription = getHtmlTextContent(newsItem?.shortDescription);
  const subtitle = meta(newsItem);
  const unread = !!getUnreadsCount([
    'services',
    'news',
    newsItem?.id.toString(),
  ]);

  return (
    <ListItem
      title={title}
      leadingItem={<NewsTile isEvent={newsItem.isEvent} />}
      linkTo={{
        screen: 'NewsItem',
        params: {
          id: newsItem?.id,
        },
      }}
      accessibilityLabel={[
        accessibilityListLabel(index, totalData),
        unread ? t('primitives.unread') : undefined,
        title,
        subtitle,
        shortDescription,
      ]
        .filter(Boolean)
        .join(', ')}
      subtitle={
        <View>
          <Text variant="secondaryText" numberOfLines={2}>
            {subtitle}
          </Text>
          {!!shortDescription && (
            <Text variant="secondaryText" numberOfLines={1}>
              {shortDescription}
            </Text>
          )}
        </View>
      }
      unread={unread}
    />
  );
};

const createStyles = ({ colors, controls, shapes }: Theme) =>
  StyleSheet.create({
    tile: {
      width: controls.courseTileSize,
      height: controls.courseTileSize,
      borderRadius: shapes.md,
      backgroundColor: colors.neutralChipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
