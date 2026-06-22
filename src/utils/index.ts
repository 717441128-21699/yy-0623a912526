import Taro from '@tarojs/taro';
import { Customer } from '@/types';

interface SharePayload {
  cid: string;
  n: string;
  pt: string;
  pn: string;
  tn: string;
  ca: string;
  auth: boolean;
  exp: number;
  sig: string;
  photos: { pos: string; url: string; cat: string; at: string }[];
}

const simpleHash = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const encodeSharePayload = (customer: Customer): string => {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const completedPhotos = customer.photos
    .filter(p => p.status === 'completed')
    .map(p => ({
      pos: p.position,
      url: p.url,
      cat: p.capturedAt || '',
      at: p.archivedAt || ''
    }));
  const raw = {
    cid: customer.id,
    n: customer.name,
    pt: customer.projectType,
    pn: customer.projectName,
    tn: customer.treatmentNode,
    ca: customer.completedAt || '',
    auth: customer.hasPortraitAuth,
    exp,
    photos: completedPhotos
  };
  const rawStr = JSON.stringify(raw);
  const sig = simpleHash(rawStr);
  const payload: SharePayload = { ...raw, sig };
  const jsonStr = JSON.stringify(payload);
  return btoa(encodeURIComponent(jsonStr));
};

export const decodeSharePayload = (encoded: string): (Omit<SharePayload, 'sig' | 'exp'> & { expireAt: string }) | null => {
  try {
    const jsonStr = decodeURIComponent(atob(encoded));
    const payload: SharePayload = JSON.parse(jsonStr);
    if (!payload.exp || Date.now() > payload.exp) return null;
    const { sig, ...raw } = payload;
    const rawStr = JSON.stringify(raw);
    if (simpleHash(rawStr) !== sig) return null;
    if (!raw.auth) return null;
    if (!raw.photos || raw.photos.length === 0) return null;
    return {
      cid: raw.cid,
      n: raw.n,
      pt: raw.pt,
      pn: raw.pn,
      tn: raw.tn,
      ca: raw.ca,
      auth: raw.auth,
      expireAt: new Date(raw.exp).toISOString(),
      photos: raw.photos
    };
  } catch {
    return null;
  }
};

export const generateShareQrCode = (customer: Customer): {
  qrImageUrl: string;
  shareUrl: string;
  payload: string;
  expireAt: string;
} => {
  const payload = encodeSharePayload(customer);
  const shareUrl = `weixin://dl/business/?appid=cli_share&path=pages/share/index&query=payload%3D${payload}`;
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedShareUrl}&margin=10&color=4A90E2`;
  const decoded = decodeSharePayload(payload);
  const expireAt = decoded?.expireAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return { qrImageUrl, shareUrl, payload, expireAt };
};

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

export const savePhotoFile = async (tempFilePath: string): Promise<string> => {
  try {
    const fs = Taro.getFileSystemManager();
    return new Promise((resolve, reject) => {
      fs.saveFile({
        tempFilePath,
        success: (res) => {
          console.log('[Utils] 照片保存成功:', res.savedFilePath);
          resolve(res.savedFilePath);
        },
        fail: (err) => {
          console.warn('[Utils] 照片保存失败，使用临时路径:', err);
          resolve(tempFilePath);
        }
      });
    });
  } catch (e) {
    console.warn('[Utils] saveFile 不支持，使用临时路径:', e);
    return tempFilePath;
  }
};
