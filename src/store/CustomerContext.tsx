import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Customer, PhotoItem } from '@/types';
import { mockCustomers } from '@/data/mockData';
import { generateId, showToast } from '@/utils';

const STORAGE_KEY = 'clinic_photo_archive_data_v1';

interface CustomerContextType {
  customers: Customer[];
  currentCustomer: Customer | null;
  setCurrentCustomer: (customer: Customer | null) => void;
  updateCustomerPhoto: (customerId: string, photoId: string, updates: Partial<PhotoItem>) => void;
  addPhoto: (customerId: string, position: string, url: string) => void;
  confirmPhoto: (customerId: string, photoId: string) => void;
  archiveCustomerPhotos: (customerId: string) => void;
  updateCustomerInfo: (customerId: string, updates: Partial<Customer>) => void;
  updateCustomerStatus: (customerId: string, status: Customer['status']) => void;
  getPendingCustomers: () => Customer[];
  getTodayCustomers: () => Customer[];
  searchCustomers: (keyword: string) => Customer[];
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const loadFromStorage = (): Customer[] => {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      console.log('[CustomerContext] 从本地存储加载数据，共', saved.length, '位客户');
      return saved;
    }
  } catch (e) {
    console.warn('[CustomerContext] 读取本地存储失败，使用初始Mock数据');
  }
  return mockCustomers;
};

const saveToStorage = (data: Customer[]) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, data);
    console.log('[CustomerContext] 已保存到本地存储，共', data.length, '位客户');
  } catch (e) {
    console.error('[CustomerContext] 保存到本地存储失败:', e);
  }
};

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage());
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    saveToStorage(customers);
  }, [customers]);

  useEffect(() => {
    const savedCurrent = Taro.getStorageSync(STORAGE_KEY + '_current');
    if (savedCurrent) {
      const found = customers.find(c => c.id === savedCurrent);
      if (found) {
        setCurrentCustomer(found);
        console.log('[CustomerContext] 恢复当前客户:', found.name);
      }
    }
  }, []);

  useEffect(() => {
    if (currentCustomer) {
      Taro.setStorageSync(STORAGE_KEY + '_current', currentCustomer.id);
    } else {
      Taro.removeStorageSync(STORAGE_KEY + '_current');
    }
  }, [currentCustomer]);

  const updateCustomerPhoto = useCallback((customerId: string, photoId: string, updates: Partial<PhotoItem>) => {
    setCustomers(prev => prev.map(customer => {
      if (customer.id !== customerId) return customer;
      return {
        ...customer,
        photos: customer.photos.map(photo =>
          photo.id === photoId ? { ...photo, ...updates } : photo
        )
      };
    }));

    if (currentCustomer?.id === customerId) {
      setCurrentCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photos: prev.photos.map(photo =>
            photo.id === photoId ? { ...photo, ...updates } : photo
          )
        };
      });
    }
    console.log('[CustomerContext] 更新照片', { customerId, photoId, updates });
  }, [currentCustomer]);

  const addPhoto = useCallback((customerId: string, position: string, url: string) => {
    const newPhoto: PhotoItem = {
      id: generateId(),
      position,
      url,
      status: 'captured',
      capturedAt: new Date().toISOString()
    };

    setCustomers(prev => prev.map(customer => {
      if (customer.id !== customerId) return customer;
      return {
        ...customer,
        photos: [...customer.photos, newPhoto]
      };
    }));

    if (currentCustomer?.id === customerId) {
      setCurrentCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photos: [...prev.photos, newPhoto]
        };
      });
    }
    console.log('[CustomerContext] 添加照片', { customerId, position });
  }, [currentCustomer]);

  const confirmPhoto = useCallback((customerId: string, photoId: string) => {
    updateCustomerPhoto(customerId, photoId, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString()
    });
    console.log('[CustomerContext] 确认照片', { customerId, photoId });
  }, [updateCustomerPhoto]);

  const archiveCustomerPhotos = useCallback((customerId: string) => {
    const now = new Date().toISOString();

    setCustomers(prev => prev.map(customer => {
      if (customer.id !== customerId) return customer;
      const archivedPhotos = customer.photos.map(photo => {
        if (photo.status === 'pending') return photo;
        return {
          ...photo,
          status: 'completed' as const,
          confirmedAt: photo.confirmedAt || now,
          archivedAt: now
        };
      });
      return {
        ...customer,
        status: 'completed' as const,
        photos: archivedPhotos,
        completedAt: now
      };
    }));

    if (currentCustomer?.id === customerId) {
      setCurrentCustomer(prev => {
        if (!prev) return null;
        const now = new Date().toISOString();
        const archivedPhotos = prev.photos.map(photo => {
          if (photo.status === 'pending') return photo;
          return {
            ...photo,
            status: 'completed' as const,
            confirmedAt: photo.confirmedAt || now,
            archivedAt: now
          };
        });
        return {
          ...prev,
          status: 'completed' as const,
          photos: archivedPhotos,
          completedAt: now
        };
      });
    }

    console.log('[CustomerContext] 归档客户照片', { customerId });
  }, [currentCustomer]);

  const updateCustomerInfo = useCallback((customerId: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer =>
      customer.id === customerId ? { ...customer, ...updates } : customer
    ));

    if (currentCustomer?.id === customerId) {
      setCurrentCustomer(prev => prev ? { ...prev, ...updates } : null);
    }
    console.log('[CustomerContext] 更新客户信息', { customerId, updates });
  }, [currentCustomer]);

  const updateCustomerStatus = useCallback((customerId: string, status: Customer['status']) => {
    updateCustomerInfo(customerId, { status });
    console.log('[CustomerContext] 更新客户状态', { customerId, status });
  }, [updateCustomerInfo]);

  const getPendingCustomers = useCallback(() => {
    return customers.filter(c => c.status === 'pending_info' || c.photos.some(p => p.status === 'pending'));
  }, [customers]);

  const getTodayCustomers = useCallback(() => {
    return customers;
  }, [customers]);

  const searchCustomers = useCallback((keyword: string) => {
    if (!keyword.trim()) return customers;
    const lowerKeyword = keyword.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(lowerKeyword) ||
      c.phone.includes(keyword) ||
      (c.nickname && c.nickname.toLowerCase().includes(lowerKeyword))
    );
  }, [customers]);

  return (
    <CustomerContext.Provider
      value={{
        customers,
        currentCustomer,
        setCurrentCustomer,
        updateCustomerPhoto,
        addPhoto,
        confirmPhoto,
        archiveCustomerPhotos,
        updateCustomerInfo,
        updateCustomerStatus,
        getPendingCustomers,
        getTodayCustomers,
        searchCustomers
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
