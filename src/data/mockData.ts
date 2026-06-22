import { Customer, ProjectType, CaptureGuide } from '@/types';

const generatePhone = () => {
  const prefix = ['138', '139', '158', '188', '186'];
  return prefix[Math.floor(Math.random() * prefix.length)] + Math.random().toString().slice(2, 10);
};

const names = ['张美丽', '李青春', '王焕颜', '刘思琪', '陈雅婷', '杨紫萱', '赵梦瑶', '黄诗涵', '周佳怡', '吴雨霏'];

const projectTypes: ProjectType[] = ['water', 'photo', 'inject', 'skin'];

const projectNames: Record<ProjectType, string[]> = {
  water: ['水光补水', '动能素水光', '三文鱼水光', '基础水光'],
  photo: ['光子嫩肤', '皮秒祛斑', '热玛吉', '超声炮'],
  inject: ['玻尿酸填充', '除皱针', '瘦脸针', '轮廓固定'],
  skin: ['清洁管理', '补水管理', '美白管理', '抗衰管理']
};

const treatmentNodes = ['首次治疗', '第二次治疗', '第三次治疗', '疗程中', '维护期'];

const generatePhotos = (projectType: ProjectType, count: number = 5, allCompleted: boolean = false) => {
  const positionMap: Record<ProjectType, string[]> = {
    water: ['正面', '左侧45°', '右侧45°', '左侧90°', '右侧90°'],
    photo: ['正面', '左侧45°', '右侧45°', '左侧90°', '右侧90°', '局部特写'],
    inject: ['正面', '左侧45°', '右侧45°', '注射部位特写'],
    skin: ['正面', '左侧45°', '右侧45°', '皮肤检测图']
  };

  const positions = positionMap[projectType];
  return positions.slice(0, count).map((position, index) => {
    const baseTime = new Date(Date.now() - index * 3600000);
    const capturedAt = baseTime.toISOString();
    const confirmedAt = new Date(baseTime.getTime() + 60000).toISOString();
    const archivedAt = new Date(baseTime.getTime() + 120000).toISOString();

    let status: 'pending' | 'captured' | 'confirmed' | 'completed';
    if (allCompleted) {
      status = 'completed';
    } else {
      status = index < 2 ? 'confirmed' : index < 4 ? 'captured' : 'pending';
    }

    return {
      id: `photo_${Date.now()}_${index}`,
      position,
      url: `https://picsum.photos/id/${100 + index * 10}/600/800`,
      cloudUrl: `https://picsum.photos/id/${100 + index * 10}/600/800`,
      status,
      capturedAt,
      confirmedAt: status === 'confirmed' || status === 'completed' ? confirmedAt : undefined,
      archivedAt: status === 'completed' ? archivedAt : undefined
    };
  });
};

export const mockCustomers: Customer[] = names.map((name, index) => {
  const projectType = projectTypes[index % projectTypes.length];
  const projectName = projectNames[projectType][index % projectNames[projectType].length];
  const hour = 9 + Math.floor(index / 2);
  const minute = (index % 2) * 30;
  const status = index === 0 ? 'photographing' as const :
    index === 1 ? 'confirming' as const :
      index < 4 ? 'waiting' as const :
        index < 7 ? 'completed' as const :
          'pending_info' as const;
  const isCompleted = status === 'completed';

  return {
    id: `customer_${index + 1}`,
    name,
    nickname: index % 3 === 0 ? undefined : `小${name.charAt(0)}`,
    phone: generatePhone(),
    consultant: index % 4 === 0 ? undefined : ['李咨询师', '王咨询师', '张咨询师'][index % 3],
    projectType,
    projectName,
    appointmentTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    status,
    photos: generatePhotos(projectType, undefined, isCompleted),
    hasPortraitAuth: index % 5 !== 4,
    treatmentNode: treatmentNodes[index % treatmentNodes.length],
    createdAt: new Date().toISOString(),
    completedAt: isCompleted ? new Date().toISOString() : undefined
  };
});

export const captureGuides: Record<ProjectType, CaptureGuide> = {
  water: {
    projectType: 'water',
    projectName: '水光项目',
    positions: [
      { name: '正面', description: '面部正对镜头，双耳对称可见', example: 'https://picsum.photos/id/1011/600/800' },
      { name: '左侧45°', description: '面部向左转45°，右眼可见', example: 'https://picsum.photos/id/1012/600/800' },
      { name: '右侧45°', description: '面部向右转45°，左眼可见', example: 'https://picsum.photos/id/1013/600/800' },
      { name: '左侧90°', description: '面部完全向左转，仅左耳可见', example: 'https://picsum.photos/id/1014/600/800' },
      { name: '右侧90°', description: '面部完全向右转，仅右耳可见', example: 'https://picsum.photos/id/1015/600/800' }
    ]
  },
  photo: {
    projectType: 'photo',
    projectName: '光电项目',
    positions: [
      { name: '正面', description: '面部正对镜头，双耳对称可见', example: 'https://picsum.photos/id/1021/600/800' },
      { name: '左侧45°', description: '面部向左转45°，右眼可见', example: 'https://picsum.photos/id/1022/600/800' },
      { name: '右侧45°', description: '面部向右转45°，左眼可见', example: 'https://picsum.photos/id/1023/600/800' },
      { name: '左侧90°', description: '面部完全向左转，仅左耳可见', example: 'https://picsum.photos/id/1024/600/800' },
      { name: '右侧90°', description: '面部完全向右转，仅右耳可见', example: 'https://picsum.photos/id/1025/600/800' },
      { name: '局部特写', description: '针对治疗部位的近距离拍摄', example: 'https://picsum.photos/id/1026/600/800' }
    ]
  },
  inject: {
    projectType: 'inject',
    projectName: '注射项目',
    positions: [
      { name: '正面', description: '面部正对镜头，无表情放松状态', example: 'https://picsum.photos/id/1031/600/800' },
      { name: '左侧45°', description: '面部向左转45°，右眼可见', example: 'https://picsum.photos/id/1032/600/800' },
      { name: '右侧45°', description: '面部向右转45°，左眼可见', example: 'https://picsum.photos/id/1033/600/800' },
      { name: '注射部位特写', description: '近距离清晰展示注射区域', example: 'https://picsum.photos/id/1034/600/800' }
    ]
  },
  skin: {
    projectType: 'skin',
    projectName: '皮肤管理',
    positions: [
      { name: '正面', description: '面部正对镜头，自然光下', example: 'https://picsum.photos/id/1041/600/800' },
      { name: '左侧45°', description: '面部向左转45°，展示皮肤状态', example: 'https://picsum.photos/id/1042/600/800' },
      { name: '右侧45°', description: '面部向右转45°，展示皮肤状态', example: 'https://picsum.photos/id/1043/600/800' },
      { name: '皮肤检测图', description: '使用皮肤检测仪拍摄的分析图', example: 'https://picsum.photos/id/1044/600/800' }
    ]
  }
};

export const photoTips = [
  '摘眼镜',
  '束发',
  '同角度',
  '同光线'
];

export const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
};

export const getWeekDay = () => {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return days[new Date().getDay()];
};
