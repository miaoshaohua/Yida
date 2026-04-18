import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAuthAPI, Admin } from '../services/adminApi';

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedAdmin = localStorage.getItem('admin');

    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
      checkAuth(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async (_currentToken: string) => {
    try {
      const adminData = await adminAuthAPI.getCurrentAdmin();
      setAdmin(adminData);
      localStorage.setItem('admin', JSON.stringify(adminData));
    } catch (error) {
      console.error('认证检查失败:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await adminAuthAPI.login(username, password);
    setToken(response.access_token);
    setAdmin(response.admin);
    localStorage.setItem('adminToken', response.access_token);
    localStorage.setItem('admin', JSON.stringify(response.admin));
  };

  const logout = async () => {
    try {
      await adminAuthAPI.logout();
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      setToken(null);
      setAdmin(null);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
