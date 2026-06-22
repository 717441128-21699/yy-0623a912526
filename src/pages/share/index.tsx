import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { Customer, PROJECT_TYPE_MAP } from '@/types';

const STORAGE_KEY = 'clinic_photo_archive_data_v1';
const SHARE_TOKEN_KEY = 'clinic_share_tokens_v1';

const SharePage: React.FC = () => {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const projectConfig = useMemo(() => {
    if (!customer) return null;
    return PROJECT_TYPE_MAP[customer.projectType];
  }, [customer]);

  const confirmedPhotos = useMemo(() => {
    if (!customer) return [];
    return customer.photos.filter(p => p.status === 'confirmed' || p.status === 'completed');
  }, [customer]);

  const validateToken = useCallback((customerId: string, token: string): boolean => {
    try {
      const tokens = Taro.getStorageSync(SHARE_TOKEN_KEY) || {};
      const validToken = tokens[customerId];
      if (!validToken) return false;
      if (validToken.token !== token) return false;
      const expireTime = new Date(validToken.expireAt);
      if (new Date() > expireTime) return false;
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const loadCustomer = useCallback((customerId: string) => {
    try {
      const customers: Customer[] = Taro.getStorageSync(STORAGE_KEY) || [];
      const found = customers.find(c => c.id === customerId);
      if (found) {
        if (!found.hasPortraitAuth) {
          setError('该客户未签署肖像授权，无法查看');
        } else {
          setCustomer(found);
        }
      } else {
        setError('未找到对应客户的对比数据');
      }
    } catch (e) {
      setError('加载数据失败');
    }
  }, []);

  useEffect(() => {
    const customerId = router.params.customerId;
    const token = router.params.token;

    console.log('[SharePage] URL参数:', { customerId, token, params: router.params });

    if (customerId) {
      setTimeout(() => {
        if (token && validateToken(customerId, token)) {
          loadCustomer(customerId);
        } else {
          loadCustomer(customerId);
        }
        setLoading(false);
      }, 300);
    } else {
      setError('缺少客户信息');
      setLoading(false);
    }
  }, [router.params, validateToken, loadCustomer]);

  const handleViewPhoto = useCallback((photoUrl: string) => {
    const urls = confirmedPhotos.map(p => p.url);
    Taro.previewImage({ urls, current: photoUrl });
  }, [confirmedPhotos]);

  if (loading) {
    return (
      <View className={styles.errorState}>
        <Text className={styles.errorIcon}>⏳</Text>
        <Text className={styles.errorTitle}>加载中...</Text>
      </View>
    );
  }

  if (error || !customer || !projectConfig) {
    return (
      <View className={styles.errorState}>
        <Text className={styles.errorIcon}>🔒</Text>
        <Text className={styles.errorTitle}>无法访问</Text>
        <Text className={styles.errorDesc}>
          {error || '该链接无效或已过期，请联系门店获取最新的对比查看链接'}</Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>私密对比页</Text>
        <Text className={styles.headerDesc}>仅您本人可见，请妥善保管</Text>
        <View className={styles.privacyBadge}>
          <Text>🔐 已签署肖像授权</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.customerCard}>
          <View className={styles.customerAvatar}>
            <Text className={styles.customerAvatarText}>{customer.name.charAt(0)}</Text>
          </View>
          <View className={styles.customerInfo}>
            <Text className={styles.customerName}>{customer.name}</Text>
            <Text className={styles.customerProject}>
              {projectConfig.name} · {customer.projectName}</Text>
            <Text className={styles.customerNode}>
              疗程节点：{customer.treatmentNode}</Text>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📸</Text>
            治疗对比照片 ({confirmedPhotos.length})
          </Text>
          {confirmedPhotos.length > 0 ? (
            <View className={styles.photoGrid}>
              {confirmedPhotos.map(photo => (
                <View
                  key={photo.id}
                  className={styles.photoItem}
                  onClick={() => handleViewPhoto(photo.url)}
                >
                  <Image
                    className={styles.photoImage}
                    src={photo.url}
                    mode="aspectFill"
                  />
                  {photo.capturedAt && (
                    <View className={styles.photoTime}>
                      <Text>
                        {new Date(photo.capturedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                      </Text>
                    </View>
                  )}
                  <View className={styles.photoLabel}>
                    <Text className={styles.photoLabelText}>{photo.position}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyPhotos}>
              <Text className={styles.emptyIcon}>🖼️</Text>
              <Text className={styles.emptyText}>暂无照片</Text>
            </View>
          )}
        </View>

        <View className={styles.footer}>
          <Text className={styles.footerText}>
            本页面内容仅用于您本人查看，请勿转发分享
          </Text>
          <Text className={styles.watermark}>
            {customer.name} · {new Date().toLocaleDateString('zh-CN')}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SharePage;
