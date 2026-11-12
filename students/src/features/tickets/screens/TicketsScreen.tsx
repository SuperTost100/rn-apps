import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useIsOnline, useQueryStates } from '@polito/lib/core';
import {
  BottomActionBar,
  CtaButton,
  OverviewList,
  RefreshControl,
  type Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { TicketOverview } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useNotifications } from '../../../core/hooks/useNotifications';
import {
  getTicketStatusGroup,
  useGetTickets,
} from '../../../core/queries/ticketHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { TicketListItem } from '../components/TicketListItem';

type Props = NativeStackScreenProps<ServiceStackParamList, 'Tickets'>;

/** Tickets that wait for the student come first, concluded ones last */
const getTicketRank = (ticket: TicketOverview) => {
  const group = getTicketStatusGroup(ticket.status);
  if (group === 'waitingUser') return ticket.unreadCount > 0 ? 0 : 1;
  if (group === 'open') return 2;
  if (group === 'duplicate') return 5;
  return ticket.needsFeedback ? 3 : 4;
};

const TicketRow = ({
  ticket,
  selected,
}: {
  ticket: TicketOverview;
  selected: boolean;
}) => {
  const { getUnreadsCount } = useNotifications();
  const unread = !!getUnreadsCount([
    'services',
    'tickets',
    ticket.id.toString(),
  ]);
  return <TicketListItem ticket={ticket} unread={unread} selected={selected} />;
};

export const TicketsScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const ticketsQuery = useGetTickets();
  const states = useQueryStates(ticketsQuery);
  const isOnline = useIsOnline();
  const newId = route.params?.newId;

  const tickets = useMemo(
    () =>
      (ticketsQuery.data ?? []).slice().sort((a, b) => {
        const rankDifference = getTicketRank(a) - getTicketRank(b);
        if (rankDifference !== 0) return rankDifference;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      }),
    [ticketsQuery.data],
  );
  const hasList = states.status === 'ready';
  const newTicket = () => navigation.navigate('CreateTicket', {});

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl queries={[ticketsQuery]} manual />}
        contentContainerStyle={styles.container}
      >
        <OverviewList
          states={states}
          skeleton={{
            count: 3,
            trailing: 'chip',
            titleLines: 2,
            label: t('ticketsScreen.loading'),
          }}
          emptyState={{
            title: t('states.tickets.emptyTitle'),
            text: t('states.tickets.emptyText'),
            action: isOnline
              ? {
                  label: t('ticketsScreen.addNew'),
                  icon: faPlus,
                  primary: true,
                  onPress: newTicket,
                }
              : undefined,
          }}
          errorState={{
            title: t('states.tickets.failedTitle'),
            text: t('states.tickets.failedText'),
          }}
        >
          {tickets.map(ticket => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              selected={ticket.id === newId}
            />
          ))}
        </OverviewList>
      </ScrollView>
      {hasList && (
        <BottomActionBar>
          <CtaButton
            absolute={false}
            containerStyle={styles.cta}
            disabled={!isOnline}
            title={
              isOnline
                ? t('ticketsScreen.addNew')
                : t('states.tickets.newNeedsConnection')
            }
            action={newTicket}
            icon={faPlus}
          />
        </BottomActionBar>
      )}
    </View>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    container: {
      paddingTop: spacing[2],
      paddingBottom: spacing[4],
    },
    cta: {
      padding: 0,
    },
  });
