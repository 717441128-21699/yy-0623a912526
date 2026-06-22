import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { Customer, PROJECT_TYPE_MAP } from '@/types';
import { formatDate, formatTime } from '@/utils';

const STORAGE_KEY = 'clinic_photo_archive_data_v1';
const SHARE_TOKEN_KEY = 'clinic_share_tokens_v1';

const SharePage: React.FC = () => {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const projectConfig = useMemo(() => {
    if (!customer) return null;
    return PROJECT_TYPE_MAP[customer.projectType];
  }, [customer]);

  const archivedPhotos = useMemo(() => {
    if (!customer) return [];
    return customer.photos.filter(p => p.status === 'completed');
  }, [customer]);

  const validateShareToken = useCallback((customerId: string, token: string): { valid: boolean; reason?: string } => {
    if (!customerId || !token) {
      return { valid: false, reason: '链接参数不完整' };
    }

    try {
      const tokens = Taro.getStorageSync(SHARE_TOKEN_KEY) || {};
      const tokenRecord = tokens[customerId];

      if (!tokenRecord) {
        return { valid: false, reason: '该分享链接不存在或已被撤销' };
      }

      if (tokenRecord.token !== token) {
        return { valid: false, reason: '分享令牌无效' };
      }

      const expireTime = new Date(tokenRecord.expireAt);
      if (new Date() > expireTime) {
        return { valid: false, reason: '分享链接已过期，请联系门店获取新链接' };
      }

      return { valid: true };
    } catch (e) {
      console.error('[SharePage] Token校验异常:', e);
      return { valid: false, reason: '校验失败，请稍后重试' };
    }
  }, []);

  const loadCustomer = useCallback((customerId: string): Customer | null => {
    try {
      const customers: Customer[] = Taro.getStorageSync(STORAGE_KEY) || [];
      const found = customers.find(c => c.id === customerId);
      if (!found) {
        setError('未找到对应客户的对比数据');
        return null;
      }

      if (!found.hasPortraitAuth) {
        setError('该客户未签署肖像授权，无法查看');
        return null;
      }

      if (found.status !== 'completed') {
        setError('该客户照片尚未完成归档');
        return null;
      }

      return found;
    } catch (e) {
      console.error('[SharePage] 加载客户数据失败:', e);
      setError('加载数据失败，请稍后重试');
      return null;
    }
  }, []);

  useEffect(() => {
    const customerId = router.params.customerId;
    const token = router.params.token;

    console.log('[SharePage] URL参数:', { customerId, token, hasToken: !!token });

    if (!customerId || !token) {
      setError('链接无效，请扫描正确的二维码');
      setLoading(false);
      return;
    }

    const validation = validateShareToken(customerId, token);
    if (!validation.valid) {
      setError(validation.reason || '链接无效或已过期');
      setLoading(false);
      return;
    }

    setTokenValid(true);

    setTimeout(() => {
      const found = loadCustomer(customerId);
      if (found) {
        setCustomer(found);
      }
      setLoading(false);
    }, 300);
  }, [router.params, validateShareToken, loadCustomer]);

  const handleViewPhoto = useCallback((photoUrl: string) => {
    const urls = archivedPhotos.map(p => p.url);
    Taro.previewImage({ urls, current: photoUrl });
  }, [archivedPhotos]);

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
          {error || '该链接无效或已过期，请联系门店获取最新的对比查看链接'}
        </Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>私密对比页</Text>
        <Text className={styles.headerDesc}>仅您本人可见，请妥善保管</Text>
        <View className={styles.privacyBadge}>
          <Text>🔐 已签署肖像授权 · 仅本人查看</Text>
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
              {projectConfig.name} · {customer.projectName}
            </Text>
            <Text className={styles.customerNode}>
              疗程节点：{customer.treatmentNode}
            </Text>
            {customer.completedAt && (
              <Text className={styles.customerNode}>
                归档时间：{formatDate(customer.completedAt)} {formatTime(customer.completedAt)}
              </Text>
            )}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📸</Text>
            已归档对比照片 ({archivedPhotos.length})
          </Text>
          {archivedPhotos.length > 0 ? (
            <View className={styles.photoGrid}>
              {archivedPhotos.map(photo => (
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
                        {formatDate(photo.capturedAt)}
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
              <Text className={styles.emptyText}>暂无归档照片</Text>
            </View>
          )}
        </View>

        <View className={styles.footer}>
          <Text className={styles.footerText}>
            本页面内容仅用于您本人查看，请勿转发分享
          </Text>
          <Text className={styles.watermark}>
            {customer.name} · {new Date().toLocaleDateString('zh-CN')} · 私密档案
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SharePage;
