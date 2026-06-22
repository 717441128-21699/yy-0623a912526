import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Customer, PROJECT_TYPE_MAP } from '@/types';
import StatusTag from '../StatusTag';
import { maskPhone, calculatePhotoProgress } from '@/utils';

interface CustomerCardProps {
  customer: Customer;
  showAction?: boolean;
  onStartCapture?: () => void;
  onViewDetail?: () => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  showAction = true,
  onStartCapture,
  onViewDetail
}) => {
  const projectConfig = PROJECT_TYPE_MAP[customer.projectType];
  const progress = calculatePhotoProgress(customer.photos);

  const handleStartCapture = () => {
    if (onStartCapture) {
      onStartCapture();
    } else {
      Taro.switchTab({ url: '/pages/capture/index' });
    }
  };

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail();
    }
  };

  return (
    <View className={styles.card} onClick={handleViewDetail}>
      <View className={styles.header}>
        <View className={styles.left}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>{customer.name.charAt(0)}</Text>
          </View>
          <View className={styles.info}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{customer.name}</Text>
              {customer.nickname && (
                <Text className={styles.nickname}>({customer.nickname})</Text>
              )}
            </View>
            <Text className={styles.phone}>{maskPhone(customer.phone)}</Text>
          </View>
        </View>
        <StatusTag type="customer" status={customer.status} size="md" />
      </View>

      <View className={styles.body}>
        <View className={styles.row}>
          <View
            className={styles.projectTag}
            style={{ backgroundColor: `${projectConfig.color}15`, color: projectConfig.color }}
          >
            <Text>{projectConfig.name}</Text>
          </View>
          <Text className={styles.projectName}>{customer.projectName}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>预约时间</Text>
          <Text className={styles.value}>{customer.appointmentTime}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>疗程节点</Text>
          <Text className={styles.value}>{customer.treatmentNode}</Text>
        </View>
        {customer.consultant && (
          <View className={styles.row}>
            <Text className={styles.label}>咨询师</Text>
            <Text className={styles.value}>{customer.consultant}</Text>
          </View>
        )}

        <View className={styles.progressBar}>
          <View className={styles.progressInfo}>
            <Text className={styles.progressLabel}>拍摄进度</Text>
            <Text className={styles.progressText}>{progress.completed}/{progress.total}</Text>
          </View>
          <View className={styles.progressTrack}>
            <View
              className={styles.progressFill}
              style={{ width: `${progress.percent}%` }}
            />
          </View>
        </View>

        {!customer.hasPortraitAuth && (
          <View className={styles.warning}>
            <Text className={styles.warningText}>⚠ 未签署肖像授权，照片不可外发</Text>
          </View>
        )}
      </View>

      {showAction && (
        <View className={styles.actions}>
          {customer.status !== 'completed' && (
            <Button
              className={classnames(styles.actionBtn, styles.primaryBtn)}
              onClick={(e) => {
                e.stopPropagation();
                handleStartCapture();
              }}
            >
              <Text>开始拍摄</Text>
            </Button>
          )}
          <Button
            className={classnames(styles.actionBtn, styles.secondaryBtn)}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail();
            }}
          >
            <Text>查看详情</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

export default CustomerCard;
