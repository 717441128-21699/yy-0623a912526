import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { PROJECT_TYPE_MAP } from '@/types';
import { formatDate, formatTime, decodeSharePayload } from '@/utils';

interface DecodedPhoto {
  pos: string;
  url: string;
  cat: string;
  at: string;
}

interface DecodedData {
  cid: string;
  n: string;
  pt: string;
  pn: string;
  tn: string;
  ca: string;
  auth: boolean;
  expireAt: string;
  photos: DecodedPhoto[];
}

const SharePage: React.FC = () => {
  const router = useRouter();
  const [decodedData, setDecodedData] = useState<DecodedData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const projectConfig = useMemo(() => {
    if (!decodedData) return null;
    return PROJECT_TYPE_MAP[decodedData.pt as keyof typeof PROJECT_TYPE_MAP];
  }, [decodedData]);

  useEffect(() => {
    const payload = router.params.payload;

    if (!payload) {
      setError('链接无效，请扫描正确的二维码');
      setLoading(false);
      return;
    }

    const data = decodeSharePayload(payload);

    if (!data) {
      setError('链接无效或已过期，请联系门店获取新的对比链接');
      setLoading(false);
      return;
    }

    if (!data.auth) {
      setError('该客户未签署肖像授权，无法查看');
      setLoading(false);
      return;
    }

    if (!data.photos || data.photos.length === 0) {
      setError('该客户暂无已归档的照片');
      setLoading(false);
      return;
    }

    setDecodedData(data);
    setLoading(false);
  }, [router.params]);

  const handleViewPhoto = useCallback((photoUrl: string) => {
    const urls = decodedData?.photos.map(p => p.url) || [];
    if (urls.length > 0) {
      Taro.previewImage({ urls, current: photoUrl });
    }
  }, [decodedData]);

  if (loading) {
    return (
      <View className={styles.errorState}>
        <Text className={styles.errorIcon}>⏳</Text>
        <Text className={styles.errorTitle}>加载中...</Text>
      </View>
    );
  }

  if (error || !decodedData || !projectConfig) {
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
            <Text className={styles.customerAvatarText}>{decodedData.n.charAt(0)}</Text>
          </View>
          <View className={styles.customerInfo}>
            <Text className={styles.customerName}>{decodedData.n}</Text>
            <Text className={styles.customerProject}>
              {projectConfig.name} · {decodedData.pn}
            </Text>
            <Text className={styles.customerNode}>
              疗程节点：{decodedData.tn}
            </Text>
            {decodedData.ca && (
              <Text className={styles.customerNode}>
                归档时间：{formatDate(decodedData.ca)} {formatTime(decodedData.ca)}
              </Text>
            )}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📸</Text>
            已归档对比照片 ({decodedData.photos.length})
          </Text>
          {decodedData.photos.length > 0 ? (
            <View className={styles.photoGrid}>
              {decodedData.photos.map((photo, idx) => (
                <View
                  key={`${photo.pos}_${idx}`}
                  className={styles.photoItem}
                  onClick={() => handleViewPhoto(photo.url)}
                >
                  <Image
                    className={styles.photoImage}
                    src={photo.url}
                    mode="aspectFill"
                  />
                  {photo.cat && (
                    <View className={styles.photoTime}>
                      <Text>
                        {formatDate(photo.cat)}
                      </Text>
                    </View>
                  )}
                  <View className={styles.photoLabel}>
                    <Text className={styles.photoLabelText}>{photo.pos}</Text>
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
            {decodedData.n} · {new Date().toLocaleDateString('zh-CN')} · 私密档案
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SharePage;
