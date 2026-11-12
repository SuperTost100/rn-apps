import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faBookOpen, faFlagCheckered } from '@fortawesome/free-solid-svg-icons';
import { useGetPerson } from '@polito/lib/features/people';
import {
  BottomBarSpacer,
  BottomModal,
  Card,
  CtaButton,
  Icon,
  ListItem,
  ModalContent,
  OverviewList,
  PersonListItem,
  RefreshControl,
  Text,
  type Theme,
  useBottomModal,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { formatGrade } from '../../../utils/grades';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { GradeFigure } from '../components/GradeFigure';
import { useGradeMask } from '../components/HideGradesButton';
import { useRecordedDay } from '../components/RecordedGradeListItem';

type Props = NativeStackScreenProps<TeachingStackParamList, 'RecordedGrade'>;

/** A recorded grade: the grade large at the top, then its details */
export const RecordedGradeScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { grade } = route.params;
  const { colors, spacing } = useTheme();
  const styles = useStylesheet(createStyles);
  const { hidden, mask } = useGradeMask();
  const recordedDay = useRecordedDay();
  const teacherQuery = useGetPerson(grade.teacherId ?? undefined);
  const date = new Date(grade.date);

  const {
    open: showBottomModal,
    modal: bottomModal,
    close: closeBottomModal,
  } = useBottomModal();

  const showOnTimeHelp = () => {
    showBottomModal(
      <ModalContent
        title={t('recordedGradeScreen.titleOnTimePoint')}
        close={closeBottomModal}
      >
        <View style={styles.modal}>
          <Text>{t('recordedGradeScreen.textModal')}</Text>
          <CtaButton
            title={t('recordedGradeScreen.ctaButtonModal')}
            action={() => {
              closeBottomModal();
              navigation.navigate('TranscriptCareer');
            }}
            absolute={false}
            containerStyle={{ paddingHorizontal: 0 }}
          />
        </View>
      </ModalContent>,
    );
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl queries={[teacherQuery]} manual />}
      >
        <Card padded style={styles.card}>
          <Text variant="caption">{grade.courseName}</Text>
          <View style={styles.facts}>
            <GradeFigure
              label={t('common.grade')}
              grade={mask(t(formatGrade(grade.grade)))}
              hidden={hidden}
            />
            <View
              accessible
              accessibilityLabel={`${t(
                'recordedGradeScreen.date',
              )}: ${recordedDay(date)}`}
            >
              <Text variant="secondaryText">
                {t('recordedGradeScreen.date')}
              </Text>
              <Text
                variant="title"
                weight="bold"
                style={{ color: colors.title }}
              >
                {recordedDay(date)}
              </Text>
            </View>
          </View>
        </Card>
        <OverviewList indented style={{ marginTop: spacing[2] }}>
          <ListItem
            leadingItem={<Icon icon={faBookOpen} size={20} />}
            title={t('common.creditsWithUnit', { credits: grade.credits })}
            subtitle={
              grade.creditsCountTowardsDegree === false
                ? t('recordedGradeScreen.notCounted')
                : t('recordedGradeScreen.credits')
            }
          />
          {!!grade.onTimeExamPoints && (
            <ListItem
              leadingItem={<Icon icon={faFlagCheckered} size={20} />}
              title={`+${grade.onTimeExamPoints}`}
              subtitle={t('recordedGradeScreen.titleOnTimePoint')}
              onPress={showOnTimeHelp}
              isAction
            />
          )}
          {teacherQuery.data && (
            <PersonListItem
              person={teacherQuery.data}
              subtitle={t('common.teacher')}
            />
          )}
        </OverviewList>
        <View style={{ height: spacing[4] }} />
        <BottomBarSpacer />
      </ScrollView>
      <BottomModal dismissable {...bottomModal} />
    </>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    card: {
      marginTop: spacing[4],
      gap: spacing[4],
    },
    facts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      columnGap: spacing[8],
      rowGap: spacing[3],
    },
    modal: {
      padding: spacing[5],
      gap: spacing[2],
    },
  });
