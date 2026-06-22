import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import { photoTips } from '@/data/mockData';

interface PhotoGuideProps {
  positionName: string;
  description: string;
  exampleUrl: string;
  showTips?: boolean;
}

const PhotoGuide: React.FC<PhotoGuideProps> = ({
  positionName,
  description,
  exampleUrl,
  showTips = true
}) => {
  return (
    <View className={styles.container}>
      {showTips && (
        <View className={styles.tipsSection}>
          <View className={styles.tipsTitle}>
            <Text className={styles.tipsTitleText}>拍照前请确认</Text>
          </View>
          <View className={styles.tipsGrid}>
            {photoTips.map((tip, index) => (
              <View key={index} className={styles.tipItem}>
                <Text className={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.positionInfo}>
        <Text className={styles.positionName}>{positionName}</Text>
        <Text className={styles.positionDesc}>{description}</Text>
      </View>

      <View className={styles.exampleSection}>
        <View className={styles.exampleHeader}>
          <Text className={styles.exampleTitle}>标准机位示例</Text>
        </View>
        <View className={styles.exampleImageWrapper}>
          <Image
            className={styles.exampleImage}
            src={exampleUrl}
            mode="aspectFit"
            onError={(e) => {
              console.error('[PhotoGuide] 示例图加载失败', e.detail);
            }}
          />
          <View className={styles.overlayGuide}>
            <View className={styles.guideFrame} />
            <View className={styles.guideLineHorizontal} />
            <View className={styles.guideLineVertical} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default PhotoGuide;
