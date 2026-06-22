import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Customer, PhotoItem } from '@/types';
import { mockCustomers } from '@/data/mockData';
import { generateId, showToast } from '@/utils';

interface CustomerContextType {
  customers: Customer[];
  currentCustomer: Customer | null;
  setCurrentCustomer: (customer: Customer | null) => void;
  updateCustomerPhoto: (customerId: string, photoId: string, updates: Partial<PhotoItem>) => void;
  addPhoto: (customerId: string, position: string, url: string) => void;
  confirmPhoto: (customerId: string, photoId: string) => void;
  updateCustomerInfo: (customerId: string, updates: Partial<Customer>) => void;
  updateCustomerStatus: (customerId: string, status: Customer['status']) => void;
  getPendingCustomers: () => Customer[];
  getTodayCustomers: () => Customer[];
  searchCustomers: (keyword: string) => Customer[];
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

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
    showToast('照片已确认', 'success');
    console.log('[CustomerContext] 确认照片', { customerId, photoId });
  }, [updateCustomerPhoto]);

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
