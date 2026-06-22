export type ProjectType = 'water' | 'photo' | 'inject' | 'skin';

export type PhotoStatus = 'pending' | 'captured' | 'confirmed' | 'completed';

export type CustomerStatus = 'waiting' | 'photographing' | 'confirming' | 'completed' | 'pending_info';

export interface ProjectItem {
  id: string;
  name: string;
  type: ProjectType;
  color: string;
  positions: string[];
}

export interface PhotoItem {
  id: string;
  position: string;
  url: string;
  status: PhotoStatus;
  capturedAt?: string;
  confirmedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  nickname?: string;
  phone: string;
  consultant?: string;
  projectType: ProjectType;
  projectName: string;
  appointmentTime: string;
  status: CustomerStatus;
  photos: PhotoItem[];
  hasPortraitAuth: boolean;
  treatmentNode: string;
  createdAt: string;
}

export interface CaptureGuide {
  projectType: ProjectType;
  projectName: string;
  positions: {
    name: string;
    description: string;
    example: string;
  }[];
}

export const PROJECT_TYPE_MAP: Record<ProjectType, { name: string; color: string }> = {
  water: { name: '水光', color: '#722ED1' },
  photo: { name: '光电', color: '#FA8C16' },
  inject: { name: '注射', color: '#EB2F96' },
  skin: { name: '皮肤管理', color: '#13C2C2' }
};

export const STATUS_MAP: Record<CustomerStatus, { text: string; color: string }> = {
  waiting: { text: '等待拍摄', color: '#FF7A45' },
  photographing: { text: '拍摄中', color: '#4A90E2' },
  confirming: { text: '确认中', color: '#FA8C16' },
  completed: { text: '已完成', color: '#52C41A' },
  pending_info: { text: '待补资料', color: '#F5222D' }
};

export const PHOTO_STATUS_MAP: Record<PhotoStatus, { text: string; color: string }> = {
  pending: { text: '待拍摄', color: '#86909C' },
  captured: { text: '已拍摄', color: '#4A90E2' },
  confirmed: { text: '已确认', color: '#52C41A' },
  completed: { text: '已归档', color: '#52C41A' }
};
