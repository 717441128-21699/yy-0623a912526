import Taro from '@tarojs/taro';

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const showToast = (title: string, icon: 'success' | 'error' | 'none' = 'none') => {
  Taro.showToast({
    title,
    icon,
    duration: 2000
  });
};

export const showModal = (content: string, title: string = '提示'): Promise<boolean> => {
  return new Promise((resolve) => {
    Taro.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const calculatePhotoProgress = (photos: { status: string }[]): { completed: number; total: number; percent: number } => {
  const total = photos.length;
  const completed = photos.filter(p => p.status === 'confirmed' || p.status === 'completed').length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
};

export const getQrCodeUrl = (customerId: string): string => {
  return `https://picsum.photos/id/200/300/300`;
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};
