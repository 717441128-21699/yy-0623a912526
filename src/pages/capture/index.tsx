import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCustomer } from '@/store/CustomerContext';
import PhotoGuide from '@/components/PhotoGuide';
import { captureGuides } from '@/data/mockData';
import { PROJECT_TYPE_MAP } from '@/types';
import { showToast, savePhotoFile } from '@/utils';

const CapturePage: React.FC = () => {
  const { currentCustomer, updateCustomerPhoto, updateCustomerStatus, addPhoto } = useCustomer();
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);

  const projectConfig = useMemo(() => {
    if (!currentCustomer) return null;
    return PROJECT_TYPE_MAP[currentCustomer.projectType];
  }, [currentCustomer]);

  const guide = useMemo(() => {
    if (!currentCustomer) return null;
    return captureGuides[currentCustomer.projectType];
  }, [currentCustomer]);

  const positionsWithStatus = useMemo(() => {
    if (!guide || !currentCustomer) return [];
    return guide.positions.map((pos, index) => {
      const photo = currentCustomer.photos.find(p => p.position === pos.name);
      return {
        ...pos,
        status: photo ? photo.status : 'pending',
        photo
      };
    });
  }, [guide, currentCustomer]);

  const currentPosition = useMemo(() => {
    return positionsWithStatus[currentPositionIndex];
  }, [positionsWithStatus, currentPositionIndex]);

  const progress = useMemo(() => {
    const completed = positionsWithStatus.filter(p => p.status === 'confirmed' || p.status === 'completed').length;
    return { completed, total: positionsWithStatus.length };
  }, [positionsWithStatus]);

  useEffect(() => {
    if (currentCustomer) {
      console.log('[CapturePage] 当前客户:', currentCustomer.name);
    }
  }, [currentCustomer]);

  const handlePrev = useCallback(() => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(prev => prev - 1);
      console.log('[CapturePage] 上一个机位');
    }
  }, [currentPositionIndex]);

  const handleNext = useCallback(() => {
    if (currentPositionIndex < positionsWithStatus.length - 1) {
      setCurrentPositionIndex(prev => prev + 1);
      console.log('[CapturePage] 下一个机位');
    } else {
      const allCompleted = positionsWithStatus.every(p => p.status === 'confirmed' || p.status === 'completed');
      if (allCompleted) {
        updateCustomerStatus(currentCustomer!.id, 'confirming');
        Taro.switchTab({ url: '/pages/confirm/index' });
        showToast('所有机位拍摄完成', 'success');
      } else {
        showToast('请完成所有机位的拍摄');
      }
    }
  }, [currentPositionIndex, positionsWithStatus, currentCustomer, updateCustomerStatus]);

  const handleCapture = useCallback(async () => {
    if (!currentCustomer || !currentPosition) return;

    try {
      console.log('[CapturePage] 开始拍照:', currentPosition.name);
      
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        camera: 'back',
        sizeType: ['compressed']
      });

      if (res.tempFiles && res.tempFiles.length > 0) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        console.log('[CapturePage] 拍照成功:', tempFilePath);

        const savedFilePath = await savePhotoFile(tempFilePath);
        console.log('[CapturePage] 照片已持久化:', savedFilePath);

        const existingPhoto = currentPosition.photo;
        if (existingPhoto) {
          updateCustomerPhoto(currentCustomer.id, existingPhoto.id, {
            url: savedFilePath,
            status: 'captured',
            capturedAt: new Date().toISOString()
          });
        } else {
          addPhoto(currentCustomer.id, currentPosition.name, savedFilePath);
        }

        showToast('拍摄成功', 'success');

        if (currentPositionIndex < positionsWithStatus.length - 1) {
          setTimeout(() => {
            setCurrentPositionIndex(prev => prev + 1);
          }, 500);
        } else {
          updateCustomerStatus(currentCustomer.id, 'confirming');
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/confirm/index' });
          }, 800);
        }
      }
    } catch (error) {
      console.error('[CapturePage] 拍照失败:', error);
      if ((error as any).errMsg !== 'chooseMedia:fail cancel') {
        showToast('拍照失败，请重试');
      }
    }
  }, [currentCustomer, currentPosition, currentPositionIndex, positionsWithStatus.length, updateCustomerPhoto, addPhoto, updateCustomerStatus]);

  const handleSelectCustomer = () => {
    Taro.switchTab({ url: '/pages/today/index' });
  };

  if (!currentCustomer || !guide || !projectConfig) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📷</Text>
          <Text className={styles.emptyTitle}>请先选择客户</Text>
          <Text className={styles.emptyDesc}>
            在"今日到店"页面选择需要拍摄的客户，一键进入拍照流程
          </Text>
          <Button className={styles.emptyBtn} onClick={handleSelectCustomer}>
            <Text>去选择客户</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.customerCard}>
          <View className={styles.customerAvatar}>
            <Text className={styles.customerAvatarText}>{currentCustomer.name.charAt(0)}</Text>
          </View>
          <View className={styles.customerInfo}>
            <Text className={styles.customerName}>{currentCustomer.name}</Text>
            <View className={styles.customerProject}>
              <View
                className={styles.projectTag}
                style={{ backgroundColor: `${projectConfig.color}15`, color: projectConfig.color }}
              >
                <Text>{projectConfig.name}</Text>
              </View>
              <Text className={styles.projectName}>{currentCustomer.projectName}</Text>
            </View>
            <Text className={styles.treatmentNode}>疗程节点：{currentCustomer.treatmentNode}</Text>
          </View>
        </View>

        <View className={styles.positionNav}>
          <Text className={styles.positionNavTitle}>机位列表</Text>
          <ScrollView className={styles.positionScroll} scrollX showScrollbar={false}>
            {positionsWithStatus.map((pos, index) => (
              <View
                key={pos.name}
                className={classnames(styles.positionItem, {
                  [styles.completed]: pos.status === 'confirmed' || pos.status === 'completed',
                  [styles.current]: index === currentPositionIndex,
                  [styles.pending]: pos.status === 'pending' && index !== currentPositionIndex
                })}
                onClick={() => setCurrentPositionIndex(index)}
              >
                {(pos.status === 'confirmed' || pos.status === 'completed') && (
                  <Text className={styles.checkIcon}>✓</Text>
                )}
                <Text className={styles.positionItemText}>{pos.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.guideSection}>
          {currentPosition && (
            <PhotoGuide
              positionName={currentPosition.name}
              description={currentPosition.description}
              exampleUrl={currentPosition.example}
            />
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={styles.navBtn}
          onClick={handlePrev}
          disabled={currentPositionIndex === 0}
        >
          <Text>‹</Text>
        </Button>
        <View style={{ flex: 1 }}>
          <Button className={styles.captureBtn} onClick={handleCapture}>
            <Text>📷 拍照</Text>
          </Button>
          <Text className={styles.progressText}>
            {progress.completed} / {progress.total} 已完成
          </Text>
        </View>
        <Button
          className={styles.navBtn}
          onClick={handleNext}
        >
          <Text>›</Text>
        </Button>
      </View>
    </View>
  );
};

export default CapturePage;
