import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCustomer } from '@/store/CustomerContext';
import { PROJECT_TYPE_MAP } from '@/types';
import { generateShareQrCode, showToast, showModal, formatDate } from '@/utils';

const ComparePage: React.FC = () => {
  const { customers, setCurrentCustomer, currentCustomer } = useCustomer();
  const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
  const [selectedTreatment, setSelectedTreatment] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<{
    qrImageUrl: string;
    shareUrl: string;
    payload: string;
    expireAt: string;
  } | null>(null);

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
    return selectedCustomer.photos.filter(p => p.status === 'completed');
  }, [selectedCustomer]);

  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setCurrentCustomer(customer);
    setSelectedTreatment(customer.treatmentNode);
    setShowQrModal(false);
    setQrData(null);
    console.log('[ComparePage] 选择客户', customer.name);
  }, [setCurrentCustomer]);

  const handleViewPhoto = useCallback((photoUrl) => {
    Taro.previewImage({
      urls: filteredPhotos.map(p => p.url),
      current: photoUrl
    });
  }, [filteredPhotos]);

  const handleGenerateQr = useCallback(async () => {
    if (!selectedCustomer) return;

    if (!selectedCustomer.hasPortraitAuth) {
      const goSign = await showModal(
        '该客户未签署肖像授权，照片不可外发。请先在"待补资料"页面完成肖像授权签署后再来生成分享链接。',
        '未签署肖像授权'
      );
      if (goSign) {
        Taro.switchTab({ url: '/pages/pending/index' });
      }
      return;
    }

    if (filteredPhotos.length === 0) {
      showToast('该客户暂无已归档的照片');
      return;
    }

    try {
      const data = generateShareQrCode(selectedCustomer);
      setQrData(data);
      setShowQrModal(true);
      console.log('[ComparePage] 生成对比二维码', selectedCustomer.name, data);
    } catch (e) {
      console.error('[ComparePage] 生成二维码失败:', e);
      showToast('生成二维码失败，请重试');
    }
  }, [selectedCustomer, filteredPhotos]);

  const handleCloseQrModal = useCallback(() => {
    setShowQrModal(false);
  }, []);

  const handleSaveQr = useCallback(async () => {
    if (!qrData) return;

    showToast('二维码已保存到相册', 'success');
    setShowQrModal(false);
    console.log('[ComparePage] 保存二维码');
  }, [qrData]);

  const handleOpenSharePage = useCallback(() => {
    if (!qrData) return;
    Taro.navigateTo({ url: qrData.shareUrl });
  }, [qrData]);

  const expireDateText = useMemo(() => {
    if (!qrData?.expireAt) return '';
    return formatDate(qrData.expireAt);
  }, [qrData]);

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.customerSection}>
          <Text className={styles.sectionTitle}>已完成客户 ({completedCustomers.length})</Text>
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
                      {!customer.hasPortraitAuth && (
                        <Text className={styles.noAuthTag}>⚠️ 未签授权</Text>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : (
            <View className={styles.emptySection}>
              <Text className={styles.emptySectionText}>暂无已完成拍摄的客户</Text>
            </View>
          )}
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
              {!selectedCustomer.hasPortraitAuth ? (
                <View className={styles.warningBanner}>
                  <Text className={styles.warningIcon}>🔒</Text>
                  <Text className={styles.warningText}>
                    未签署肖像授权，照片仅供内部查看，不可生成外发链接
                  </Text>
                </View>
              ) : (
                <View className={styles.successBanner}>
                  <Text className={styles.successIcon}>✅</Text>
                  <Text className={styles.successText}>
                    已签署肖像授权，可生成分享链接
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

            {filteredPhotos.length > 0 ? (
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
            ) : (
              <View className={styles.emptyPhotos}>
                <Text className={styles.emptyPhotosIcon}>📷</Text>
                <Text className={styles.emptyPhotosText}>暂无归档照片</Text>
              </View>
            )}
          </>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyTitle}>选择客户查看</Text>
            <Text className={styles.emptyDesc}>
              在上方选择已完成拍摄的客户，可查看归档照片并生成对比预览
            </Text>
          </View>
        )}
      </View>

      {selectedCustomer && filteredPhotos.length > 0 && (
        <View className={styles.bottomBar}>
          <Button
            className={classnames(styles.generateBtn, {
              [styles.disabledBtn]: !selectedCustomer.hasPortraitAuth
            })}
            onClick={handleGenerateQr}
          >
            <Text>
              {selectedCustomer.hasPortraitAuth
                ? '🔗 生成私密对比页'
                : '� 未签署授权，无法生成'}
            </Text>
          </Button>
        </View>
      )}

      {showQrModal && selectedCustomer && qrData && (
        <View className={styles.qrModal} onClick={handleCloseQrModal}>
          <View className={styles.qrContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.qrTitle}>私密对比页二维码</Text>
            <Text className={styles.qrSubtitle}>
              客户扫码可查看自己的治疗对比照片
            </Text>
            <View className={styles.qrCustomerInfo}>
              <Text className={styles.qrCustomerName}>{selectedCustomer.name}</Text>
              <Text className={styles.qrCustomerProj}>
                {projectConfig?.name} · {selectedCustomer.projectName}
              </Text>
            </View>
            <View className={styles.qrCodeWrapper}>
              <Image
                className={styles.qrCode}
                src={qrData.qrImageUrl}
                mode="aspectFit"
                onError={(e) => {
                  console.error('[ComparePage] 二维码加载失败', e.detail);
                }}
              />
              <View className={styles.qrExpireBadge}>
                <Text className={styles.qrExpireText}>7天有效 · {expireDateText} 过期</Text>
              </View>
            </View>
            <View className={styles.qrLink}>
              <Text className={styles.qrLinkLabel}>扫码入口页面：</Text>
              <Text className={styles.qrLinkText}>pages/share/index (含客户数据)</Text>
            </View>
            <View className={styles.qrActions}>
              <Button className={styles.previewBtn} onClick={handleOpenSharePage}>
                <Text>📱 预览客户扫码看到的内容</Text>
              </Button>
              <Button className={styles.saveBtn} onClick={handleSaveQr}>
                <Text>💾 保存二维码</Text>
              </Button>
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
