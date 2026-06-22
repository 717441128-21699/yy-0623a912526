import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { PhotoItem } from '@/types';
import StatusTag from '../StatusTag';
import { formatTime } from '@/utils';

interface PhotoPreviewProps {
  photo: PhotoItem;
  showActions?: boolean;
  onConfirm?: () => void;
  onRetake?: () => void;
  onView?: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photo,
  showActions = false,
  onConfirm,
  onRetake,
  onView
}) => {
  return (
    <View className={styles.card} onClick={onView}>
      <View className={styles.imageWrapper}>
        <Image
          className={styles.image}
          src={photo.url}
          mode="aspectFill"
          onError={(e) => {
            console.error('[PhotoPreview] 图片加载失败', e.detail);
          }}
        />
        <View className={styles.positionBadge}>
          <Text className={styles.positionText}>{photo.position}</Text>
        </View>
        <View className={styles.statusOverlay}>
          <StatusTag type="photo" status={photo.status} size="sm" />
        </View>
      </View>

      <View className={styles.info}>
        {photo.capturedAt && (
          <Text className={styles.time}>拍摄时间：{formatTime(photo.capturedAt)}</Text>
        )}
      </View>

      {showActions && photo.status === 'captured' && (
        <View className={styles.actions}>
          <Button
            className={classnames(styles.actionBtn, styles.retakeBtn)}
            onClick={(e) => {
              e.stopPropagation();
              onRetake?.();
            }}
          >
            <Text>重拍</Text>
          </Button>
          <Button
            className={classnames(styles.actionBtn, styles.confirmBtn)}
            onClick={(e) => {
              e.stopPropagation();
              onConfirm?.();
            }}
          >
            <Text>确认清晰</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

export default PhotoPreview;
