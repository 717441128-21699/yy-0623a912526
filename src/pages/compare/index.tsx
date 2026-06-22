import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCustomer } from '@/store/CustomerContext';
import { PROJECT_TYPE_MAP } from '@/types';
import { getQrCodeUrl, showToast } from '@/utils';

const ComparePage: React.FC = () => {
  const { customers, setCurrentCustomer, currentCustomer } = useCustomer();
  const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
  const [selectedTreatment, setSelectedTreatment] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);

  const completedCustomers = useMemo(() => {
    return customers.filter(c => c.status === 'completed');
  }, [customers]);

  const projectConfig = useMemo(() => {
    if (!selectedCustomer) return null;
    return PROJECT_TYPE_MAP[selectedCustomer.projectType];
  }, [selectedCustomer]);

  const treatmentNodes = useMemo(() => {
    if (!selectedCustomer) return [];
    const nodes = new Set<string>();
    nodes.add(selectedCustomer.treatmentNode);
    return Array.from(nodes);
  }, [selectedCustomer]);

  const filteredPhotos = useMemo(() => {
    if (!selectedCustomer) return [];
    return selectedCustomer.photos.filter(p => 
      p.status === 'confirmed' || p.status === 'completed'
    );
  }, [selectedCustomer]);

  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setCurrentCustomer(customer);
    setSelectedTreatment(customer.treatmentNode);
    console.log('[ComparePage] 选择客户', customer.name);
  }, [setCurrentCustomer]);

  const handleViewPhoto = useCallback((photoUrl) => {
    Taro.previewImage({
      urls: filteredPhotos.map(p => p.url),
      current: photoUrl
    });
  }, [filteredPhotos]);

  const handleGenerateQr = useCallback(() => {
    if (!selectedCustomer) return;
    if (!selectedCustomer.hasPortraitAuth) {
      showToast('未签署肖像授权，不可生成分享链接');
      return;
    }
    setShowQrModal(true);
    console.log('[ComparePage] 生成对比二维码', selectedCustomer.name);
  }, [selectedCustomer]);

  const handleCloseQrModal = useCallback(() => {
    setShowQrModal(false);
  }, []);

  const handleSaveQr = useCallback(() => {
    showToast('二维码已保存', 'success');
    setShowQrModal(false);
  }, []);

  const qrCodeUrl = useMemo(() => {
    if (!selectedCustomer) return '';
    return getQrCodeUrl(selectedCustomer.id);
  }, [selectedCustomer]);

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.customerSection}>
          <Text className={styles.sectionTitle}>已完成客户</Text>
          {completedCustomers.length > 0 ? (
            <>
              <ScrollView className={styles.customerScroll} scrollX showScrollbar={false}>
                {completedCustomers.map(customer => (
                  <View
                    key={customer.id}
                    className={classnames(styles.customerItem, {
                      [styles.active]: selectedCustomer?.id === customer.id
                    })}
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <View className={styles.customerAvatar}>
                      <Text className={styles.customerAvatarText}>{customer.name.charAt(0)}</Text>
                    </View>
                    <View className={styles.customerInfo}>
                      <Text className={styles.customerName}>{customer.name}</Text>
                      <Text className={styles.customerProject}>{customer.projectName}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>

        {selectedCustomer && projectConfig ? (
          <>
            <View className={styles.selectedCustomer}>
              <View className={styles.selectedHeader}>
                <View className={styles.selectedAvatar}>
                  <Text className={styles.selectedAvatarText}>{selectedCustomer.name.charAt(0)}</Text>
                </View>
                <View className={styles.selectedInfo}>
                  <Text className={styles.selectedName}>{selectedCustomer.name}</Text>
                  <Text className={styles.selectedDetail}>
                    {projectConfig.name} · {selectedCustomer.projectName}
                  </Text>
                  <Text className={styles.selectedDetail}>
                    疗程节点：{selectedCustomer.treatmentNode}
                  </Text>
                </View>
              </View>
              {!selectedCustomer.hasPortraitAuth && (
                <View className={styles.warningBanner}>
                  <Text className={styles.warningIcon}>⚠️</Text>
                  <Text className={styles.warningText}>
                    未签署肖像授权，照片仅供内部查看，不可外发
                  </Text>
                </View>
              )}
            </View>

            {treatmentNodes.length > 1 && (
              <ScrollView className={styles.treatmentTabs} scrollX showScrollbar={false}>
                {treatmentNodes.map(node => (
                  <View
                    key={node}
                    className={classnames(styles.treatmentTab, {
                      [styles.active]: selectedTreatment === node
                    })}
                    onClick={() => setSelectedTreatment(node)}
                  >
                    <Text className={styles.treatmentTabText}>{node}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text className={styles.sectionTitle}>
              已归档照片 ({filteredPhotos.length})
            </Text>

            <View className={styles.photoGrid}>
              {filteredPhotos.map(photo => (
                <View
                  key={photo.id}
                  className={styles.photoItem}
                  onClick={() => handleViewPhoto(photo.url)}
                >
                  <Image
                    className={styles.photoImage}
                    src={photo.url}
                    mode="aspectFill"
                    onError={(e) => {
                      console.error('[ComparePage] 图片加载失败', e.detail);
                    }}
                  />
                  <View className={styles.photoLabel}>
                    <Text className={styles.photoLabelText}>{photo.position}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyTitle}>暂无已完成的客户</Text>
            <Text className={styles.emptyDesc}>
              客户完成拍摄和确认后，可在此查看归档照片并生成对比预览
            </Text>
          </View>
        )}
      </View>

      {selectedCustomer && filteredPhotos.length > 0 && (
        <View className={styles.bottomBar}>
          <Button
            className={styles.generateBtn}
            onClick={handleGenerateQr}
            disabled={!selectedCustomer.hasPortraitAuth}
          >
            <Text>🔗 生成私密对比页</Text>
          </Button>
        </View>
      )}

      {showQrModal && selectedCustomer && (
        <View className={styles.qrModal} onClick={handleCloseQrModal}>
          <View className={styles.qrContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.qrTitle}>私密对比页</Text>
            <Text className={styles.qrSubtitle}>
              客户扫码可查看自己的治疗对比照片
            </Text>
            <View className={styles.qrCodeWrapper}>
              <Image
                className={styles.qrCode}
                src={qrCodeUrl}
                mode="aspectFit"
                onError={(e) => {
                  console.error('[ComparePage] 二维码加载失败', e.detail);
                }}
              />
            </View>
            <View className={styles.qrLink}>
              <Text className={styles.qrLinkText}>
                https://example.com/compare/{selectedCustomer.id}
              </Text>
            </View>
            <Button className={styles.closeBtn} onClick={handleCloseQrModal}>
              <Text>关闭</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ComparePage;
