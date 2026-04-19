import axios from 'axios';

export const adminApi = axios.create({
  baseURL: '/api/admin',
  timeout: 10000,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export interface Admin {
  id: string;
  username: string;
  email?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  loginCount: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AdminAuthResponse {
  access_token: string;
  admin: Admin;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTryOns: number;
  todayTryOns: number;
  totalOrders: number;
  revenue: number;
}

export interface User {
  id: string;
  phone?: string;
  email?: string;
  nickname?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'DISABLED';
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  dailyTryOnCount: number;
  totalTryOnCount: number;
  createdAt: string;
}

export interface TryOnRecord {
  id: string;
  userId: string;
  user?: User;
  personImageKey: string;
  clothImageKey: string;
  resultImageKey?: string;
  personImageUrl?: string;
  clothImageUrl?: string;
  resultImageUrl?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  user?: User;
  amount: number;
  productType: 'MONTHLY' | 'YEARLY';
  status: 'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELLED';
  paidAt?: string;
  refundedAt?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  adminId: string;
  adminName: string;
  operationType: string;
  module: string;
  entityId: string;
  details: string;
  beforeData: any;
  afterData: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface ApiLog {
  id: string;
  taskId: string | null;
  endpoint: string;
  method: string;
  requestData: any;
  responseData: any;
  clothingType: string | null;
  category: string | null;
  statusCode: number | null;
  duration: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export const adminAuthAPI = {
  login: async (username: string, password: string): Promise<AdminAuthResponse> => {
    const response = await adminApi.post<AdminAuthResponse>('/auth/login', { username, password });
    return response.data;
  },

  getCurrentAdmin: async (): Promise<Admin> => {
    const response = await adminApi.get<Admin>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await adminApi.post('/auth/logout');
  },
};

export const adminDashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await adminApi.get<DashboardStats>('/dashboard');
    return response.data;
  },
};

export const adminUsersAPI = {
  getUsers: async (
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    filters?: {
      dailyTryOnCount?: number;
      minTotalTryOn?: number;
      maxTotalTryOn?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ users: User[], total: number }> => {
    const response = await adminApi.get<{ users: User[], total: number }>('/users', {
      params: { page, pageSize, search, ...filters },
    });
    return response.data;
  },

  getUserDetail: async (userId: string): Promise<User> => {
    const response = await adminApi.get<User>(`/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, data: { nickname?: string; phone?: string; email?: string; status?: string }): Promise<User> => {
    const response = await adminApi.put<User>(`/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await adminApi.delete(`/users/${userId}`);
  },

  batchDeleteUsers: async (userIds: string[]): Promise<{ message: string }> => {
    const response = await adminApi.post<{ message: string }>('/users/batch-delete', { userIds });
    return response.data;
  },
};

export const adminAdminsAPI = {
  getAdmins: async (page: number = 1, pageSize: number = 20, search?: string): Promise<{ admins: Admin[], total: number }> => {
    const response = await adminApi.get<{ admins: Admin[], total: number }>('/admins', {
      params: { page, pageSize, search },
    });
    return response.data;
  },

  createAdmin: async (data: { username: string; email?: string; password: string; role?: string }): Promise<Admin> => {
    const response = await adminApi.post<Admin>('/admins', data);
    return response.data;
  },

  updateAdmin: async (adminId: string, data: { email?: string; password?: string; role?: string; status?: string }): Promise<Admin> => {
    const response = await adminApi.put<Admin>(`/admins/${adminId}`, data);
    return response.data;
  },

  deleteAdmin: async (adminId: string): Promise<void> => {
    await adminApi.delete(`/admins/${adminId}`);
  },
};

export const adminTryOnAPI = {
  getRecords: async (page: number = 1, pageSize: number = 20, userId?: string): Promise<{ records: TryOnRecord[], total: number }> => {
    const response = await adminApi.get<{ records: TryOnRecord[], total: number }>('/tryon-records', {
      params: { page, pageSize, userId },
    });
    return response.data;
  },

  getRecordDetail: async (recordId: string): Promise<TryOnRecord> => {
    const response = await adminApi.get<TryOnRecord>(`/tryon-records/${recordId}`);
    return response.data;
  },

  deleteRecord: async (recordId: string): Promise<void> => {
    await adminApi.delete(`/tryon-records/${recordId}`);
  },

  batchDeleteRecords: async (recordIds: string[]): Promise<void> => {
    await adminApi.post('/tryon-records/batch-delete', { recordIds });
  },
};

export const adminOrdersAPI = {
  getOrders: async (page: number = 1, pageSize: number = 20, status?: string): Promise<{ orders: Order[], total: number }> => {
    const response = await adminApi.get<{ orders: Order[], total: number }>('/orders', {
      params: { page, pageSize, status },
    });
    return response.data;
  },

  getOrderDetail: async (orderId: string): Promise<Order> => {
    const response = await adminApi.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  refundOrder: async (orderId: string): Promise<void> => {
    await adminApi.post(`/orders/${orderId}/refund`);
  },

  batchDeleteOrders: async (orderIds: string[]): Promise<{ message: string }> => {
    const response = await adminApi.post<{ message: string }>('/orders/batch-delete', { orderIds });
    return response.data;
  },
};

export const adminPhotosAPI = {
  getPhotos: async (page: number = 1, pageSize: number = 20, expiringSoon?: boolean): Promise<{ photos: Photo[], total: number }> => {
    const response = await adminApi.get<{ photos: Photo[], total: number }>('/photos', {
      params: { page, pageSize, expiringSoon },
    });
    return response.data;
  },

  batchDeletePhotos: async (photoIds: string[]): Promise<{ message: string }> => {
    const response = await adminApi.post<{ message: string }>('/photos/batch-delete', { photoIds });
    return response.data;
  },
};

export const adminConfigsAPI = {
  getConfigs: async (): Promise<SystemConfig[]> => {
    const response = await adminApi.get<SystemConfig[]>('/configs');
    return response.data;
  },

  updateConfig: async (configKey: string, value: string): Promise<void> => {
    await adminApi.put(`/configs/${configKey}`, { value });
  },
};

export const adminLogsAPI = {
  getLogs: async (page: number = 1, pageSize: number = 20, module?: string, operationType?: string, adminId?: string): Promise<{ logs: OperationLog[], total: number }> => {
    const response = await adminApi.get<{ logs: OperationLog[], total: number }>('/operation-logs', {
      params: { page, pageSize, module, operationType, adminId },
    });
    return response.data;
  },
};

export const adminApiLogsAPI = {
  getApiLogs: async (page: number = 1, pageSize: number = 20, clothingType?: string, statusCode?: number): Promise<{ logs: ApiLog[], total: number }> => {
    const response = await adminApi.get<{ logs: ApiLog[], total: number }>('/api-logs', {
      params: { page, pageSize, clothingType, statusCode },
    });
    return response.data;
  },

  getApiLogDetail: async (id: string): Promise<ApiLog> => {
    const response = await adminApi.get<ApiLog>(`/api-logs/${id}`);
    return response.data;
  },
};

export default adminApi;
