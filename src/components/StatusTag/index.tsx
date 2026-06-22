import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { CustomerStatus, PhotoStatus, STATUS_MAP, PHOTO_STATUS_MAP } from '@/types';

interface StatusTagProps {
  type: 'customer' | 'photo';
  status: CustomerStatus | PhotoStatus;
  size?: 'sm' | 'md';
}

const StatusTag: React.FC<StatusTagProps> = ({ type, status, size = 'md' }) => {
  const config = type === 'customer' ? STATUS_MAP[status as CustomerStatus] : PHOTO_STATUS_MAP[status as PhotoStatus];

  return (
    <View
      className={classnames(styles.tag, styles[size], {
        [styles.success]: config.color === '#52C41A',
        [styles.warning]: config.color === '#FF7A45' || config.color === '#FA8C16',
        [styles.error]: config.color === '#F5222D',
        [styles.info]: config.color === '#4A90E2',
        [styles.default]: config.color === '#86909C'
      })}
    >
      <Text className={styles.text}>{config.text}</Text>
    </View>
  );
};

export default StatusTag;
