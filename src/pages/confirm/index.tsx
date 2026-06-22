import React, { useMemo, useCallback } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useCustomer } from '@/store/CustomerContext';
import StatusTag from '@/components/StatusTag';
import { PROJECT_TYPE_MAP } from '@/types';
import { showToast, showModal } from '@/utils';

const ConfirmPage: React.FC = () => {
  const {
    currentCustomer,
    confirmPhoto,
    updateCustomerPhoto,
    updateCustomerStatus
  } = useCustomer();

  const projectConfig = useMemo(() => {
    if (!currentCustomer) return null;
    return PROJECT_TYPE_MAP[currentCustomer.projectType];
  }, [currentCustomer]);

  const photosToConfirm = useMemo(() => {
    if (!currentCustomer) return [];
    return currentCustomer.photos.filter(p => p.status !== 'pending');
  }, [currentCustomer]);

  const confirmedCount = useMemo(() => {
    return photosToConfirm.filter(p => p.status === 'confirmed' || p.status === 'completed').length;
  }, [photosToConfirm]);

  const allConfirmed = useMemo(() => {
    return photosToConfirm.length > 0 && confirmedCount === photosToConfirm.length;
  }, [photosToConfirm, confirmedCount]);

  const handleConfirm = useCallback((photoId: string) => {
    if (!currentCustomer) return;
    confirmPhoto(currentCustomer.id, photoId);
    console.log('[ConfirmPage] 确认照片', photoId);
  }, [currentCustomer, confirmPhoto]);

  const handleRetake = useCallback(async (photoId: string, position: string) => {
    if (!currentCustomer) return;

    const confirmed = await showModal(`确定要重拍"${position}"吗？`, '重拍确认');
    if (!confirmed) return;

    try {
      console.log('[ConfirmPage] 重拍照片:', position);
      
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        camera: 'back',
        sizeType: ['compressed']
      });

      if (res.tempFiles && res.tempFiles.length > 0) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        updateCustomerPhoto(currentCustomer.id, photoId, {
          url: tempFilePath,
          status: 'captured',
          capturedAt: new Date().toISOString(),
          confirmedAt: undefined
        });
        showToast('重拍成功', 'success');
        console.log('[ConfirmPage] 重拍成功');
      }
    } catch (error) {
      console.error('[ConfirmPage] 重拍失败:', error);
      if ((error as any).errMsg !== 'chooseMedia:fail cancel') {
        showToast('重拍失败，请重试');
      }
    }
  }, [currentCustomer, updateCustomerPhoto]);

  const handleViewPhoto = useCallback((photoUrl: string) => {
    Taro.previewImage({
      urls: [photoUrl],
      current: photoUrl
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentCustomer) return;

    const unconfirmed = photosToConfirm.filter(p => p.status === 'captured');
    if (unconfirmed.length > 0) {
      const confirmed = await showModal(
        `还有 ${unconfirmed.length} 张照片未确认，是否先确认这些照片？`,
        '确认提示'
      );
      if (confirmed) {
        unconfirmed.forEach(photo => {
          confirmPhoto(currentCustomer.id, photo.id);
        });
      } else {
        return;
      }
    }

    const confirmed = await showModal(
      '所有照片将自动归入"首次治疗"疗程节点，是否确认？',
      '完成确认'
    );
    if (!confirmed) return;

    updateCustomerStatus(currentCustomer.id, 'completed');
    showToast('照片已归档', 'success');
    console.log('[ConfirmPage] 照片已归档', currentCustomer.name);

    setTimeout(() => {
      Taro.switchTab({ url: '/pages/compare/index' });
    }, 800);
  }, [currentCustomer, photosToConfirm, confirmPhoto, updateCustomerStatus]);

  const handleGoCapture = () => {
    Taro.switchTab({ url: '/pages/capture/index' });
  };

  const handleGoToday = () => {
    Taro.switchTab({ url: '/pages/today/index' });
  };

  if (!currentCustomer || !projectConfig) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>👁️</Text>
          <Text className={styles.emptyTitle}>请先选择客户</Text>
          <Text className={styles.emptyDesc}>
            在"今日到店"页面选择客户，完成拍摄后在此确认照片清晰度
          </Text>
          <Button className={styles.emptyBtn} onClick={handleGoToday}>
            <Text>去选择客户</Text>
          </Button>
        </View>
      </View>
    );
  }

  if (photosToConfirm.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📷</Text>
          <Text className={styles.emptyTitle}>暂无待确认照片</Text>
          <Text className={styles.emptyDesc}>
            请先完成照片拍摄，拍摄完成后客户可在此确认照片清晰度
          </Text>
          <Button className={styles.emptyBtn} onClick={handleGoCapture}>
            <Text>去拍摄</Text>
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
            <Text className={styles.customerProject}>
              {projectConfig.name} · {currentCustomer.projectName} · {currentCustomer.treatmentNode}
            </Text>
          </View>
        </View>

        <View className={styles.tipsBanner}>
          <Text className={styles.tipsTitle}>📢 请客户亲自确认</Text>
          <Text className={styles.tipsDesc}>
            请仔细检查每张照片是否清晰、角度是否正确。如有问题请点击"重拍"，确认无误请点击"确认清晰"。
          </Text>
        </View>

        <Text className={styles.sectionTitle}>待确认照片 ({photosToConfirm.length})</Text>

        <ScrollView scrollY showScrollbar={false}>
          <View className={styles.photoGrid}>
            {photosToConfirm.map(photo => (
              <View key={photo.id} className={styles.photoCard}>
                <View className={styles.imageWrapper}>
                  <Image
                    className={styles.photoImage}
                    src={photo.url}
                    mode="aspectFill"
                    onClick={() => handleViewPhoto(photo.url)}
                    onError={(e) => {
                      console.error('[ConfirmPage] 图片加载失败', e.detail);
                    }}
                  />
                  <View className={styles.positionBadge}>
                    <Text className={styles.positionText}>{photo.position}</Text>
                  </View>
                  <View className={styles.statusBadge}>
                    <StatusTag type="photo" status={photo.status} size="sm" />
                  </View>
                  {(photo.status === 'confirmed' || photo.status === 'completed') && (
                    <View className={styles.confirmedOverlay}>
                      <View className={styles.checkMark}>
                        <Text className={styles.checkMarkText}>✓</Text>
                      </View>
                    </View>
                  )}
                </View>
                <View className={styles.photoInfo}>
                  {photo.capturedAt && (
                    <Text className={styles.photoTime}>
                      拍摄时间：{new Date(photo.capturedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                  {photo.status === 'captured' && (
                    <View className={styles.photoActions}>
                      <Button
                        className={classnames(styles.actionBtn, styles.retakeBtn)}
                        onClick={() => handleRetake(photo.id, photo.position)}
                      >
                        <Text>重拍</Text>
                      </Button>
                      <Button
                        className={classnames(styles.actionBtn, styles.confirmBtn)}
                        onClick={() => handleConfirm(photo.id)}
                      >
                        <Text>确认清晰</Text>
                      </Button>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.progressInfo}>
          <Text className={styles.progressText}>
            已确认 {confirmedCount} / {photosToConfirm.length} 张
          </Text>
        </View>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!allConfirmed}
        >
          <Text>全部确认并归档</Text>
        </Button>
      </View>
    </View>
  );
};

export default ConfirmPage;
