import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCustomer } from '@/store/CustomerContext';
import CustomerCard from '@/components/CustomerCard';
import { CustomerStatus } from '@/types';
import { getTodayDate, getWeekDay } from '@/data/mockData';
import { debounce, showToast } from '@/utils';

type FilterType = 'all' | CustomerStatus;

const TodayPage: React.FC = () => {
  const { customers, searchCustomers, setCurrentCustomer, updateCustomerStatus } = useCustomer();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      waiting: customers.filter(c => c.status === 'waiting').length,
      photographing: customers.filter(c => c.status === 'photographing').length,
      completed: customers.filter(c => c.status === 'completed').length
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let result = searchKeyword ? searchCustomers(searchKeyword) : customers;
    if (filterType !== 'all') {
      result = result.filter(c => c.status === filterType);
    }
    return result.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
  }, [customers, searchKeyword, filterType, searchCustomers]);

  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchKeyword(value);
      console.log('[TodayPage] 搜索', value);
    }, 300),
    []
  );

  const handleStartCapture = useCallback((customer) => {
    setCurrentCustomer(customer);
    updateCustomerStatus(customer.id, 'photographing');
    Taro.switchTab({ url: '/pages/capture/index' });
    console.log('[TodayPage] 开始拍摄', customer.name);
  }, [setCurrentCustomer, updateCustomerStatus]);

  const handleViewDetail = useCallback((customer) => {
    setCurrentCustomer(customer);
    showToast(`查看 ${customer.name} 的详情`);
    console.log('[TodayPage] 查看详情', customer.name);
  }, [setCurrentCustomer]);

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    console.log('[TodayPage] 下拉刷新');
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'waiting', label: '等待拍摄' },
    { value: 'photographing', label: '拍摄中' },
    { value: 'confirming', label: '确认中' },
    { value: 'completed', label: '已完成' },
    { value: 'pending_info', label: '待补资料' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.dateSection}>
          <Text className={styles.dateText}>{getTodayDate()}</Text>
          <Text className={styles.weekText}>{getWeekDay()}</Text>
        </View>
        <View className={styles.statsGrid}>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{stats.total}</Text>
            <Text className={styles.statLabel}>今日预约</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{stats.waiting}</Text>
            <Text className={styles.statLabel}>待拍摄</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{stats.photographing}</Text>
            <Text className={styles.statLabel}>拍摄中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索姓名/电话/昵称"
            placeholderClass={styles.searchInput}
            onInput={(e) => handleSearch(e.detail.value)}
            confirmType="search"
          />
        </View>

        <ScrollView className={styles.filterTags} scrollX showScrollbar={false}>
          {filterOptions.map(option => (
            <View
              key={option.value}
              className={classnames(styles.filterTag, {
                [styles.active]: filterType === option.value
              })}
              onClick={() => setFilterType(option.value)}
            >
              <Text className={styles.filterTagText}>{option.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.listSection}>
        {isRefreshing && (
          <View className={styles.refreshHint}>
            <Text>刷新中...</Text>
          </View>
        )}

        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onStartCapture={() => handleStartCapture(customer)}
              onViewDetail={() => handleViewDetail(customer)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>
              {searchKeyword ? '未找到匹配的客户' : '暂无预约客户'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TodayPage;
