import { ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { getHtmlTextContent } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Icon,
  ListItem,
  OutlineIcon,
  OverviewList,
  RefreshControl,
  Section,
  SectionHeader,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGetBookingTopics } from '../../../core/queries/bookingHooks';
import { getTopicIconName } from '../../../utils/bookings';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';

type Props = NativeStackScreenProps<ServiceStackParamList, 'BookingTopic'>;

/**
 * What can be booked, in one card. A topic with subtopics opens in place;
 * one without opens its slots. Closed ones are shown, disabled, with why.
 */
export const BookingTopicScreen = ({ navigation }: Props) => {
  const topicsQuery = useGetBookingTopics();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const [expanded, setExpanded] = useState<string>();

  const onSelectTopic = useCallback(
    (topicId: string, topicTitle: string) => {
      navigation.navigate('BookingSlot', { topicId, topicName: topicTitle });
    },
    [navigation],
  );

  const closedText = t('bookings.notOpen');

  const rows: ReactElement[] = [];
  topicsQuery.data?.forEach(topic => {
    const title = getHtmlTextContent(topic.title || topic.id);
    const description = getHtmlTextContent(topic.description ?? '');
    const leading = (
      <OutlineIcon
        name={getTopicIconName({ title, description })}
        color={colors.secondaryText}
      />
    );
    const hasSubtopics = topic.subtopics?.length > 0;

    if (!hasSubtopics) {
      const closed = !topic.isEnabled;
      rows.push(
        <ListItem
          key={topic.id}
          title={title}
          subtitle={closed ? closedText : description || undefined}
          leadingItem={leading}
          disabled={closed}
          isAction={!closed}
          onPress={() => onSelectTopic(topic.id, title)}
        />,
      );
      return;
    }

    const isExpanded = expanded === topic.id;
    rows.push(
      <ListItem
        key={topic.id}
        title={title}
        subtitle={description || undefined}
        leadingItem={leading}
        trailingItem={
          <Icon
            icon={isExpanded ? faChevronUp : faChevronDown}
            color={colors.secondaryText}
          />
        }
        onPress={() =>
          setExpanded(current => (current === topic.id ? undefined : topic.id))
        }
        accessibilityRole="button"
        accessibilityLabel={[title, description].filter(Boolean).join(', ')}
        accessibilityState={{ expanded: isExpanded }}
      />,
    );
    if (!isExpanded) return;
    topic.subtopics.forEach(subtopic => {
      const subTitle = getHtmlTextContent(subtopic.title);
      const closed = !subtopic.isEnabled;
      rows.push(
        <ListItem
          key={`${topic.id}-${subtopic.id}`}
          title={subTitle}
          subtitle={closed ? closedText : undefined}
          // An empty slot keeps the subtopics under their topic's text
          leadingItem={<View style={styles.indent} />}
          disabled={closed}
          isAction={!closed}
          onPress={() => onSelectTopic(subtopic.id, subTitle)}
        />,
      );
    });
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl manual queries={[topicsQuery]} />}
    >
      <Section style={styles.section}>
        <SectionHeader
          title={t('bookings.whatToBook')}
          ellipsizeTitle={false}
        />
        <OverviewList
          queries={topicsQuery}
          skeleton={{ count: 3, leading: 'icon', subtitleLines: 1 }}
          emptyState={{
            title: t('states.bookings.noTopicsTitle'),
            text: t('states.bookings.noTopicsText'),
          }}
          errorState={{ title: t('states.bookings.failedTopicsTitle') }}
        >
          {rows}
        </OverviewList>
      </Section>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    section: {
      paddingTop: spacing[5],
    },
    indent: {
      width: 24,
    },
  });
