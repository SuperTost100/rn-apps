import { useTranslation } from 'react-i18next';

import { BottomModal, ModalContent, RadioGroup } from '@polito/lib/ui';

import { FILE_SORT_ORDERS, FileSortOrder } from '../utils/fileTree';

interface Props {
  visible: boolean;
  value: FileSortOrder;
  onChange: (order: FileSortOrder) => void;
  onClose: () => void;
}

/** The five orders of the files as a sheet of radio rows */
export const FileSortSheet = ({ visible, value, onChange, onClose }: Props) => {
  const { t } = useTranslation();
  return (
    <BottomModal visible={visible} onClose={onClose}>
      <ModalContent title={t('course.files.sortTitle')} close={onClose}>
        <RadioGroup
          accessibilityLabel={t('course.files.sortTitle')}
          options={FILE_SORT_ORDERS.map(order => ({
            value: order,
            label: t(`course.files.sort.${order}`),
          }))}
          value={value}
          setValue={order => {
            onChange(order);
            onClose();
          }}
        />
      </ModalContent>
    </BottomModal>
  );
};
