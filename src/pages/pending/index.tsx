import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCustomer } from '@/store/CustomerContext';
import { PROJECT_TYPE_MAP, Customer } from '@/types';
import { showToast, showModal, maskPhone } from '@/utils';

interface MissingItem {
  type: 'photos' | 'nickname' | 'consultant' | 'portraitAuth';
  text: string;
}

const PendingPage: React.FC = () => {
  const { customers, updateCustomerInfo, updateCustomerStatus, setCurrentCustomer } = useCustomer();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editConsultant, setEditConsultant] = useState('');

  const pendingCustomers = useMemo(() => {
    return customers.filter(customer => {
      const hasMissingPhotos = customer.photos.some(p => p.status === 'pending');
      const missingNickname = !customer.nickname;
      const missingConsultant = !customer.consultant;
      const missingPortraitAuth = !customer.hasPortraitAuth;
      return hasMissingPhotos || missingNickname || missingConsultant || missingPortraitAuth;
    }).sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
  }, [customers]);

  const stats = useMemo(() => {
    const missingPhotos = pendingCustomers.filter(c => c.photos.some(p => p.status === 'pending')).length;
    const missingInfo = pendingCustomers.filter(c => !c.nickname || !c.consultant).length;
    const missingAuth = pendingCustomers.filter(c => !c.hasPortraitAuth).length;
    return {
      total: pendingCustomers.length,
      missingPhotos,
      missingInfo,
      missingAuth
    };
  }, [pendingCustomers]);

  const getMissingItems = useCallback((customer: Customer): MissingItem[] => {
    const items: MissingItem[] = [];
    const pendingCount = customer.photos.filter(p => p.status === 'pending').length;
    if (pendingCount > 0) {
      items.push({ type: 'photos', text: `缺 ${pendingCount} 张照片` });
    }
    if (!customer.nickname) {
      items.push({ type: 'nickname', text: '缺客户昵称' });
    }
    if (!customer.consultant) {
      items.push({ type: 'consultant', text: '缺咨询师' });
    }
    if (!customer.hasPortraitAuth) {
      items.push({ type: 'portraitAuth', text: '缺肖像授权' });
    }
    return items;
  }, []);

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    console.log('[PendingPage] 下拉刷新');
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const handleEditInfo = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setEditNickname(customer.nickname || '');
    setEditConsultant(customer.consultant || '');
    setShowEditModal(true);
    console.log('[PendingPage] 编辑客户信息', customer.name);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingCustomer) return;

    const updates: Partial<Customer> = {};
    if (editNickname.trim()) {
      updates.nickname = editNickname.trim();
    }
    if (editConsultant.trim()) {
      updates.consultant = editConsultant.trim();
    }

    if (Object.keys(updates).length === 0) {
      showToast('请填写至少一项信息');
      return;
    }

    updateCustomerInfo(editingCustomer.id, updates);
    showToast('信息已保存', 'success');
    setShowEditModal(false);
    setEditingCustomer(null);
    console.log('[PendingPage] 保存客户信息', editingCustomer.name, updates);
  }, [editingCustomer, editNickname, editConsultant, updateCustomerInfo]);

  const handleCancelEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setEditNickname('');
    setEditConsultant('');
  }, []);

  const handleRemind = useCallback(async (customer: Customer) => {
    const missing = getMissingItems(customer);
    const missingText = missing.map(m => m.text).join('、');
    
    const confirmed = await showModal(
      `将提醒 ${customer.name} 补全以下资料：\n${missingText}`,
      '离店前提醒'
    );
    
    if (confirmed) {
      showToast('已发送提醒', 'success');
      console.log('[PendingPage] 发送提醒', customer.name);
    }
  }, [getMissingItems]);

  const handleGoCapture = useCallback((customer: Customer) => {
    setCurrentCustomer(customer);
    updateCustomerStatus(customer.id, 'photographing');
    Taro.switchTab({ url: '/pages/capture/index' });
    console.log('[PendingPage] 跳转补拍', customer.name);
  }, [setCurrentCustomer, updateCustomerStatus]);

  const handleSignAuth = useCallback(async (customer: Customer) => {
    const confirmed = await showModal(
      '请确认客户已签署肖像授权书',
      '肖像授权确认'
    );
    
    if (confirmed) {
      updateCustomerInfo(customer.id, { hasPortraitAuth: true });
      showToast('已记录肖像授权', 'success');
      console.log('[PendingPage] 签署肖像授权', customer.name);
    }
  }, [updateCustomerInfo]);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>待补资料 ({stats.total})</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{stats.missingPhotos}</Text>
            <Text className={styles.statLabel}>待补拍</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{stats.missingInfo}</Text>
            <Text className={styles.statLabel}>缺信息</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{stats.missingAuth}</Text>
            <Text className={styles.statLabel}>缺授权</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {isRefreshing && (
          <View className={styles.refreshHint}>
            <Text>刷新中...</Text>
          </View>
        )}

        {pendingCustomers.length > 0 ? (
          <>
            <Text className={styles.sectionTitle}>待处理客户 ({pendingCustomers.length})</Text>
            {pendingCustomers.map(customer => {
              const projectConfig = PROJECT_TYPE_MAP[customer.projectType];
              const missingItems = getMissingItems(customer);
              const needsPhotos = missingItems.some(m => m.type === 'photos');
              const needsInfo = missingItems.some(m => m.type === 'nickname' || m.type === 'consultant');
              const needsAuth = missingItems.some(m => m.type === 'portraitAuth');

              return (
                <View key={customer.id} className={styles.customerCard}>
                  <View className={styles.cardHeader}>
                    <View className={styles.customerAvatar}>
                      <Text className={styles.customerAvatarText}>{customer.name.charAt(0)}</Text>
                    </View>
                    <View className={styles.customerInfo}>
                      <Text className={styles.customerName}>
                        {customer.name}
                        {customer.nickname && <Text style={{ fontSize: '24rpx', color: '#86909C' }}> ({customer.nickname})</Text>}
                      </Text>
                      <Text className={styles.customerProject}>
                        <Text style={{ color: projectConfig.color }}>{projectConfig.name}</Text>
                        {' · '}{customer.projectName}
                      </Text>
                      <Text className={styles.appointmentTime}>
                        预约时间：{customer.appointmentTime} · {maskPhone(customer.phone)}
                      </Text>
                    </View>
                  </View>

                  <View className={styles.missingSection}>
                    <Text className={styles.missingTitle}>缺少资料：</Text>
                    <View className={styles.missingList}>
                      {missingItems.map((item, index) => (
                        <View key={index} className={styles.missingItem}>
                          <Text className={styles.missingIcon}>⚠️</Text>
                          <Text className={styles.missingText}>{item.text}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {needsAuth && (
                    <View className={styles.warningBanner}>
                      <Text className={styles.warningIcon}>⚠️</Text>
                      <View className={styles.warningContent}>
                        <Text className={styles.warningText}>
                          未签署肖像授权，该客户照片不可外发、不可用于案例分享
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className={styles.actions}>
                    {needsInfo && (
                      <Button
                        className={classnames(styles.actionBtn, styles.primaryBtn)}
                        onClick={() => handleEditInfo(customer)}
                      >
                        <Text>补录信息</Text>
                      </Button>
                    )}
                    {needsPhotos && (
                      <Button
                        className={classnames(styles.actionBtn, styles.warningBtn)}
                        onClick={() => handleGoCapture(customer)}
                      >
                        <Text>去补拍</Text>
                      </Button>
                    )}
                    {needsAuth && (
                      <Button
                        className={classnames(styles.actionBtn, styles.secondaryBtn)}
                        onClick={() => handleSignAuth(customer)}
                      >
                        <Text>签署授权</Text>
                      </Button>
                    )}
                    <Button
                      className={classnames(styles.actionBtn, styles.secondaryBtn)}
                      onClick={() => handleRemind(customer)}
                    >
                      <Text>提醒</Text>
                    </Button>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>✅</Text>
            <Text className={styles.emptyTitle}>所有资料已齐全</Text>
            <Text className={styles.emptyDesc}>
              今日所有客户资料已完成，无需补充
            </Text>
          </View>
        )}
      </View>

      {showEditModal && editingCustomer && (
        <View className={styles.modalOverlay} onClick={handleCancelEdit}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>补录客户信息</Text>
            
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>客户昵称</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入客户昵称"
                value={editNickname}
                onInput={(e) => setEditNickname(e.detail.value)}
                maxlength={20}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>咨询师</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入咨询师姓名"
                value={editConsultant}
                onInput={(e) => setEditConsultant(e.detail.value)}
                maxlength={20}
              />
            </View>

            <View className={styles.modalActions}>
              <Button
                className={classnames(styles.modalBtn, styles.cancelBtn)}
                onClick={handleCancelEdit}
              >
                <Text>取消</Text>
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirmBtn)}
                onClick={handleSaveEdit}
              >
                <Text>保存</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PendingPage;
