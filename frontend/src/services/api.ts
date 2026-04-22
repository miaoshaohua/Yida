import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  nickname?: string;
  phone?: string;
  isMember: boolean;
  dailyTryOnCount: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export const authAPI = {
  guestLogin: async (deviceId: string, fingerprint?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/guest-login', { deviceId, fingerprint });
    return response.data;
  },

  sendSms: async (phone: string): Promise<void> => {
    await api.post('/auth/send-sms', { phone });
  },

  smsLogin: async (phone: string, code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/sms-login', { phone, code });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

export interface TryOnTask {
  id: string;
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  personImageUrl: string;
  clothingImageUrl: string;
  resultImageUrl?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export type ClothingType = 'TOP' | 'BOTTOM' | 'DRESS' | 'OUTERWEAR' | 'FULL_BODY';

export interface CreateTryOnTaskRequest {
  personImageKey: string;
  clothImageKey: string;
  clothingType?: ClothingType;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}

export const storageAPI = {
  // 通过后端代理上传图片（推荐，避免 R2 签名问题）
  uploadViaBackend: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ success: boolean; fileKey: string }>(
      '/storage/upload-file',
      formData,
      {
        // 注意：不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
        // 手动设置会导致 iOS 和某些移动端浏览器上传失败
      }
    );
    return response.data.fileKey;
  },

  // 保留原有方法用于兼容
  getPresignedUrl: async (filename: string): Promise<PresignedUrlResponse> => {
    const response = await api.post<PresignedUrlResponse>('/storage/presigned-url', { filename });
    return response.data;
  },

  uploadFile: async (uploadUrl: string, file: File, fileKey: string): Promise<void> => {
    if (uploadUrl.startsWith('http')) {
      // R2 模式：直接上传到预签名 URL（使用 XMLHttpRequest 避免 CORS 签名问题）
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`R2 上传失败: ${xhr.status} ${xhr.statusText}`));
          }
        };
        xhr.onerror = function () {
          reject(new Error('R2 上传失败: 网络错误'));
        };
        xhr.send(file);
      });
    } else {
      // 本地模式：通过后端上传
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`${uploadUrl}?key=${encodeURIComponent(fileKey)}`, formData);
    }
  },
};

export const tryonAPI = {
  createTask: async (data: CreateTryOnTaskRequest): Promise<TryOnTask> => {
    const response = await api.post<TryOnTask>('/tryon/tasks', data);
    return response.data;
  },

  getTask: async (taskId: string): Promise<TryOnTask> => {
    const response = await api.get<TryOnTask>(`/tryon/tasks/${taskId}`);
    return response.data;
  },

  getMyTasks: async (page: number = 1, limit: number = 10): Promise<{ tasks: TryOnTask[], total: number }> => {
    const response = await api.get<{ tasks: TryOnTask[], total: number }>('/tryon/tasks/my', {
      params: { page, limit },
    });
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/tryon/tasks/${taskId}`);
  },
};

export default api;
