import Taro from '@tarojs/taro';

const SHARE_TOKEN_KEY = 'clinic_share_tokens_v1';

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

export const generateShareToken = (customerId: string): { token: string; expireAt: string; shareUrl: string } => {
  const token = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const tokens = Taro.getStorageSync(SHARE_TOKEN_KEY) || {};
    tokens[customerId] = { token, expireAt, createdAt: new Date().toISOString() };
    Taro.setStorageSync(SHARE_TOKEN_KEY, tokens);
    console.log('[Utils] 生成分享Token:', { customerId, expireAt });
  } catch (e) {
    console.warn('[Utils] 保存分享Token失败:', e);
  }

  const shareUrl = `/pages/share/index?customerId=${encodeURIComponent(customerId)}&token=${encodeURIComponent(token)}`;
  return { token, expireAt, shareUrl };
};

export const getQrCodeUrl = (customerId: string): { qrImageUrl: string; shareUrl: string; token: string; expireAt: string } => {
  const { token, expireAt, shareUrl } = generateShareToken(customerId);

  const host = 'https://example.miniprogram.com';
  const fullUrl = `${host}${shareUrl}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}&margin=10`;

  console.log('[Utils] 生成二维码URL:', { fullUrl, qrImageUrl });

  return { qrImageUrl, shareUrl, token, expireAt };
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
